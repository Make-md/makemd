import {
  Annotation,
  EditorState,
  RangeSetBuilder,
  StateField,
  Transaction,
  TransactionSpec,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import { hoverTooltip } from "adapters/obsidian/ui/editors/markdownView/tooltip";
import { iterateTreeInSelection } from "adapters/obsidian/utils/codemirror";
import React from "react";
import { createRoot } from "react-dom/client";
import { flowTypeStateField } from "./flowStateFields";

import { uiIconSet } from "adapters/obsidian/ui/icons";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";

import { FlowEditorHover } from "adapters/obsidian/ui/editors/markdownView/FlowEditorHover";
import { loadFlowEditorByDOM } from "adapters/obsidian/utils/flow/flowEditor";
import { compareByField } from "core/utils/tree";
import { genId } from "core/utils/uuid";
import { editorInfoField } from "obsidian";

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
    const newTrans = [] as TransactionSpec[];
    const value = tr.state.field(flowEditorInfo, false);
    if (value && !tr.annotation(toggleFlowEditor)) {
      newTrans.push(
        ...value
          .filter((f) => f.expandedState == 1)
          .map((f) => {
            if (tr.state.field(flowTypeStateField, false) == "doc") {
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
    constructor(view: EditorView) {
      //do nothing
    }
  },
  {
    eventHandlers: {
      mousedown: (e: MouseEvent, view) => {
        if (!e.shiftKey) {
          return;
        }
        const pos = view.posAtDOM(e.target as Node);
        const { from: lineFrom, to: lineTo, text } = view.state.doc.lineAt(pos);
        for (const match of text.matchAll(/(?!!)\[\[([^\]]+)\]\]/g)) {
          const stateField = view.state.field(flowEditorInfo, false);
          const info = stateField.find(
            (f) =>
              f.to == lineFrom + match.index + match[1].length + 2 &&
              pos >= f.from &&
              pos <= f.to
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
  const { from: lineFrom, to: lineTo } = view.state.doc.lineAt(pos);
  let hovObject = null;
  iterateTreeInSelection({ from: lineFrom, to: lineTo }, view.state, {
    enter: ({ name, from, to }) => {
      if (name.contains("hmd-internal-link") && pos <= to && pos >= from) {
        const stateField = view.state.field(flowEditorInfo, false);
        const info = stateField.find((f) => f.to == to);
        if (info) {
          hovObject = {
            pos: pos,
            end: to,
            above: true,
            create(view: EditorView) {
              const dom = document.createElement("div");
              dom.toggleClass("mk-flow-hover", true);
              dom.toggleClass("menu", true);
              const openHoverDiv = dom.createDiv();
              openHoverDiv.setAttribute(
                "aria-label",
                info.expandedState == 0
                  ? i18n.buttons.openFlow
                  : i18n.buttons.hideFlow
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
                  ? i18n.buttons.openFlow
                  : i18n.buttons.hideFlow
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
    const newValues = [] as FlowEditorInfo[];
    const previous = value;
    const usedContainers: string[] = [];

    const str = tr.newDoc.sliceString(0);

    const reverseExpandedState = (state: number) => {
      const news = state != 2 ? 2 : 0;
      return news;
    };

    for (const match of str.matchAll(/(?:!\[!\[|!!\[\[)([^\]]+)\]\]/g)) {
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

    for (const match of str.matchAll(/\[\[([^\]]+)\]\]/g)) {
      if (str.charAt(match.index - 1) != "!") {
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
      } else if (str.charAt(match.index - 2) != "!") {
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
    }

    newValues.sort(compareByField("from", true));
    return newValues;
  },
});

const flowEditorRangeset = (state: EditorState, plugin: MakeMDPlugin) => {
  const builder = new RangeSetBuilder<Decoration>();
  const infoFields = state.field(flowEditorInfo, false);
  for (const info of infoFields) {
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
          builder.add(from - 4, from - 3, flowEditorSelector(info, plugin));
          if (lineFix) {
            builder.add(
              from - 3,
              to + 2,
              flowEditorWidgetDecoration(info, plugin)
            );
          } else {
            builder.add(from - 3, to + 2, flowEditorDecoration(info, plugin));
          }
        }
      } else if (embedType == 0) {
        //if (!(tr.newSelection.main.from >= from+2 && tr.newSelection.main.to <= to-2)) {
        builder.add(to + 2, to + 2, flowEditorDecoration(info, plugin));
        //}
      }
    }
  }
  const dec = builder.finish();
  return dec;
};

export const flowEditorField = (plugin: MakeMDPlugin) =>
  StateField.define<DecorationSet>({
    create(state) {
      return flowEditorRangeset(state, plugin);
    },
    update(value, tr) {
      return flowEditorRangeset(tr.state, plugin);
    },
    provide: (f) => EditorView.decorations.from(f),
  });

class FlowEditorWidget extends WidgetType {
  constructor(readonly info: FlowEditorInfo, public plugin: MakeMDPlugin) {
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
    loadFlowEditorByDOM(this.plugin, div, view, this.info.id);
    return div;
  }
  get estimatedHeight(): number {
    return this.info.height;
  }
}

class FlowEditorSelector extends WidgetType {
  flowInfo: FlowEditorInfo;
  plugin: MakeMDPlugin;
  constructor(readonly info: FlowEditorInfo, plugin: MakeMDPlugin) {
    super();
    this.flowInfo = info;
    this.plugin = plugin;
  }

  eq(other: WidgetType) {
    return (other as unknown as FlowEditorSelector).info.id === this.info.id;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.toggleClass("mk-floweditor-selector", true);
    const reactEl = createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;
      const path = this.plugin.superstate.spaceManager.resolvePath(
        this.info.link,
        file?.path
      );
      if (path)
        reactEl.render(
          <FlowEditorHover
            superstate={this.plugin.superstate}
            toggle={true}
            path={path}
            toggleState={true}
            view={view}
            pos={{ from: this.info.from, to: this.info.to }}
            dom={div}
          ></FlowEditorHover>
        );
    }
    return div;
  }
}

export const flowEditorSelector = (
  info: FlowEditorInfo,
  plugin: MakeMDPlugin
) =>
  Decoration.replace({
    widget: new FlowEditorSelector(info, plugin),
    inclusive: true,
    block: false,
  });

export const flowEditorDecoration = (
  info: FlowEditorInfo,
  plugin: MakeMDPlugin
) =>
  Decoration.replace({
    widget: new FlowEditorWidget(info, plugin),
    inclusive: true,
    block: false,
  });

export const flowEditorWidgetDecoration = (
  info: FlowEditorInfo,
  plugin: MakeMDPlugin
) =>
  Decoration.widget({
    widget: new FlowEditorWidget(info, plugin),
    block: true,
  });
