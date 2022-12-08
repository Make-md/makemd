import {
  Decoration,
  WidgetType,
  DecorationSet,
  EditorView,
} from "@codemirror/view";
import {
  StateField,
  RangeSetBuilder,
  Annotation,
  EditorState,
  Transaction,
  TransactionSpec,
  EditorSelection,
  SelectionRange,
} from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import {
  iterateTreeInDocument,
  iterateTreeInSelection,
} from "utils/codemirror";
import { genId } from "components/FlowEditor/FlowEditor";
import { flowTypeStateField } from "../markSans/callout";
import { Tooltip, hoverTooltip } from "cm-extensions/tooltip";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import { info } from "console";
import { openFile } from "utils/utils";
import { loadFlowEditorByDOM, openFileFlowEditor } from "dispatch/flowDispatch";
import { FlowEditorHover } from "components/FlowEditor/FlowEditorHover";
import { MarkdownView } from "obsidian";
import t from "i18n";
import { uiIconSet } from "utils/icons";

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

const findFullInternalLink = (
  posA: number,
  posB: number,
  state: EditorState
): SelectionRange | null => {
  let { text, from, length } = state.doc.lineAt(posA);
  let start = posA - from + 1,
    end = posB - from - 1;
  while (start > 0) {
    let prev = start - 1;
    if (text.slice(prev, start) == "[") break;
    start = prev;
  }
  while (end < length) {
    let next = end + 1;
    if (text.slice(end, next) == "]") break;
    end = next;
  }
  return start == end ? null : EditorSelection.range(start + from, end + from);
};
export const flowEditorInfo = StateField.define<FlowEditorInfo[]>({
  create() {
    return [];
  },
  update(value, tr) {
    let newValues = [] as FlowEditorInfo[];
    const previous = value;
    let usedContainers: string[] = [];
    let nameContainers: string[] = [];
    iterateTreeInDocument(tr.state, {
      enter: ({ name, from, to }) => {
        if (name.contains("hmd-internal-link")) {
          nameContainers.push(name);
          const fullRange = findFullInternalLink(from, to, tr.state);
          const link = tr.state.sliceDoc(fullRange.from, fullRange.to);
          const existingLinks = previous.filter((f) => f.link == link);
          const offset = usedContainers.filter((f) => f == link).length;
          const existingInfo = existingLinks[offset];

          const id = existingInfo ? existingInfo.id : genId(8);

          let listEmbed = false;
          const embedOverride =
            tr.state.sliceDoc(fullRange.from - 4, fullRange.from - 3) == "!";
          const embedType = name.contains("hmd-embed")
            ? embedOverride
              ? 1
              : 2
            : 0;
          // if (embedType == 1) {
          //   iterateTreeInSelection({from: fullRange.from-5, to: fullRange.from-5}, tr.state, {enter:
          //     (node) => {
          //       if (node.name.contains('formatting-task') || node.name.contains('formatting-list')) {
          //         listEmbed = true;
          //       }
          //     }
          //   })
          // }
          const reverseExpandedState = (state: number) => {
            const news = state != 2 ? 2 : 0;
            return news;
          };

          usedContainers.push(link);
          const info = {
            id: id,
            link: tr.state.sliceDoc(fullRange.from, fullRange.to),
            startOfLineFix: listEmbed,
            from: fullRange.from,
            to: fullRange.to,
            embed: embedType,
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
              : embedType >= 1
              ? 1
              : 0,
          };
          newValues.push(info);
        }
      },
    });
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
  constructor(readonly info: FlowEditorInfo) {
    super();
  }

  eq(other: WidgetType) {
    return false;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.toggleClass("mk-floweditor-selector", true);
    const reactEl = createRoot(div);
    reactEl.render(
      <FlowEditorHover
        toggle={true}
        toggleState={true}
        toggleFlow={() => {
          view.dispatch({
            changes: { from: this.info.from - 4, to: this.info.from - 3 },
          });
        }}
        openLink={() => {
          app.workspace.iterateLeaves((leaf) => {
            const cm = (leaf.view as MarkdownView).editor?.cm as EditorView;
            if (cm && view.dom == cm.dom) {
              openFileFlowEditor(
                this.info.link,
                (leaf.view as MarkdownView).file?.path
              );
              // return true;
            }
          }, app.workspace["rootSplit"]!);
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
