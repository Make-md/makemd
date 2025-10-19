import i18n from "shared/i18n";

import { EditorState, RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import MakeBasicsPlugin from "basics/basics";
import { cmExtensions } from "basics/cmExtensions";
import {
  flowEditorDecoration,
  flowEditorInfo,
  FlowEditorLinkType,
  flowEditorSelector,
  FlowEditorState,
  flowEditorWidgetDecoration,
} from "basics/codemirror/flowEditor";
import { compareByField } from "basics/utils/utils";
import {
  App,
  Editor,
  FuzzySuggestModal,
  Menu,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import { createRoot } from "react-dom/client";
import { SelectOption } from "shared/types/menu";
import { SpaceFragmentSchema } from "shared/types/spaceFragment";
import { editableRange } from "shared/utils/codemirror/selectiveEditor";
import { getLineRangeFromRef } from "shared/utils/obsidian";
import { openPathInElement } from "shared/utils/openPathInElement";
import { parseURI } from "shared/utils/uri";

import { BasicDefaultSettings } from "basics/schemas/settings";
import { Command } from "basics/types/command";
import { Enactor } from "./enactor";

const flowEditorRangeset = (state: EditorState, plugin: MakeBasicsPlugin) => {
  const builder = new RangeSetBuilder<Decoration>();
  const infoFields = state.field(flowEditorInfo, false);
  const values = [] as { start: number; end: number; decoration: Decoration }[];
  for (const info of infoFields) {
    const { from, to, type, expandedState } = info;
    const lineFix =
      from - 3 == state.doc.lineAt(from).from &&
      to + 2 == state.doc.lineAt(from).to;
    if (type == FlowEditorLinkType.Link) {
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

const flowEditorField = (plugin: MakeBasicsPlugin) =>
  StateField.define<DecorationSet>({
    create(state) {
      return flowEditorRangeset(state, plugin);
    },
    update(value, tr) {
      return flowEditorRangeset(tr.state, plugin);
    },
    provide: (f) => EditorView.decorations.from(f),
  });

class FilesModal extends FuzzySuggestModal<TFile> {
  files: TFile[];
  newNoteResult: HTMLDivElement;
  suggestionEmpty: HTMLDivElement;
  obsFile: any;
  noSuggestion: boolean;
  selectedLink: (link: string) => void;

  EMPTY_TEXT = "Files not found";

  constructor(app: App, selectedLink: (link: string) => void) {
    super(app);
    this.selectedLink = selectedLink;
    this.init();
  }

  init() {
    this.files = this.app.vault.getMarkdownFiles();
    this.emptyStateText = this.EMPTY_TEXT;
    // this.setPlaceholder(PLACEHOLDER_TEXT);
    this.setInstructions([
      { command: "↑↓", purpose: i18n.labels.toNavigate },
      { command: "↵", purpose: i18n.labels.toAppendLinkToTheFile },
      { command: "esc", purpose: "to dismiss" },
    ]);
    this.initNewNoteItem();
  }

  getItems(): TFile[] {
    return this.files;
  }

  getItemText(item: TFile): string {
    this.noSuggestion = false;
    return item.basename;
  }

  onNoSuggestion() {
    this.noSuggestion = true;
  }

  onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
    if (this.noSuggestion) {
      // this.modalNoteCreation.create(this.inputEl.value);
    } else {
      this.selectedLink(item.path);
    }
  }

  initNewNoteItem() {
    this.newNoteResult = document.createElement("div");
    this.newNoteResult.addClasses(["suggestion-item", "is-selected"]);
    this.suggestionEmpty = document.createElement("div");
    this.suggestionEmpty.addClass("suggestion-empty");
    this.suggestionEmpty.innerText = this.EMPTY_TEXT;
  }

  itemInstructionMessage(resultEl: HTMLElement, message: string) {
    const el = document.createElement("kbd");
    el.addClass("suggestion-hotkey");
    el.innerText = message;
    resultEl.appendChild(el);
  }
}

export class ObsidianEnactor implements Enactor {
  constructor(public plugin: MakeBasicsPlugin) {}

  name = "Obsidian";
  load() {
    this.plugin.settings = Object.assign(
      {},
      BasicDefaultSettings,
      this.plugin.settings
    );
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
        label: "table",
        value: `|     |     |
| --- | --- |
|     |     |
`,
        icon: "mk-make-table",
      },

      {
        label: "tag",
        value: "#tag",
        offset: [0, 1],
        icon: "mk-make-tag",
      },
    ] as Command[];
  }
  async convertSpaceFragmentToMarkdown(
    spaceFragment: SpaceFragmentSchema,
    onReturn: (markdown: string) => void
  ) {
    onReturn("");
  }
  selectLink(e: React.MouseEvent, onSelect: (path: string) => void) {
    const linkSelector = new FilesModal(this.plugin.app, onSelect);
    linkSelector.open();
  }
  selectSpace(e: React.MouseEvent, onSelect: (path: string) => void) {
    return this.notify(i18n.labels.notImplemented);
  }
  pathExists(path: string) {
    return this.plugin.app.vault.adapter.exists(path);
  }
  selectImage(e: React.MouseEvent, onSelect: (path: string) => void) {
    return this.notify(i18n.labels.notImplemented);
  }
  isSpace(path: string) {
    return false;
  }
  spaceNotePath(path: string): null {
    return null;
  }
  spaceFolderPath(path: string) {
    return path;
  }
  parentPath(path: string) {
    return this.plugin.app.vault.getAbstractFileByPath(path)?.parent?.path;
  }
  loadExtensions(firstLoad: boolean) {
    const extensions = cmExtensions(this.plugin, this.plugin.isTouchScreen());
    if (this.plugin.settings.editorFlow) {
      extensions.push(flowEditorField(this.plugin));
    }
    this.plugin.extensions = extensions;
    if (firstLoad) {
      this.plugin.plugin.registerEditorExtension(this.plugin.extensions);
    } else {
      this.plugin.app.workspace.updateOptions();
    }
  }
  createNote(parent: string, name: string, content?: string) {
    return this.plugin.app.fileManager
      .createNewMarkdownFile(
        this.plugin.app.vault.getAbstractFileByPath(parent) as TFolder,
        name
      )
      .then((f) => f.path);
  }
  createRoot(el: Element | DocumentFragment) {
    const root = createRoot(el);
    return root;
  }
  notify(message: string) {
    new Notice(message);
  }
  uriByString(uri: string, source?: string) {
    return parseURI(uri);
  }
  spaceFragmentSchema(uri: string) {
    return Promise.resolve(null);
  }

  saveSettings() {
    this.plugin.plugin.saveData(this.plugin.settings);
  }
  resolvePath(path: string, source?: string) {
    if (!source) return null;
    return this.plugin.app.metadataCache.getFirstLinkpathDest(path, source)
      ?.path;
  }
  openMenu(ev: React.MouseEvent, options: SelectOption[]) {
    const menu = new Menu();
    for (const option of options) {
      menu.addItem((item) => {
        item.setTitle(option.name);
        item.onClick((e) => option.onClick(e as any));
      });
    }
    menu.showAtMouseEvent(ev as unknown as MouseEvent);
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
        }
      }
    );
  }
  addActiveStateListener(cb: (active: boolean) => void) {
    // this.plugin.app.workspace.on("active-leaf-change", cb);
  }
  removeActiveStateListener(cb: (active: boolean) => void) {
    // this.plugin.app.workspace.off("active-leaf-change", cb);
  }
}
