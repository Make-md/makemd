import { cmExtensions } from "cm-extensions/cmExtensions";
import { toggleMark } from "cm-extensions/inlineStylerView/marks";
import {
  CONTEXT_VIEW_TYPE,
  ContextView
} from "components/ContextView/ContextView";
import { FlowEditor } from "components/FlowEditor/FlowEditor";
import MakeMenu from "components/MakeMenu/MakeMenu";
import StickerMenu from "components/StickerMenu/StickerMenu";
import "css/makerMode.css";
import {
  App, MarkdownView,
  Notice, Plugin,
  TAbstractFile,
  TFile,
  TFolder,
  addIcon,
  normalizePath
} from "obsidian";
import {
  ActivePathEvent,
  FocusPortalEvent,
  LoadPortalEvent,
  OpenFilePortalEvent,
  SpawnPortalEvent,
  eventTypes
} from "types/types";
import {
  focusPortal,
  loadFlowEditorByDOM,
  openFileFromPortal,
  spawnNewPortal
} from "utils/flow/flowEditor";
import { replaceAllEmbed, replaceAllTables } from "utils/flow/markdownPost";
import {
  FILE_TREE_VIEW_TYPE,
  FileTreeView
} from "./components/Spaces/FileTreeView";
import {
  DEFAULT_SETTINGS,
  MakeMDPluginSettingsTab
} from "./settings/settings";
import { MakeMDPluginSettings } from "./types/settings";

import { Extension } from "@codemirror/state";
import {
  flowEditorInfo,
  toggleFlowEditor
} from "cm-extensions/flowEditor/flowEditor";
import { loadStylerIntoContainer } from "cm-extensions/inlineStylerView/InlineMenu";
import { Blink } from "components/Blink/Blink";
import {
  EMBED_CONTEXT_VIEW_TYPE,
  EmbedContextView
} from "components/ContextView/EmbedContextView";
import {
  MDBFileViewer,
  MDB_FILE_VIEWER_TYPE
} from "components/ContextView/MDBFileViewer";
import {
  FILE_CONTEXT_VIEW_TYPE,
  FileContextLeafView
} from "components/FileContextView/FileContextView";
import { FILE_VIEW_TYPE, FileLinkView } from "components/FileView/FileView";
import { replaceMobileMainMenu } from "components/Spaces/MainMenu";
import { LoadSpaceBackupModal } from "components/ui/modals/loadSpaceBackupModal";
import { AddToSpaceModal, RemoveFromSpaceModal } from "components/ui/modals/vaultChangeModals";
import * as spacesDispatch from "dispatch/spaces";
import { default as i18n, default as t } from "i18n";
import { getAPI } from "obsidian-dataview";
import { Database } from "sql.js";
import { Superstate } from "superstate/superstate";
import { uniqueNameFromString } from "utils/array";
import { getActiveCM } from "utils/codemirror";
import {
  folderContextFromFolder, mdbContextByDBPath, mdbContextByPath
} from "utils/contexts/contexts";
import { replaceInlineContext } from "utils/contexts/markdownPost";
import { getMDBTableSchemas } from "utils/contexts/mdb";
import { loadSQL } from "utils/db/sqljs";
import {
  defaultConfigFile,
  getAbstractFileAtPath,
  getFolderPathFromString,
  noteToFolderNote,
  platformIsMobile
} from "utils/file";
import { mkLogo } from "utils/icons";
import { safelyParseJSON } from "utils/json";
import { pathByString } from "utils/path";
import { patchFileExplorer, patchWorkspace } from "utils/spaces/patches";
import { filePathToString } from "utils/strings";

export default class MakeMDPlugin extends Plugin {
  app: App;
  settings: MakeMDPluginSettings;
  activeEditorView?: MarkdownView;
  spacesDBPath: string;
  spaceDB: Database;
  flowEditors: FlowEditor[];
  extensions: Extension[];
  dataViewAPI = () => getAPI();
  dataViewReady: boolean;
  dataViewLastIndex: number;
  loadTime: number;
  index: Superstate;
  spacesDBLastModify = 0;

  async sqlJS() {
    // console.time("Loading SQlite");
    const sqljs = await loadSQL();
    // console.timeEnd("Loading SQlite");
    return sqljs;
  }

  openFlow() {
    const cm = getActiveCM();
    if (cm) {
      const value = cm.state.field(flowEditorInfo, false);
      const currPosition = cm.state.selection.main;
      for (const flowEditor of value) {
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
      for (const flowEditor of value) {
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
  reloadExtensions(firstLoad: boolean) {
    this.extensions = cmExtensions(this, platformIsMobile());
    if (firstLoad) {
      this.registerEditorExtension(this.extensions);
    } else {
      app.workspace.updateOptions();
    }
  }
  quickOpen() {
    const quickOpenModal = new Blink(this.app, this);
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

  
loadSuperState() {
  this.app.workspace.onLayoutReady(async () => {
    if (this.settings.spacesEnabled) {

    await this.index.initializeIndex()
    this.openFileTreeLeaf(this.settings.openSpacesOnLaunch);
    }
    else {
      await this.index.loadFromCache();
    this.index.initialize();
    }
    this.registerEvent(this.app.vault.on("create", this.onCreate));
    this.registerEvent(this.app.vault.on("delete", this.onDelete));
    this.registerEvent(this.app.vault.on("rename", this.onRename));
    this.registerEvent(this.app.vault.on("modify", this.onModify));
    this.app.metadataCache.on("changed", this.metadataChange);

    if (this.dataViewAPI()) {
      this.registerEvent(
        //@ts-ignore
        this.app.metadataCache.on("dataview:index-ready", () => {
          this.dataViewReady = true;
        })
      );
      this.registerEvent(
        this.app.metadataCache.on(
          "dataview:metadata-change",
          (type, file, oldPath?) => {
            if (
              //@ts-ignore
              type === "update" &&
              //dataview is triggering "update" on metadatacache.on("resolve") even if no change in the file. It occurs at app launch
              //check if the file mtime is older that plugin load -> in this case no file has change, no need to update lookups
              //@ts-ignore
              this.app.metadataCache.fileCache[file.path].mtime >=
                this.loadTime &&
              this.dataViewAPI().index.revision !==
                this.dataViewLastIndex &&
              this.dataViewReady
            ) {
              if (file instanceof TFile) {
                this.metadataChange(file);
              }
              this.dataViewLastIndex = this.dataViewAPI().index.revision;
            }

            //
          }
        )
      );
    }
    
  });
}
  

  async loadSpaces() {
    
    
    
    if (this.settings.spacesEnabled) {
      document.body.classList.toggle("mk-hide-tabs", !this.settings.sidebarTabs);
    document.body.classList.toggle("mk-hide-ribbon", !this.settings.showRibbon);
    document.body.classList.toggle(
      "mk-folder-lines",
      this.settings.folderIndentationLines
    );

      document.body.classList.toggle(
        "mk-spaces-enabled",
        this.settings.spacesEnabled
      );

      if (!this.settings.spacesDisablePatch) patchFileExplorer(this);
      this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
        return new FileTreeView(leaf, this);
      });
      
    }

    this.registerEvent(
      app.workspace.on("active-leaf-change", () => this.activeFileChange())
    );
    // this.registerEvent(app.workspace.on('editor-change', debounce(() => this.activeFileChange(), 180, true)));
  }

  
  convertFolderNote() {
    const activeLeaf = app.workspace.activeLeaf;
    if (activeLeaf?.view.getViewType() == "markdown") {
      const view = app.workspace.getActiveViewOfType(MarkdownView);
      if (view instanceof MarkdownView && view.file instanceof TFile) {
        noteToFolderNote(this, view.file, true);
      }
    } else {
      new Notice('The view is not a note')
    }
  }
  getActiveFile() {
    let filePath = null;
    const leaf = app.workspace.activeLeaf
    const activeView = leaf?.view;
    //@ts-ignore
    if (!activeView || leaf.isFlowBlock) return null;
    if (activeView.getViewType() == CONTEXT_VIEW_TYPE) {
      const context = mdbContextByPath(
        this,
        activeView.getState().contextPath
      );
      if (context?.type == "folder") {
        const file = getAbstractFileAtPath(app, context.contextPath);
        if (file) filePath = file.path;
      }
    } else if (activeView.getViewType() == "markdown") {
        filePath = activeView.file.path;
    }
    return filePath;
  }
  activeFileChange() {
    const path = this.getActiveFile();
    if (path) {
      const evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
        detail: { path: pathByString(path) },
      });
      window.dispatchEvent(evt);
    }
  }
  loadCommands() {
    if (this.settings.spacesEnabled) {
      this.addCommand({
        id: 'mk-log',
        name: 'log',
        callback: () => {
          console.log(app.workspace.getActiveViewOfType(MarkdownView))
        }
      })
      this.addCommand({
        id: "mk-collapse-folders",
        name: i18n.commandPalette.collapseAllFolders,
        callback: () => {
          this.settings.expandedFolders = {
          };
          this.saveSettings();
        },
      });
      this.addCommand({
        id: "mk-reveal-file",
        name: t.commandPalette.revealFile,
        callback: () => {
          const file = getAbstractFileAtPath(app, this.getActiveFile());
          const evt = new CustomEvent(eventTypes.revealFile, {
            detail: { file: file },
          });
          window.dispatchEvent(evt);
        },
      });
      this.addCommand({
        id: "mk-spaces-add-file",
        name: t.commandPalette.addFileSpace,
        callback: () => {
          const vaultChangeModal = new AddToSpaceModal(this, [
            this.getActiveFile(),
          ]);
          vaultChangeModal.open();
        },
      });
      this.addCommand({
        id: "mk-spaces-remove-file",
        name: t.commandPalette.removeFileSpace,
        callback: () => {
          const vaultChangeModal = new RemoveFromSpaceModal(this, 
            this.getActiveFile(),
          );
          vaultChangeModal.open();
        },
      });
      this.addCommand({
        id: "mk-spaces-reload",
        name: i18n.commandPalette.reloadSpaces,
        callback: () => this.index.loadSpacesDatabaseFromDisk(),
      });
      this.addCommand({
        id: "mk-spaces-load-backup",
        name: i18n.commandPalette.loadBackupSpace,
        callback: () => {
            this.app.vault.adapter.list(
              normalizePath(`${app.vault.configDir}/plugins/make-md/backups`)
          ).then(f => {
            const vaultChangeModal = new LoadSpaceBackupModal(this, f.files.map((f) => filePathToString(f)));
          vaultChangeModal.open()
        }
          );
          
        },
      });
      this.addCommand({
        id: "mk-spaces-save-backup",
        name: i18n.commandPalette.backupSpace,
        callback: () => this.index.backupSpaceDB(false),
      });
      this.addCommand({
        id: "mk-spaces",
        name: i18n.commandPalette.openSpaces,
        callback: () => this.openFileTreeLeaf(true),
      });
    }
    if (this.settings.enableFolderNote) {
      this.addCommand({
        id: "mk-convert-folder-note",
        name: i18n.commandPalette.convertFolderNote,
        callback: () => this.convertFolderNote(),
      });
    }
    if (this.settings.contextEnabled) {
      this.addCommand({
        id: "mk-open-file-context",
        name: i18n.commandPalette.openFileContext,
        callback: () => this.openFileContextLeaf(true),
      });
    }
    if (this.settings.inlineBacklinks) {
      this.addCommand({
        id: "mk-toggle-backlinks",
        name: i18n.commandPalette.toggleBacklinks,
        callback: () => {
          const evt = new CustomEvent(eventTypes.toggleBacklinks);
          window.dispatchEvent(evt);
        },
      });
    }
    if (this.settings.blinkEnabled) {
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
    }
    if (this.settings.editorFlow) {
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
    }
    
  }
  loadContext() {
    if (this.settings.contextEnabled) {
      
      this.registerView(FILE_VIEW_TYPE, (leaf) => {
        return new FileLinkView(leaf, this, FILE_VIEW_TYPE);
      });
      this.registerView(CONTEXT_VIEW_TYPE, (leaf) => {
        return new ContextView(leaf, this, CONTEXT_VIEW_TYPE);
      });
      this.app.workspace.onLayoutReady(async () => {
        if (
          !getAbstractFileAtPath(
            this.app,
            getFolderPathFromString(this.settings.tagContextFolder)
          )
        ) {
          this.app.vault.createFolder(this.settings.tagContextFolder);
        }
      });
      this.registerView(FILE_CONTEXT_VIEW_TYPE, (leaf) => {
        return new FileContextLeafView(leaf, this);
      });
      this.registerView(EMBED_CONTEXT_VIEW_TYPE, (leaf) => {
        return new EmbedContextView(leaf, this);
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
  }

  loadFlowEditor() {
    patchWorkspace(this);
    document.body.classList.toggle("mk-flow-replace", this.settings.editorFlow);
    document.body.classList.toggle(
      "mk-flow-" + this.settings.editorFlowStyle,
      true
    );

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
        replaceAllTables(this, element, context);
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

  loadMakerMode() {
    if (this.settings.makerMode) {
      if (this.settings.inlineContext) {
        this.registerMarkdownPostProcessor((element, context) => {
          replaceInlineContext(this, element, context);
        });
        document.body.classList.toggle(
          "mk-inline-context-enabled",
          this.settings.inlineContext
        );
      }
      if (this.settings.editorFlow) {
        this.loadFlowEditor();
      }
      if (this.settings.flowMenuEnabled)
      {
        this.registerEditorSuggest(new MakeMenu(this.app, this));
      }
      this.registerEditorSuggest(new StickerMenu(this.app, this));
      if (platformIsMobile() && this.settings.mobileMakeBar && this.settings.inlineStyler)
        loadStylerIntoContainer(app.mobileToolbar.containerEl, this);
    }
  }
  
  private debouncedRefresh: () => void = () => null;
  async onload() {
    
    console.time("Loading Make.md");
    this.loadTime = Date.now();
  
    addIcon("mk-logo", mkLogo);
    await this.loadSettings();
    this.index = this.addChild(
      Superstate.create(this.app, '0.8', () => {
          this.debouncedRefresh();
      }, this)
  );
    this.spacesDBPath = normalizePath(
      app.vault.configDir + "/plugins/make-md/Spaces.mdb"
    );
    this.loadSuperState();
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    await this.loadSpaces();
    this.loadContext();
    
    this.loadMakerMode();
    this.reloadExtensions(true);
    this.loadCommands();
    
    
    console.timeEnd("Loading Make.md");
  }

  createInlineTable = async (path: string) => {
    const context = folderContextFromFolder(this, path);
    const schemas = await getMDBTableSchemas(this, context);
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
  
  metadataChange = (file: TFile) => {
    this.index.metadataChange(file);
    
  };
  onCreate = async (file: TAbstractFile) => {
    if (!file) return;
    spacesDispatch.onFileCreated(this, file.path, file instanceof TFolder);
  };

  onDelete = async (file: TAbstractFile) => {
    if (file instanceof TFile && file.extension != "mdb") {
      spacesDispatch.onFileDeleted(this, file.path);
    } else if (file instanceof TFolder) {
      spacesDispatch.onFolderDeleted(this, file.path);
    }
    this.activeFileChange();
  };
  onModify = async (file: TAbstractFile) => {
    if (file.path == this.settings.spacesSyncLastUpdated) {
      this.index.spacesSynced()
    }
    if (file instanceof TFile && file.extension == "mdb") {
      this.index.reloadContext(mdbContextByDBPath(this, file.path))
    }
  };
  onRename = async (file: TAbstractFile, oldPath: string) => {
    if (file instanceof TFile && file.extension != "mdb") {
      await spacesDispatch.onFileChanged(this, oldPath, file.path);
    } else if (file instanceof TFolder) {
      await spacesDispatch.onFolderChanged(this, oldPath, file.path);
    }
    this.activeFileChange();
  };

  openFileTreeLeaf = async (showAfterAttach: boolean) => {
    const leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach && !app.workspace.leftSplit.collapsed) this.app.workspace.revealLeaf(leaf);
    } else {
      if (!app.workspace.leftSplit.collapsed && showAfterAttach)
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (platformIsMobile()) {
      app.workspace.leftSplit.collapse();
    }
    replaceMobileMainMenu(this);
  };

  detachFileTreeLeafs = () => {
    const leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    for (const leaf of leafs) {
      if (leaf.view instanceof FileTreeView) leaf.view.destroy();
      leaf.detach();
    }
  };

  detachFileContextLeafs = () => {
    const leafs = this.app.workspace.getLeavesOfType(FILE_CONTEXT_VIEW_TYPE);
    for (const leaf of leafs) {
      if (leaf.view instanceof FileContextLeafView) leaf.view.destroy();
      leaf.detach();
    }
  };

  openFileContextLeaf = async (reveal?: boolean) => {
    const leafs = this.app.workspace.getLeavesOfType(FILE_CONTEXT_VIEW_TYPE);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: FILE_CONTEXT_VIEW_TYPE });
      this.app.workspace.revealLeaf(leaf);
    } else {
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (platformIsMobile() && !reveal) {
      app.workspace.rightSplit.collapse();
    }
  };

  refreshFileContextLeafs = () => {
    this.detachFileContextLeafs();
    this.openFileContextLeaf();
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
      const evt = new CustomEvent(eventTypes.settingsChanged, {});
      window.dispatchEvent(evt);
    }
  }

  onunload() {
    console.log("Unloading Make.md");
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
