import {
  Annotation,
  EditorState, RangeSetBuilder, StateField, Transaction,
  TransactionSpec
} from "@codemirror/state";
import {
  Decoration, DecorationSet,
  EditorView,
  ViewPlugin, WidgetType
} from "@codemirror/view";
import { hoverTooltip } from "cm-extensions/tooltip";
import React from "react";
import { createRoot } from "react-dom/client";
import {
  iterateTreeInSelection
} from "utils/codemirror";
import { flowTypeStateField } from "../markSans/callout";


import { FlowEditorHover } from "components/FlowEditor/FlowEditorHover";
import { loadFlowEditorByDOM, openFileFlowEditor } from "dispatch/flowDispatch";
import t from "i18n";
import { uiIconSet } from "utils/icons";
import { compareByField } from "utils/tree";
import { genId } from "utils/uuid";

//flow editor

export interface FlowEditorInfo {
  id: string;
  link: string;
  from: number;
  to: number;
  height: number;
  embed: number;
  startOfLineFix: boolean;
  expandedState: number; //0 is closed, 1 is autoopen (prevent infinite nesting), 2 is open, move to enum
}

export const toggleFlowEditor =
  Annotation.define<[id: string, state: number]>();
export const cacheFlowEditorHeight =
  Annotation.define<[id: string, height: number]>();

export const preloadFlowEditor = EditorState.transactionFilter.of(
  (tr: Transaction) => {
    let newTrans = [] as TransactionSpec[];
    const value = tr.state.field(flowEditorInfo, false);
    if (value && !tr.annotation(toggleFlowEditor)) {
      newTrans.push(
        ...value
          .filter((f) => f.expandedState == 1)
          .map((f) => {
            if (tr.state.field(flowTypeStateField) == "doc") {
              return {
                annotations: toggleFlowEditor.of([f.id, 2]),
              };
            } else {
              return {
                annotations: toggleFlowEditor.of([f.id, 0]),
              };
            }
          })
      );
    }
    return [tr, ...newTrans];
  }
);

export const internalLinkToggle = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {}
  },
  {
    eventHandlers: {
      mousedown: (e: MouseEvent, view) => {
        
        let pos = view.posAtDOM(e.target as Node);
        let { from: lineFrom, to: lineTo, text } = view.state.doc.lineAt(pos);
        for (let match of text.matchAll(/(?!\!)\[\[([^\]]+)\]\]/g)) {
          const stateField = view.state.field(flowEditorInfo, false);
          const info = stateField.find(
            (f) => f.to == lineFrom + match.index + match[1].length + 2
          );
          if (info) {
            e.preventDefault();
            view.dispatch({
              annotations: toggleFlowEditor.of([info.id, 2]),
            });
          }
        }
      },
    },
  }
);

export const internalLinkHover = hoverTooltip((view, pos, side) => {
  let { from: lineFrom, to: lineTo, text } = view.state.doc.lineAt(pos);
  let hovObject = null;
  iterateTreeInSelection({ from: lineFrom, to: lineTo }, view.state, {
    enter: ({ name, from, to }) => {
      if (name.contains("hmd-internal-link") && pos <= to && pos >= from) {
        const stateField = view.state.field(flowEditorInfo, false);
        const info = stateField.find((f) => f.to == to);
        if (info) {
          hovObject = {
            pos: pos - 5,
            end: to,
            above: true,
            create(view: EditorView) {
              let dom = document.createElement("div");
              dom.toggleClass("mk-flow-hover", true);
              dom.toggleClass("menu", true);
              const openHoverDiv = dom.createDiv();
              openHoverDiv.setAttribute(
                "aria-label",
                info.expandedState == 0
                  ? t.buttons.openFlow
                  : t.buttons.hideFlow
              );
              openHoverDiv.addEventListener("click", () => {
                view.dispatch({
                  annotations: toggleFlowEditor.of([info.id, 2]),
                });
              });
              const icon = openHoverDiv.createDiv();
              icon.innerHTML = uiIconSet["mk-ui-flow-hover"];
              openHoverDiv.insertAdjacentText(
                "beforeend",
                info.expandedState == 0
                  ? t.buttons.openFlow
                  : t.buttons.hideFlow
              );
              return { dom };
            },
          };
          return false;
        }
      }
    },
  });

  return hovObject;
});

export const flowEditorInfo = StateField.define<FlowEditorInfo[]>({
  create() {
    return [];
  },
  update(value, tr) {
    let newValues = [] as FlowEditorInfo[];
    const previous = value;
    let usedContainers: string[] = [];

    let str = tr.newDoc.sliceString(0);

    const reverseExpandedState = (state: number) => {
      const news = state != 2 ? 2 : 0;
      return news;
    };

    for (let match of str.matchAll(/(?:!\[!\[|!!\[\[)([^\]]+)\]\]/g)) {
      const link = match[1];
      const existingLinks = previous.filter((f) => f.link == link);
      const offset = usedContainers.filter((f) => f == link).length;
      const existingInfo = existingLinks[offset];
      const id = existingInfo ? existingInfo.id : genId();
      usedContainers.push(link);
      const info = {
        id: id,
        link: match[1],
        startOfLineFix: false,
        from: match.index + 4,
        to: match.index + 4 + match[1].length,
        embed: 1,
        height: existingInfo
          ? tr.annotation(cacheFlowEditorHeight)?.[0] == id &&
            tr.annotation(cacheFlowEditorHeight)?.[1] != 0
            ? tr.annotation(cacheFlowEditorHeight)?.[1]
            : existingInfo.height
          : -1,
        expandedState: existingInfo
          ? tr.annotation(toggleFlowEditor)?.[0] == id
            ? reverseExpandedState(existingInfo.expandedState)
            : existingInfo.expandedState
          : 1,
      };
      newValues.push(info);
    }

    for (let match of str.matchAll(/(?!\!)\[\[([^\]]+)\]\]/g)) {
      const link = match[1];
      const existingLinks = previous.filter((f) => f.link == link);
      const offset = usedContainers.filter((f) => f == link).length;
      const existingInfo = existingLinks[offset];
      const id = existingInfo ? existingInfo.id : genId();
      usedContainers.push(link);
      const info = {
        id: id,
        link: match[1],
        startOfLineFix: false,
        from: match.index + 2,
        to: match.index + 2 + match[1].length,
        embed: 0,
        height: existingInfo
          ? tr.annotation(cacheFlowEditorHeight)?.[0] == id &&
            tr.annotation(cacheFlowEditorHeight)?.[1] != 0
            ? tr.annotation(cacheFlowEditorHeight)?.[1]
            : existingInfo.height
          : -1,
        expandedState: existingInfo
          ? tr.annotation(toggleFlowEditor)?.[0] == id
            ? reverseExpandedState(existingInfo.expandedState)
            : existingInfo.expandedState
          : 0,
      };
      newValues.push(info);
    }

    for (let match of str.matchAll(/(?!\!)\!\[\[([^\]]+)\]\]/g)) {
      const link = match[1];
      const existingLinks = previous.filter((f) => f.link == link);
      const offset = usedContainers.filter((f) => f == link).length;
      const existingInfo = existingLinks[offset];
      const id = existingInfo ? existingInfo.id : genId();
      usedContainers.push(link);
      const info = {
        id: id,
        link: match[1],
        startOfLineFix: false,
        from: match.index + 3,
        to: match.index + 3 + match[1].length,
        embed: 2,
        height: existingInfo
          ? tr.annotation(cacheFlowEditorHeight)?.[0] == id &&
            tr.annotation(cacheFlowEditorHeight)?.[1] != 0
            ? tr.annotation(cacheFlowEditorHeight)?.[1]
            : existingInfo.height
          : -1,
        expandedState: existingInfo
          ? tr.annotation(toggleFlowEditor)?.[0] == id
            ? reverseExpandedState(existingInfo.expandedState)
            : existingInfo.expandedState
          : 1,
      };
      newValues.push(info);
    }
    newValues.sort(compareByField("from", true));
    return newValues;
  },
});

const flowEditorRangeset = (state: EditorState) => {
  let builder = new RangeSetBuilder<Decoration>();
  const infoFields = state.field(flowEditorInfo);
  for (let info of infoFields) {
    const { from, to, embed: embedType, expandedState } = info;
    const lineFix =
      from - 3 == state.doc.lineAt(from).from &&
      to + 2 == state.doc.lineAt(from).to;
    if (expandedState == 2) {
      if (embedType == 1) {
        if (
          !(
            (state.selection.main.from == from - 4 &&
              state.selection.main.to == to + 2) ||
            (state.selection.main.from >= from - 3 &&
              state.selection.main.to <= to + 1)
          )
        ) {
          builder.add(from - 4, from - 3, flowEditorSelector(info));
          if (lineFix) {
            builder.add(from - 3, to + 2, flowEditorWidgetDecoration(info));
          } else {
            builder.add(from - 3, to + 2, flowEditorDecoration(info));
          }
        }
      } else if (embedType == 0) {
        //if (!(tr.newSelection.main.from >= from+2 && tr.newSelection.main.to <= to-2)) {
        builder.add(to + 2, to + 2, flowEditorDecoration(info));
        //}
      }
    }
  }
  const dec = builder.finish();
  return dec;
};

export const flowEditorField = StateField.define<DecorationSet>({
  create(state) {
    return flowEditorRangeset(state);
  },
  update(value, tr) {
    return flowEditorRangeset(tr.state);
  },
  provide: (f) => EditorView.decorations.from(f),
});

class FlowEditorWidget extends WidgetType {
  constructor(readonly info: FlowEditorInfo) {
    super();
  }

  eq(other: WidgetType) {
    return (other as unknown as FlowEditorWidget).info.id === this.info.id;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.toggleClass("mk-floweditor-container", true);
    div.toggleClass("mk-floweditor-fix", this.info.startOfLineFix);
    div.setAttribute("id", "mk-flow-" + this.info.id);
    const placeholder = div.createDiv("mk-floweditor-placeholder");
    placeholder.style.setProperty("height", this.info.height + "px");
    loadFlowEditorByDOM(div, view, this.info.id);
    return div;
  }
  get estimatedHeight(): number {
    return this.info.height;
  }
}

class FlowEditorSelector extends WidgetType {
  flowInfo: FlowEditorInfo;
  constructor(readonly info: FlowEditorInfo) {
    super();
    this.flowInfo = info;
  }

  eq(other: WidgetType) {
    return false;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.toggleClass("mk-floweditor-selector", true);
    const reactEl = createRoot(div);
    const type = this.info.link.contains("/#^") ? "table" : "file";
    reactEl.render(
      <FlowEditorHover
        toggle={true}
        type={type}
        toggleState={true}
        cutTable={() => {
          navigator.clipboard.writeText(`![![${this.info.link}]]`)
          view.dispatch({
            changes: { from: this.info.from - 4, to: this.info.to + 2 },
          });
        }}
        deleteTable={() => {
          view.dispatch({
            changes: { from: this.info.from - 4, to: this.info.to + 2 },
          });
        }}
        toggleFlow={() => {
          view.dispatch({
            changes: { from: this.info.from - 4, to: this.info.from - 3 },
          });
        }}
        openLink={() => {
          openFileFlowEditor(this.flowInfo.link, "/");
        }}
      ></FlowEditorHover>
    );
    return div;
  }
}

export const flowEditorSelector = (info: FlowEditorInfo) =>
  Decoration.replace({
    widget: new FlowEditorSelector(info),
    inclusive: true,
    block: false,
  });

export const flowEditorDecoration = (info: FlowEditorInfo) =>
  Decoration.replace({
    widget: new FlowEditorWidget(info),
    inclusive: true,
    block: false,
  });

export const flowEditorWidgetDecoration = (info: FlowEditorInfo) =>
  Decoration.widget({
    widget: new FlowEditorWidget(info),
    block: true,
  });
