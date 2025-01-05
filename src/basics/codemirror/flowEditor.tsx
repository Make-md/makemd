import {
  Annotation,
  EditorState,
  StateField,
  Transaction,
  TransactionSpec,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import { iterateTreeInSelection } from "basics/codemirror";
import { hoverTooltip } from "basics/tooltip";
import React from "react";
import { flowTypeStateField } from "./flowStateFields";

import i18n from "shared/i18n";

import MakeBasicsPlugin from "basics/basics";
import { FlowEditorHover } from "basics/flow/FlowEditorHover";
import { UINote } from "basics/ui/UINote";
import { uiIconSet } from "shared/assets/icons";

import { compareByField } from "basics/utils/utils";
import { editorInfoField } from "obsidian";
import { Root } from "react-dom/client";
import { genId } from "shared/utils/uuid";

//flow editor
export enum FlowEditorState {
  Closed = 0,
  AutoOpen = 1,
  Open = 2,
}
export enum FlowEditorLinkType {
  Link = 0,
  Embed = 1,
  EmbedClosed = 2,
}

export interface FlowEditorInfo {
  id: string;
  link: string;
  from: number;
  type: FlowEditorLinkType;
  to: number;
  height: number;
  expandedState: FlowEditorState; //0 is closed, 1 is autoopen (prevent infinite nesting), 2 is open, move to enum
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

export const internalLinkHover = (plugin: MakeBasicsPlugin) =>
  hoverTooltip((view, pos, side) => {
    const { from: lineFrom, to: lineTo } = view.state.doc.lineAt(pos);
    let hovObject = null;
    iterateTreeInSelection({ from: lineFrom, to: lineTo }, view.state, {
      enter: ({ name, from, to }) => {
        if (name.includes("hmd-internal-link") && pos <= to && pos >= from) {
          const stateField = view.state.field(flowEditorInfo, false);
          const info = stateField.find((f) => f.to == to);
          if (info) {
            hovObject = {
              pos: pos,
              end: to,
              above: true,
              create(view: EditorView) {
                const dom = document.createElement("div");
                dom.classList.add("mk-flow-hover");
                dom.classList.add("menu");
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

    const reverseExpandedState = (state: FlowEditorState) => {
      const news =
        state != FlowEditorState.Open
          ? FlowEditorState.Open
          : FlowEditorState.Closed;
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
        from: match.index + 4,
        to: match.index + 4 + match[1].length,
        type: FlowEditorLinkType.Embed,
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
          from: match.index + 2,
          to: match.index + 2 + match[1].length,
          type: FlowEditorLinkType.Link,
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
          from: match.index + 3,
          to: match.index + 3 + match[1].length,
          type: FlowEditorLinkType.EmbedClosed,
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

class FlowEditorWidget extends WidgetType {
  public root: Root;
  constructor(
    private readonly info: FlowEditorInfo,
    public plugin: MakeBasicsPlugin
  ) {
    super();
  }

  eq(other: WidgetType) {
    return (other as unknown as FlowEditorWidget).info.id === this.info.id;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.classList.add("mk-floweditor-container");

    div.setAttribute("id", "mk-flow-" + this.info.id);
    div.style.setProperty("height", this.info.height + "px");
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;

      this.root = this.plugin.enactor.createRoot(div);
      this.root.render(
        <UINote
          load={true}
          plugin={this.plugin}
          path={this.info.link}
          source={file.path}
        ></UINote>
      );
    }
    return div;
  }
  get estimatedHeight(): number {
    return this.info.height;
  }
  destroy(dom: HTMLElement): void {
    if (this.root) this.root.unmount();
  }
}

export class FlowEditorSelector extends WidgetType {
  flowInfo: FlowEditorInfo;
  plugin: MakeBasicsPlugin;
  constructor(readonly info: FlowEditorInfo, plugin: MakeBasicsPlugin) {
    super();
    this.flowInfo = info;
    this.plugin = plugin;
  }

  eq(other: WidgetType) {
    return (other as unknown as FlowEditorSelector).info.id === this.info.id;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.classList.add("mk-floweditor-selector");
    const reactEl = this.plugin.enactor.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;

      reactEl.render(
        <FlowEditorHover
          app={this.plugin.app}
          plugin={this.plugin}
          toggle={true}
          path={this.info.link}
          source={file?.path}
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
  plugin: MakeBasicsPlugin
) =>
  Decoration.replace({
    widget: new FlowEditorSelector(info, plugin),
    inclusive: true,
    block: false,
  });

export const flowEditorDecoration = (
  info: FlowEditorInfo,
  plugin: MakeBasicsPlugin
) =>
  Decoration.replace({
    widget: new FlowEditorWidget(info, plugin),
    inclusive: true,
    block: false,
  });

export const flowEditorWidgetDecoration = (
  info: FlowEditorInfo,
  plugin: MakeBasicsPlugin
) =>
  Decoration.widget({
    widget: new FlowEditorWidget(info, plugin),
    inclusiveStart: true,
    block: true,
  });
