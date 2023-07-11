import {
  EditorState,
  Range,
  StateEffect,
  StateEffectType,
  StateField,
  Transaction,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { contentRange } from "cm-extensions/flowEditor/selectiveEditor";
import { flowTypeStateField } from "cm-extensions/markSans/callout";
import { Backlinks } from "components/FileContextView/Backlinks";
import { InlineFileContextView } from "components/FileContextView/InlineFileContextView";
import MakeMDPlugin from "main";
import { TFile, editorInfoField, editorLivePreviewField } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { PortalType } from "types/types";
import { iterateTreeInDocument } from "utils/codemirror";

export const inlineContext = () => {};

export class InlineContextWidget extends WidgetType {
  plugin: MakeMDPlugin;
  file: TFile;
  filePath: string;
  contentEl: HTMLElement;
  removeListeners: () => void;

  constructor(plugin: MakeMDPlugin, file: TFile, contentEl: HTMLElement) {
    super();
    this.plugin = plugin;
    this.file = file;
    this.filePath = file.path;
    this.contentEl = contentEl;
    this.removeListeners = () => {};
  }

  eq(widget: InlineContextWidget): boolean {
    if (widget.filePath == this.filePath) return true;
    return false;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("div");
    container.toggleClass("mk-header", true);
    container.toggleClass("cm-line", true);
    const anchor = createRoot(container);
    const flowType = view.state.field(flowTypeStateField, false);
    const isFolderNote = flowType == "foldernote";
    anchor.render(
      <>
        <InlineFileContextView
          plugin={this.plugin}
          file={this.file}
          editorView={view}
          showHeader={!isFolderNote}
          showBanner={!isFolderNote}
          isFolderNote={isFolderNote}
          editable={true}
        ></InlineFileContextView>
      </>
    );
    return container;
  }

  destroy() {
    this.removeListeners();
  }
}

export class BacklinksWidget extends WidgetType {
  plugin: MakeMDPlugin;
  file: TFile;
  contentEl: HTMLElement;
  removeListeners: () => void;

  constructor(plugin: MakeMDPlugin, file: TFile, contentEl: HTMLElement) {
    super();
    this.plugin = plugin;
    this.file = file;
    this.contentEl = contentEl;
    this.removeListeners = () => {};
  }

  eq(widget: BacklinksWidget): boolean {
    return true;
  }

  toDOM() {
    const container = document.createElement("div");
    const anchor = createRoot(container);
    anchor.render(
      <>
        <Backlinks plugin={this.plugin} file={this.file}></Backlinks>
      </>
    );
    return container;
  }

  destroy() {
    this.removeListeners();
  }
}

function defineStatefulDecoration(): {
  update: StateEffectType<DecorationSet>;
  field: StateField<DecorationSet>;
} {
  const update = StateEffect.define<DecorationSet>();
  const field = StateField.define<DecorationSet>({
    create(): DecorationSet {
      return Decoration.none;
    },
    update(deco, tr): DecorationSet {
      return tr.effects.reduce((deco, effect) => {
        return effect.is(update) ? effect.value : deco;
      }, deco.map(tr.changes));
    },
    provide: (field) => EditorView.decorations.from(field),
  });
  return { update, field };
}

export const statefulDecorations = defineStatefulDecoration();

export class StatefulDecorationSet {
  editor: EditorView;
  decoCache: { [cls: string]: Decoration } = Object.create(null);
  plugin: MakeMDPlugin;

  constructor(editor: EditorView, plugin: MakeMDPlugin) {
    this.editor = editor;
    this.plugin = plugin;
  }

  async computeAsyncDecorations(
    state: EditorState,
    show: boolean
  ): Promise<DecorationSet | null> {
    if (!show) return Decoration.none;
    if (!state.field(editorInfoField, false)) return null; // If not yet loaded.
    const infoField = state.field(editorInfoField);
    if (!infoField.editor?.cm) return null; // If not yet loaded.
    const file = infoField.file;
    const contentEl = infoField.editor.cm.contentDOM;

    const decorations: Range<Decoration>[] = [];

    // if (fmEnd >= state.doc.length-1){
    //   fmEnd = state.doc.length
    // }

    decorations.push(
      // Decoration.widget({widget: new HeaderWidget(this.plugin, file, contentEl), block: true, side: -2}).range(0),
      Decoration.line({ class: "mk-has-banner" }).range(0),
      Decoration.widget({
        widget: new InlineContextWidget(this.plugin, file, contentEl),
        block: true,
        side: -1,
      }).range(0)
    );

    if (this.plugin.settings.inlineBacklinks) {
      const line = state.doc.line(state.doc.lines);

      decorations.push(
        Decoration.line({ class: "mk-has-backlinks" }).range(
          line.from,
          line.from
        ),
        Decoration.widget({
          widget: new BacklinksWidget(this.plugin, file, contentEl),
          side: 1,
          block: false,
        }).range(state.doc.length)
      );
    }

    return Decoration.set(decorations, true);
  }

  async updateAsyncDecorations(
    state: EditorState,
    show: boolean
  ): Promise<void> {
    const decorations = await this.computeAsyncDecorations(state, show);
    // if our compute function returned nothing and the state field still has decorations, clear them out
    if (
      decorations ||
      this.editor.state.field(statefulDecorations.field, false).size
    ) {
      this.editor.dispatch({
        effects: statefulDecorations.update.of(decorations || Decoration.none),
      });
    }
  }
}

export const frontmatterHider = (plugin: MakeMDPlugin) =>
  EditorState.transactionFilter.of((tr: Transaction) => {
    let newTrans = [];

    const isFM = (typeString: string): boolean => {
      if (typeString.contains("hmd-frontmatter")) {
        //reset auto header without space
        return true;
      }
      return false;
    };
    let fmStart = 1;
    let fmEnd = tr.state.doc.lines;
    iterateTreeInDocument(tr.state, {
      enter: ({ type, from, to }) => {
        if (isFM(type.name)) {
          fmStart = tr.state.doc.lineAt(to).number + 1;
        }
      },
    });
    const livePreview = tr.state.field(editorLivePreviewField);
    if (
      fmStart > 1 &&
      fmStart <= tr.state.doc.lines &&
      plugin.settings.hideFrontmatter &&
      livePreview
    ) {
      newTrans.push({
        annotations: [contentRange.of([fmStart, fmEnd])],
      });
    } else {
      newTrans.push({
        annotations: [contentRange.of([null, null])],
      });
    }
    return [tr, ...newTrans];
  });

export const headerViewPlugin = (plugin: MakeMDPlugin) =>
  ViewPlugin.fromClass(
    class {
      statefulDecorationsSet: StatefulDecorationSet;
      flowTypeState: PortalType;
      filePath: string;
      livePreview: boolean;
      headerEnabled: boolean;
      constructor(view: EditorView) {
        this.statefulDecorationsSet = new StatefulDecorationSet(view, plugin);
        this.flowTypeState = view.state.field(flowTypeStateField, false);
        if (
          this.flowTypeState == "doc" ||
          this.flowTypeState == "foldernote" ||
          !this.flowTypeState
        )
          this.statefulDecorationsSet.updateAsyncDecorations(view.state, true);
        this.livePreview = view.state.field(editorLivePreviewField, false);
      }

      showHeader(view: EditorView) {
        if (
          (view.state.field(flowTypeStateField, false) == "doc" ||
            view.state.field(flowTypeStateField, false) == "foldernote" ||
            view.state.field(flowTypeStateField, false) == null) &&
          view.state.field(editorLivePreviewField, false)
        ) {
          if (!this.headerEnabled) {
            this.statefulDecorationsSet.updateAsyncDecorations(
              view.state,
              true
            );
            this.headerEnabled = true;
          }
        } else {
          this.headerEnabled = false;
          this.statefulDecorationsSet.updateAsyncDecorations(view.state, false);
        }
      }

      update(update: ViewUpdate) {
        /** Only changes within the same host document flow to this diffing point.
         * Changes to title of document is not caught.
         * Changes to other documents that are referenced in the influx of host file are not caught.
         */
        const infoField = update.state.field(editorInfoField, false);
        if (
          update.docChanged ||
          update.state.field(flowTypeStateField, false) != this.flowTypeState ||
          this.filePath != infoField.file?.path ||
          this.livePreview != update.state.field(editorLivePreviewField, false)
        ) {
          this.filePath = infoField.file?.path;
          this.livePreview = update.state.field(editorLivePreviewField, false);
          this.flowTypeState = update.state.field(flowTypeStateField, false);
          this.showHeader(update.view);
        }
      }

      destroy() {}
    }
  );
