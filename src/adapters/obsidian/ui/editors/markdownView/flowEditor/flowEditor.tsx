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
import { flowTypeStateField } from "./flowStateFields";

import MakeMDPlugin from "main";
import { i18n } from "makemd-core";

import { FlowEditorHover } from "adapters/obsidian/ui/editors/markdownView/FlowEditorHover";
import { loadFlowEditorByDOM } from "adapters/obsidian/utils/flow/flowEditor";
import { PathStickerContainer } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { CollapseToggle } from "core/react/components/UI/Toggles/CollapseToggle";
import { compareByField } from "core/utils/tree";
import { genId } from "core/utils/uuid";
import { editorInfoField } from "obsidian";

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

export const internalLinkHover = (plugin: MakeMDPlugin) =>
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
                icon.innerHTML = plugin.superstate.ui.getSticker(
                  "ui//mk-ui-flow-hover"
                );
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

const flowEditorRangeset = (state: EditorState, plugin: MakeMDPlugin) => {
  const builder = new RangeSetBuilder<Decoration>();
  const infoFields = state.field(flowEditorInfo, false);
  const values = [] as { start: number; end: number; decoration: Decoration }[];
  for (const info of infoFields) {
    const { from, to, type, expandedState } = info;
    const lineFix =
      from - 3 == state.doc.lineAt(from).from &&
      to + 2 == state.doc.lineAt(from).to;
    if (type == FlowEditorLinkType.Link) {
      if (plugin.superstate.settings.internalLinkSticker)
        values.push({
          start: from - 2,
          end: from - 2,
          decoration: Decoration.widget({
            widget: new LinkSticker(info, plugin),
            side: -1,
          }),
        });
      if (plugin.superstate.settings.internalLinkClickFlow)
        values.push({
          start: to + 2,
          end: to + 2,
          decoration: Decoration.widget({
            widget: new LinkExpand(info, plugin),
            side: -1,
          }),
        });
      if (expandedState == FlowEditorState.Open) {
        values.push({
          start: to + 2,
          end: to + 2,
          decoration: flowEditorDecoration(info, plugin),
        });
      }
    } else if (
      expandedState == FlowEditorState.Open &&
      type == FlowEditorLinkType.Embed
    ) {
      if (
        !(
          (state.selection.main.from == from - 4 &&
            state.selection.main.to == to + 2) ||
          (state.selection.main.from >= from - 3 &&
            state.selection.main.to <= to + 1)
        )
      ) {
        values.push({
          start: from - 4,
          end: from - 3,
          decoration: flowEditorSelector(info, plugin),
        });
        if (lineFix) {
          values.push({
            start: from - 3,
            end: to + 2,
            decoration: flowEditorWidgetDecoration(info, plugin),
          });
        } else {
          values.push({
            start: from - 3,
            end: to + 2,
            decoration: flowEditorDecoration(info, plugin),
          });
        }
      }
    }
  }
  values.sort(compareByField("start", true));
  for (const value of values) {
    builder.add(value.start, value.end, value.decoration);
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
    div.classList.add("mk-floweditor-container");

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

class LinkSticker extends WidgetType {
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
    div.classList.add("mk-floweditor-sticker");
    const reactEl = this.plugin.ui.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;
      const uri = this.plugin.superstate.spaceManager.uriByString(
        this.info.link,
        file.path
      );
      reactEl.render(
        <PathStickerContainer
          superstate={this.plugin.superstate}
          path={uri.basePath}
        />
      );
    }
    return div;
  }
}

class LinkExpand extends WidgetType {
  flowInfo: FlowEditorInfo;
  plugin: MakeMDPlugin;
  constructor(readonly info: FlowEditorInfo, plugin: MakeMDPlugin) {
    super();
    this.flowInfo = info;
    this.plugin = plugin;
  }

  eq(other: WidgetType) {
    return (
      (other as unknown as FlowEditorSelector).info.id === this.info.id &&
      (other as unknown as FlowEditorSelector).info.expandedState ==
        this.info.expandedState
    );
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.classList.add("mk-floweditor-toggle");
    const reactEl = this.plugin.ui.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      reactEl.render(
        <CollapseToggle
          superstate={this.plugin.superstate}
          collapsed={this.info.expandedState == 0}
          onToggle={(collapsed: boolean) => {
            view.dispatch({
              annotations: toggleFlowEditor.of([
                this.info.id,
                collapsed ? 2 : 0,
              ]),
            });
          }}
        />
      );
    }
    return div;
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
    div.classList.add("mk-floweditor-selector");
    const reactEl = this.plugin.ui.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;

      reactEl.render(
        <FlowEditorHover
          app={this.plugin.app}
          superstate={this.plugin.superstate}
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
    inclusiveStart: true,
    block: true,
  });
