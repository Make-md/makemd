import { EditorState, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";

import MakeBasicsPlugin from "basics/basics";
import { cmExtensions } from "basics/cmExtensions";
import {
  flowEditorDecoration,
  FlowEditorInfo,
  flowEditorInfo,
  FlowEditorLinkType,
  FlowEditorSelector,
  flowEditorSelector,
  FlowEditorState,
  flowEditorWidgetDecoration,
  toggleFlowEditor,
} from "basics/codemirror/flowEditor";
import { Enactor } from "basics/enactor/enactor";
import { replaceMobileMainMenu } from "basics/makemods/replaceMobileMainMenu";
import { BasicDefaultSettings } from "basics/schemas/settings";
import { Command } from "basics/types/command";
import { UICollapse } from "basics/ui/UICollapse";
import { compareByField } from "basics/utils/utils";
import { PathStickerContainer } from "shared/components/PathSticker";

import {
  contextEmbedStringFromContext,
  contextViewEmbedStringFromContext,
} from "shared/utils/makemd/embed";
import { createInlineTable } from "shared/utils/makemd/inlineTable";

import { SelectOption } from "shared/types/menu";
import { SpaceFragmentSchema } from "shared/types/spaceFragment";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";

import { Editor, editorInfoField, TFile } from "obsidian";
import React from "react";
import { BlinkMode } from "shared/types/blink";
import { IMakeMDPlugin } from "shared/types/makemd";
import { DBRows, SpaceProperty } from "shared/types/mdb";
import { FilesystemSpaceInfo } from "shared/types/spaceInfo";
import { ISuperstate } from "shared/types/superstate";
import { editableRange } from "shared/utils/codemirror/selectiveEditor";
import { windowFromDocument } from "shared/utils/dom";
import { uriToSpaceFragmentSchema } from "shared/utils/makemd/fragment";
import { getLineRangeFromRef } from "shared/utils/obsidian";
import { openPathInElement } from "shared/utils/openPathInElement";

export const createTable = (object: DBRows, columns: SpaceProperty[]) => {
  const columnNames = columns.map((f) => f.name);
  const base = "|";
  let outputString = base + columnNames.join(base) + "|\n";

  columns.forEach((f) => {
    outputString += base + "----";
  });
  outputString += base + "\n";
  object.forEach((row) => {
    outputString += columnNames.map((c) => base + row[c]).join("") + "|\n";
  });

  return outputString;
};

class LinkSticker extends WidgetType {
  flowInfo: FlowEditorInfo;
  superstate: ISuperstate;
  constructor(readonly info: FlowEditorInfo, superstate: ISuperstate) {
    super();
    this.flowInfo = info;
    this.superstate = superstate;
  }

  eq(other: WidgetType) {
    return (other as unknown as FlowEditorSelector).info.id === this.info.id;
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.classList.add("mk-floweditor-sticker");
    const reactEl = this.superstate.ui.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      const infoField = view.state.field(editorInfoField, false);
      const file = infoField.file;
      const uri = this.superstate.spaceManager.uriByString(
        this.info.link,
        file?.path
      );
      reactEl.render(
        <PathStickerContainer
          superstate={this.superstate}
          path={uri.basePath}
        />
      );
    }
    return div;
  }
}

class LinkExpand extends WidgetType {
  flowInfo: FlowEditorInfo;
  superstate: ISuperstate;
  constructor(readonly info: FlowEditorInfo, superstate: ISuperstate) {
    super();
    this.flowInfo = info;
    this.superstate = superstate;
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
    const reactEl = this.superstate.ui.createRoot(div);
    if (this.info.link && view.state.field(editorInfoField, false)) {
      reactEl.render(
        <UICollapse
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

const flowEditorRangeset = (
  state: EditorState,
  plugin: MakeBasicsPlugin,
  superstate: ISuperstate
) => {
  const builder = new RangeSetBuilder<Decoration>();
  const infoFields = state.field(flowEditorInfo, false);
  const values = [] as { start: number; end: number; decoration: Decoration }[];
  for (const info of infoFields) {
    const { from, to, type, expandedState } = info;
    const lineFix =
      from - 3 == state.doc.lineAt(from).from &&
      to + 2 == state.doc.lineAt(from).to;
    if (type == FlowEditorLinkType.Link) {
      if (plugin.settings.internalLinkSticker)
        values.push({
          start: from - 2,
          end: from - 2,
          decoration: Decoration.widget({
            widget: new LinkSticker(info, superstate),
            side: -1,
          }),
        });
      if (plugin.settings.internalLinkClickFlow)
        values.push({
          start: to + 2,
          end: to + 2,
          decoration: Decoration.widget({
            widget: new LinkExpand(info, superstate),
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

const flowEditorField = (plugin: MakeBasicsPlugin, superstate: ISuperstate) =>
  StateField.define<DecorationSet>({
    create(state) {
      return flowEditorRangeset(state, plugin, superstate);
    },
    update(value, tr) {
      return flowEditorRangeset(tr.state, plugin, superstate);
    },
    provide: (f) => EditorView.decorations.from(f),
  });

export class MakeMDEnactor implements Enactor {
  constructor(public makemd: IMakeMDPlugin, public plugin: MakeBasicsPlugin) {}
  name = "MakeMD";
  load() {
    this.plugin.settings = Object.assign(
      {},
      BasicDefaultSettings,
      this.makemd.superstate.settings,
      this.makemd.superstate.settings.basicsSettings
    );
    if (this.plugin.settings.mobileSidepanel) {
      this.plugin.app.workspace.onLayoutReady(async () => {
        replaceMobileMainMenu(this.plugin, this.makemd.superstate);
      });
    }
    this.plugin.commands = this.loadCommands();
  }
  loadCommands() {
    return [
      {
        label: "todo",
        value: "- [ ] ",
        icon: "mk-make-todo",
      },
      {
        label: "list",
        value: `- `,
        icon: "mk-make-list",
      },
      {
        label: "ordered-list",
        value: `1. `,
        icon: "mk-make-ordered",
      },
      {
        label: "h1",
        value: "# ",
        icon: "mk-make-h1",
      },
      {
        label: "h2",
        value: "## ",
        icon: "mk-make-h2",
      },
      {
        label: "h3",
        value: "### ",
        icon: "mk-make-h3",
      },
      {
        label: "quote",
        value: "> ",
        icon: "mk-make-quote",
      },
      {
        label: "divider",
        value: `
    ---
    `,
        icon: "mk-make-hr",
        section: "Basic",
      },
      {
        label: "codeblock",
        value: `
    \`\`\`
    Type/Paste Your Code
    \`\`\``,
        offset: [-4, 5],
        icon: "mk-make-codeblock",
      },
      {
        label: "callout",
        value: `> [!NOTE]
    > Content`,
        offset: [-7, 12],
        icon: "mk-make-callout",
      },
      {
        label: "internal",
        value: "link",
        icon: "mk-make-note",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          plugin.enactor.selectLink(_evt as any, (link) => {
            editor.replaceRange(`[[${link}]]`, { ...start, ch: startCh }, end);
            onComplete();
          });
        },
      },
      {
        label: "link",
        value: "<Paste Link>",
        offset: [-1, 1],
        icon: "mk-make-link",
      },
      {
        label: "image",
        value: "image",
        icon: "mk-make-image",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          plugin.enactor.selectImage(_evt, (image) => {
            editor.replaceRange(
              `![[${image}]]`,
              { ...start, ch: startCh },
              end
            );
            onComplete();
          });
        },
      },
      {
        label: "flow",
        value: `note`,
        offset: [-2, 4],
        icon: "mk-make-flow",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          plugin.enactor.selectLink(_evt as any, (link) => {
            editor.replaceRange(
              `![![${link}]]`,
              { ...start, ch: startCh },
              end
            );
            onComplete();
          });
        },
      },
      {
        label: "context",
        value: "context",
        icon: "layout-list",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          plugin.enactor.selectSpace(_evt as any, (link) => {
            editor.replaceRange(
              contextEmbedStringFromContext(
                (
                  plugin.enactor as MakeMDEnactor
                ).makemd.superstate.spacesIndex.get(link),
                "files"
              ),
              { ...start, ch: startCh },
              end
            );
            editor.setSelection({
              line: start.line,
              ch: 0,
            });
            onComplete();
          });
        },
      },
      {
        label: "table",
        value: "table",
        icon: "mk-make-table",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          createInlineTable(
            (plugin.enactor as MakeMDEnactor).makemd.superstate,
            file.parent.path,
            "table"
          ).then((f) => {
            editor.replaceRange(
              contextViewEmbedStringFromContext(
                (
                  plugin.enactor as MakeMDEnactor
                ).makemd.superstate.spacesIndex.get(file.parent.path),
                f
              ),
              { ...start, ch: startCh },
              end
            );
            editor.setSelection({
              line: start.line,
              ch: 0,
            });
            onComplete();
          });
        },
      },
      {
        label: "board",
        value: "board",
        icon: "square-kanban",
        onSelect: (
          _evt: any,
          plugin: MakeBasicsPlugin,
          file: TFile,
          editor: Editor,
          start: { line: number; ch: number },
          startCh: number,
          end: { line: number; ch: number },
          onComplete: () => void
        ) => {
          createInlineTable(
            (plugin.enactor as MakeMDEnactor).makemd.superstate,
            file.parent.path,
            "board"
          ).then((f) => {
            editor.replaceRange(
              contextViewEmbedStringFromContext(
                (
                  plugin.enactor as MakeMDEnactor
                ).makemd.superstate.spacesIndex.get(file.parent.path),
                f
              ),
              { ...start, ch: startCh },
              end
            );
            editor.setSelection({
              line: start.line,
              ch: 0,
            });
            onComplete();
          });
        },
      },

      {
        label: "tag",
        value: "#tag",
        offset: [0, 1],
        icon: "mk-make-tag",
      },
    ] as Command[];
  }
  loadExtensions(firstLoad: boolean) {
    const extensions = cmExtensions(this.plugin, this.plugin.isTouchScreen());
    if (this.plugin.settings.editorFlow) {
      extensions.push(flowEditorField(this.plugin, this.makemd.superstate));
    }
    this.plugin.extensions = extensions;
    if (firstLoad) {
      this.plugin.plugin.registerEditorExtension(this.plugin.extensions);
    } else {
      this.plugin.app.workspace.updateOptions();
    }
  }
  async convertSpaceFragmentToMarkdown(
    spaceFragment: SpaceFragmentSchema,
    onReturn: (markdown: string) => void
  ) {
    if (spaceFragment.type == "frame") {
      const schema = await this.makemd.superstate.spaceManager
        .readFrame(spaceFragment.path, spaceFragment.id)
        .then((f) => f?.schema);

      if (schema) {
        const mdbSchema = mdbSchemaToFrameSchema(schema);
        this.makemd.superstate.spaceManager
          .readTable(spaceFragment.path, mdbSchema.def.db)
          .then((mdbTable) => {
            if (!mdbTable) return;
            const markdown = createTable(mdbTable.rows, mdbTable.cols);
            onReturn(markdown);
          });
      }
    } else {
      this.makemd.superstate.spaceManager
        .readTable(spaceFragment.path, spaceFragment.id)
        .then((mdbTable) => {
          if (!mdbTable) return;
          const markdown = createTable(mdbTable.rows, mdbTable.cols);
          onReturn(markdown);
        });
    }
  }
  selectLink(e: React.MouseEvent, onSelect: (path: string) => void) {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    return this.makemd.superstate.ui.quickOpen(
      BlinkMode.Open,
      offset,
      windowFromDocument(e.view.document),
      onSelect
    );
  }
  selectSpace(e: React.MouseEvent, onSelect: (path: string) => void) {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    return this.makemd.superstate.ui.quickOpen(
      BlinkMode.OpenSpaces,
      offset,
      windowFromDocument(e.view.document),
      onSelect
    );
  }
  selectImage(e: React.MouseEvent, onSelect: (path: string) => void) {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    this.makemd.superstate.ui.quickOpen(
      BlinkMode.Image,
      offset,
      windowFromDocument(e.view.document),
      onSelect
    );
  }
  isSpace(path: string) {
    return this.makemd.superstate.spacesIndex.has(path);
  }
  spaceNotePath(path: string) {
    return this.makemd.superstate.spacesIndex.get(path)?.space.notePath;
  }
  spaceFolderPath(path: string) {
    return (
      this.makemd.superstate.spacesIndex.get(path)?.space as FilesystemSpaceInfo
    ).folderPath;
  }
  parentPath(path: string) {
    return this.makemd.superstate.spaceManager.parentPathForPath(path);
  }
  createNote(parent: string, name: string, content?: string) {
    return this.makemd.superstate.spaceManager.createItemAtPath(
      parent,
      "md",
      name,
      content
    );
  }
  createRoot(el: Element | DocumentFragment) {
    return this.makemd.superstate.ui.createRoot(el);
  }
  notify(message: string) {
    return this.makemd.superstate.ui.notify(message);
  }
  uriByString(uri: string, source?: string) {
    return this.makemd.superstate.spaceManager.uriByString(uri, source);
  }
  spaceFragmentSchema(uri: string) {
    return uriToSpaceFragmentSchema(this.makemd.superstate, uri);
  }

  saveSettings() {
    this.makemd.superstate.settings.basicsSettings = this.plugin.settings;
    this.plugin.plugin.saveSettings();
  }
  resolvePath(path: string, source?: string) {
    return this.makemd.superstate.spaceManager.resolvePath(path, source);
  }
  openMenu(ev: React.MouseEvent, options: SelectOption[]) {
    const offset = (ev.target as HTMLElement).getBoundingClientRect();
    return this.makemd.superstate.ui.openMenu(
      offset,
      {
        ui: this.makemd.superstate.ui,
        multi: false,
        value: [],
        editable: false,
        options,
        searchable: false,
        showAll: true,
      },
      windowFromDocument(ev.view.document)
    );
    return;
    // const menu = new Menu();
    // for (const option of options) {
    //   menu.addItem((item) => {
    //     item.setTitle(option.name);
    //     item.onClick((e) => option.onClick(e));
    //   });
    // }
    // menu.showAtMouseEvent(ev);
  }
  pathExists(path: string) {
    return this.makemd.superstate.spaceManager.pathExists(path);
  }
  openPath(path: string, source?: HTMLElement) {
    const uri = this.uriByString(path);
    openPathInElement(
      this.plugin.app,
      this.plugin.app.workspace.getLeaf(), // workspaceLeafForDom(this.plugin.app, source),
      source,
      null,
      async (editor) => {
        const leaf = editor.attachLeaf();
        if (
          this.plugin.app.vault.getAbstractFileByPath(uri.basePath) instanceof
          TFile
        ) {
          await leaf.openFile(
            this.plugin.app.vault.getAbstractFileByPath(uri.basePath) as TFile
          );
          const selectiveRange = getLineRangeFromRef(
            uri.basePath,
            uri.refStr,
            this.plugin.app
          );
          if (!leaf.view?.editor) {
            return;
          }

          if (selectiveRange[0] && selectiveRange[1]) {
            leaf.view.editor?.cm.dispatch({
              annotations: [editableRange.of(selectiveRange)],
            });
          }
        } else {
          await this.plugin.plugin.openPath(leaf, path, true);
        }
      }
    );
  }
  addActiveStateListener(reload: () => void) {
    this.makemd.superstate.ui.eventsDispatch.addListener(
      "activeStateChanged",
      reload
    );
  }
  removeActiveStateListener(reload: () => void) {
    this.makemd.superstate.ui.eventsDispatch.removeListener(
      "activeStateChanged",
      reload
    );
  }
}
