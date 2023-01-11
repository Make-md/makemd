import { cmExtensions } from "cm-extensions/cmExtensions";
import { toggleMark } from "cm-extensions/inlineStylerView/marks";
import {
  ContextView,
  CONTEXT_VIEW_TYPE
} from "components/ContextView/ContextView";
import { FlowEditor } from "components/FlowEditor/FlowEditor";
import MakeMenu from "components/MakeMenu/MakeMenu";
import StickerMenu from "components/StickerMenu/StickerMenu";
import "css/makerMode.css";
import {
  addIcon, CachedMetadata, debounce, MarkdownView, normalizePath, Plugin, TAbstractFile, TFile,
  TFolder,
  WorkspaceLeaf
} from "obsidian";
import {
  eventTypes,
  FocusPortalEvent,
  LoadPortalEvent,
  OpenFilePortalEvent,
  SpawnPortalEvent,
  VaultChange
} from "types/types";
import {
  focusPortal,
  loadFlowEditorByDOM,
  openFileFromPortal,
  spawnNewPortal
} from "utils/flow/flowEditor";
import { replaceAllEmbed } from "utils/flow/markdownPost";
import {
  FileTreeView, FILE_TREE_VIEW_TYPE
} from "./components/Spaces/FileTreeView";
import {
  DEFAULT_SETTINGS, MakeMDPluginSettings,
  MakeMDPluginSettingsTab
} from "./settings";

import {
  flowEditorInfo,
  toggleFlowEditor
} from "cm-extensions/flowEditor/flowEditor";
import { loadStylerIntoContainer } from "cm-extensions/inlineStylerView/InlineMenu";
import { Blink } from "components/Blink/Blink";
import {
  InlineContextView,
  INLINE_CONTEXT_VIEW_TYPE
} from "components/ContextView/InlineContextView";
import {
  MDBFileViewer,
  MDB_FILE_VIEWER_TYPE
} from "components/ContextView/MDBFileViewer";
import {
  FileContextLeafView,
  FILE_CONTEXT_VIEW_TYPE
} from "components/FileContextView/FileContextView";
import { replaceMobileMainMenu } from "components/Spaces/MainMenu";
import * as mdb from "dispatch/mdb";
import * as spacesDispatch from "dispatch/spaces";
import t from "i18n";
import { Database } from "sql.js";
import { getActiveCM } from "utils/codemirror";
import { folderContextFromFolder } from "utils/contexts/contexts";
import { getMDBTableSchemas } from "utils/contexts/mdb";
import { dbResultsToDBTables, getDB, saveDBAndKeepAlive } from "utils/db/db";
import { loadSQL } from "utils/db/sqljs";
import {
  defaultConfigFile,
  getAbstractFileAtPath,
  getFolderPathFromString,
  platformIsMobile
} from "utils/file";
import { mkLogo } from "utils/icons";
import { patchFileExplorer, patchWorkspace } from "utils/spaces/patches";
import {
  initiateDB,
  migrateIndex,
  rebuildIndex
} from "utils/spaces/spaces";
import { safelyParseJSON, uniqueNameFromString } from "utils/tree";
import i18n from "i18n";
export default class MakeMDPlugin extends Plugin {
  settings: MakeMDPluginSettings;
  activeEditorView?: MarkdownView;
  spacesDBPath: string;
  spaceDB: Database;
  flowEditors: FlowEditor[];
  queue: Promise<void>;

  async sqlJS() {
    // console.time("Loading SQlite");
    const sqljs = await loadSQL();
    // console.timeEnd("Loading SQlite");
    return sqljs;
  }
  spaceDBInstance() {
    return this.spaceDB;
  }

  openFlow() {
    const cm = getActiveCM();
    if (cm) {
      const value = cm.state.field(flowEditorInfo, false);
      const currPosition = cm.state.selection.main;
      for (let flowEditor of value) {
        if (
          flowEditor.from < currPosition.to &&
          flowEditor.to > currPosition.from
        ) {
          cm.dispatch({
            annotations: toggleFlowEditor.of([flowEditor.id, 2]),
          });
        }
      }
    }
  }
  closeFlow() {
    const cm = getActiveCM();
    if (cm) {
      const value = cm.state.field(flowEditorInfo, false);
      const currPosition = cm.state.selection.main;
      for (let flowEditor of value) {
        if (
          flowEditor.from < currPosition.to &&
          flowEditor.to > currPosition.from
        ) {
          cm.dispatch({
            annotations: toggleFlowEditor.of([flowEditor.id, 0]),
          });
        }
      }
    }
  }

  quickOpen() {
    let quickOpenModal = new Blink(this.app, this);
    quickOpenModal.open();
  }

  toggleBold() {
    const cm = getActiveCM();
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("strong"),
      });
    }
  }
  toggleEm() {
    const cm = getActiveCM();
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("em"),
      });
    }
  }

  async loadSpaces() {
    this.spacesDBPath = normalizePath(
      app.vault.configDir + "/plugins/make-md/Spaces.mdb"
    );
    this.spaceDB = await getDB(await loadSQL(), this.spacesDBPath);
    patchWorkspace(this);
    document.body.classList.toggle("mk-hide-tabs", !this.settings.sidebarTabs);
    document.body.classList.toggle("mk-hide-ribbon", !this.settings.showRibbon);
    this.registerView(CONTEXT_VIEW_TYPE, (leaf) => {
      return new ContextView(leaf, this, CONTEXT_VIEW_TYPE);
    });

    if (this.settings.spacesEnabled) {
      this.addCommand({
        id: "mk-spaces",
        name: i18n.commandPalette.openSpaces,
        callback: () => this.openFileTreeLeaf(true),
      });
      if (!this.settings.spacesDisablePatch) patchFileExplorer(this);
      this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
        return new FileTreeView(leaf, this);
      });
      this.app.workspace.onLayoutReady(async () => {
        const tables = dbResultsToDBTables(
          this.spaceDBInstance().exec(
            "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
          )
        );
        if (tables.length == 0) {
          initiateDB(this.spaceDBInstance());
        }
        if (
          this.settings.folderRank &&
          this.settings.folderRank.children.length > 0
        ) {
          migrateIndex(this);
        } else {
          rebuildIndex(this);
        }
        this.registerEvent(this.app.vault.on("create", this.onCreate));
        this.registerEvent(this.app.vault.on("delete", this.onDelete));
        this.registerEvent(this.app.vault.on("rename", this.onRename));
        this.app.metadataCache.on("changed", this.metadataChange);
        await this.openFileTreeLeaf(true);
      });
    }

    this.registerEvent(
      app.workspace.on("active-leaf-change", () => this.activeFileChange())
    );
    // this.registerEvent(app.workspace.on('editor-change', debounce(() => this.activeFileChange(), 180, true)));
  }

  saveSpacesDB = debounce(
    () => saveDBAndKeepAlive(this.spaceDBInstance(), this.spacesDBPath),
    1000,
    true
  );

  activeFileChange() {
    let filePath = null;
    const activeLeaf = app.workspace.activeLeaf;
    if (
      activeLeaf?.view.getViewType() == CONTEXT_VIEW_TYPE &&
      activeLeaf?.view.getState().type == "folder"
    ) {
      let file = getAbstractFileAtPath(app, activeLeaf.view.getState().folder);
      if (file) filePath = file.path;
    } else if (activeLeaf?.view.getViewType() == "markdown") {
      const view = app.workspace.getActiveViewOfType(MarkdownView);
      if (view instanceof MarkdownView) {
        filePath = view.file.path;
      }
    }
    if (filePath) {
      let evt = new CustomEvent(eventTypes.activeFileChange, {
        detail: { filePath },
      });
      window.dispatchEvent(evt);
    }
  }

  loadContext() {
    this.registerView(FILE_CONTEXT_VIEW_TYPE, (leaf) => {
      return new FileContextLeafView(leaf, this);
    });
    this.registerView(INLINE_CONTEXT_VIEW_TYPE, (leaf) => {
      return new InlineContextView(leaf, this);
    });
    this.registerView(MDB_FILE_VIEWER_TYPE, (leaf) => {
      return new MDBFileViewer(leaf, this);
    });
    this.registerExtensions(["mdb"], MDB_FILE_VIEWER_TYPE);
    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.autoOpenFileContext) {
        await this.openFileContextLeaf();
      }
      setTimeout(() => this.activeFileChange(), 2000);
    });
  }

  loadFlowEditor() {
    this.addCommand({
      id: "mk-blink",
      name: i18n.commandPalette.blink,
      callback: () => this.quickOpen(),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "o",
        },
      ],
    });
    document.body.classList.toggle("mk-flow-replace", this.settings.editorFlow);
    document.body.classList.toggle(
      "mk-flow-" + this.settings.editorFlowStyle,
      true
    );

    this.addCommand({
      id: "mk-open-file-context",
      name: i18n.commandPalette.openFileContext,
      callback: () => this.openFileContextLeaf(),
    });
    this.addCommand({
      id: "mk-open-flow",
      name: t.commandPalette.openFlow,
      callback: () => this.openFlow(),
    });

    this.addCommand({
      id: "mk-close-flow",
      name: t.commandPalette.closeFlow,
      callback: () => this.closeFlow(),
    });
    if (this.settings.editorFlow) {
      this.registerMarkdownPostProcessor((element, context) => {
        const removeAllFlowMarks = (el: HTMLElement) => {
          const embeds = el.querySelectorAll(".internal-embed");

          for (let index = 0; index < embeds.length; index++) {
            const embed = embeds.item(index);
            if (
              embed.previousSibling &&
              embed.previousSibling.textContent.slice(-1) == "!"
            )
              embed.previousSibling.textContent =
                embed.previousSibling.textContent.slice(0, -1);
          }
        };
        removeAllFlowMarks(element);
        replaceAllEmbed(element, context);
      });

      window.addEventListener(
        eventTypes.spawnPortal,
        this.spawnPortal.bind(this)
      );
      window.addEventListener(
        eventTypes.loadPortal,
        this.loadPortal.bind(this)
      );
      window.addEventListener(
        eventTypes.focusPortal,
        this.focusPortal.bind(this)
      );
      window.addEventListener(
        eventTypes.openFilePortal,
        this.openFileFromPortal.bind(this)
      );
    }
  }

  loadMakerMode() {
    document.body.classList.toggle("mk-mark-sans", this.settings.markSans);
    this.addCommand({
      id: "mk-toggle-bold",
      name: t.commandPalette.toggleBold,
      callback: () => this.toggleBold(),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "b",
        },
      ],
    });

    this.addCommand({
      id: "mk-toggle-italics",
      name: t.commandPalette.toggleItalics,
      callback: () => this.toggleEm(),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "i",
        },
      ],
    });

    this.registerEditorSuggest(new MakeMenu(this.app, this));
    this.registerEditorSuggest(new StickerMenu(this.app, this));
    if (platformIsMobile() && this.settings.mobileMakeBar)
      loadStylerIntoContainer(app.mobileToolbar.containerEl, this);
  }
  addToQueue(operation: () => Promise<any>) {
    this.queue = this.queue.then(operation).catch(() => {});
  }
  async onload() {
    console.time("Loading Make.md");
    this.queue = Promise.resolve();

    addIcon("mk-logo", mkLogo);

    // Load Settings
    console.time("Loading Settings");
    await this.loadSettings();
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    console.timeEnd("Loading Settings");
    this.app.workspace.onLayoutReady(async () => {
      if (
        !getAbstractFileAtPath(
          this.app,
          getFolderPathFromString(this.settings.tagContextFolder)
        )
      ) {
        this.app.vault.createFolder(this.settings.tagContextFolder);
      }
      // this.registerEditorSuggest(new FlowSuggest(this.app, this));
    });

    console.time("Loading Spaces");
    await this.loadSpaces();
    console.timeEnd("Loading Spaces");
    console.time("Loading Context");
    this.loadContext();
    console.timeEnd("Loading Context");
    console.time("Loading Flow Editor");
    this.loadFlowEditor();
    console.timeEnd("Loading Flow Editor");
    console.time("Loading Maker Mode");
    this.loadMakerMode();
    console.timeEnd("Loading Maker Mode");
    console.time("Loading CM Extensions");
    this.registerEditorExtension(cmExtensions(this, platformIsMobile()));
    console.timeEnd("Loading CM Extensions");
    console.timeEnd("Loading Make.md");
  }

  createTable = async (path: string) => {
    const dbPath = folderContextFromFolder(this, path);
    const schemas = await getMDBTableSchemas(this, dbPath, false);
    if (schemas)
      return uniqueNameFromString(
        "Table",
        schemas.map((f) => f.id)
      );
    return "Table";
  };
  //Flow Editor Listeners
  openFileFromPortal(e: OpenFilePortalEvent) {
    openFileFromPortal(this, e);
  }
  loadPortal(e: LoadPortalEvent) {
    loadFlowEditorByDOM(this, e.detail.el, e.detail.view, e.detail.id);
  }
  spawnPortal(e: SpawnPortalEvent) {
    spawnNewPortal(this, e);
  }
  focusPortal(e: FocusPortalEvent) {
    focusPortal(this, e);
  }

  //Spaces Listeners
  triggerVaultChangeEvent = (
    file: TAbstractFile,
    changeType: VaultChange,
    oldPath?: string
  ) => {
    let event = new CustomEvent(eventTypes.vaultChange, {
      detail: {
        file: file,
        changeType: changeType,
        oldPath: oldPath ? oldPath : "",
      },
    });
    window.dispatchEvent(event);
  };
  metadataChange = (file: TFile, data: string, cache: CachedMetadata) => {
    let event = new CustomEvent(eventTypes.tagsChange, {
      detail: { tags: cache.tags?.map((f) => f.tag) ?? [] },
    });
    window.dispatchEvent(event);
    this.addToQueue(() => mdb.onMetadataChange(this, file));
  };
  onCreate = (file: TAbstractFile) => {
    if (!file) return;
    this.triggerVaultChangeEvent(file, "create", "");
    this.addToQueue(() => mdb.onFileCreated(this, file.path));
    spacesDispatch.onFileCreated(this, file.path, file instanceof TFolder);
  };
  onDelete = (file: TAbstractFile) => {
    this.triggerVaultChangeEvent(file, "delete", "");
    if (file instanceof TFile && file.extension != "mdb") {
      this.addToQueue(() => mdb.onFileDeleted(this, file.path));
      spacesDispatch.onFileDeleted(this, file.path);
    } else if (file instanceof TFolder) {
      this.addToQueue(() => mdb.onFolderDeleted(file.path));
      spacesDispatch.onFolderDeleted(this, file.path);
    }
    this.activeFileChange();
  };
  onRename = (file: TAbstractFile, oldPath: string) => {
    this.triggerVaultChangeEvent(file, "rename", oldPath);
    if (file instanceof TFile && file.extension != "mdb") {
      this.addToQueue(() => mdb.onFileChanged(this, oldPath, file.path));
      spacesDispatch.onFileChanged(this, oldPath, file.path);
    } else if (file instanceof TFolder) {
      this.addToQueue(() => mdb.onFolderChanged(this, oldPath, file.path));
      spacesDispatch.onFolderChanged(this, oldPath, file.path);
    }
    this.activeFileChange();
  };

  openFileTreeLeaf = async (showAfterAttach: boolean) => {
    let leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      let leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach) this.app.workspace.revealLeaf(leaf);
    } else {
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (platformIsMobile()) {
      app.workspace.leftSplit.collapse();
    }
    replaceMobileMainMenu(this);
  };

  detachFileTreeLeafs = () => {
    let leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    for (let leaf of leafs) {
      if (leaf.view instanceof FileTreeView) leaf.view.destroy();
      leaf.detach();
    }
  };

  detachFileContextLeafs = () => {
    let leafs = this.app.workspace.getLeavesOfType(FILE_CONTEXT_VIEW_TYPE);
    for (let leaf of leafs) {
      if (leaf.view instanceof FileContextLeafView) leaf.view.destroy();
      leaf.detach();
    }
  };

  openFileContextLeaf = async () => {
    let leafs = this.app.workspace.getLeavesOfType(FILE_CONTEXT_VIEW_TYPE);
    if (leafs.length == 0) {
      let leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: FILE_CONTEXT_VIEW_TYPE });
      this.app.workspace.revealLeaf(leaf);
    } else {
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
  };

  refreshFileContextLeafs = () => {
    this.detachFileContextLeafs();
    this.openFileContextLeaf();
  };

  refreshTreeLeafs = () => {
    this.detachFileTreeLeafs();
    this.openFileTreeLeaf(true);
  };

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const userConfig = safelyParseJSON(await defaultConfigFile(this.app));
    this.settings.newFileFolderPath = userConfig.newFileFolderPath;
    this.settings.newFileLocation = userConfig.newFileLocation;
    this.saveSettings();
  }

  async saveSettings(refresh = true) {
    await this.saveData(this.settings);
    if (refresh) {
      let evt = new CustomEvent(eventTypes.settingsChanged, {});
      window.dispatchEvent(evt);
    }
  }

  onunload() {
    console.log("Unloading Make.md");
    this.spaceDBInstance().close();
    window.removeEventListener(eventTypes.spawnPortal, this.spawnPortal);
    window.removeEventListener(eventTypes.loadPortal, this.loadPortal);
    window.removeEventListener(eventTypes.focusPortal, this.focusPortal);
    window.removeEventListener(
      eventTypes.openFilePortal,
      this.openFileFromPortal
    );
    this.detachFileTreeLeafs();
  }
}
