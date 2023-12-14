import { cmExtensions } from "adapters/obsidian/ui/editors/markdownView/cmExtensions";
import { toggleMark } from "adapters/obsidian/ui/editors/markdownView/menus/inlineStylerView/marks";

import { SPACE_VIEW_TYPE, SpaceViewContainer } from "adapters/obsidian/SpaceViewContainer";
import { replaceAllEmbed, replaceAllTables } from "adapters/obsidian/utils/flow/markdownPost";
import { DEFAULT_SETTINGS } from "core/schemas/settings";
import {
  eventTypes
} from "core/types/types";
import {
  App, MarkdownView,
  Platform,
  Plugin,
  TAbstractFile,
  TFile,
  WorkspaceSplit,
  addIcon,
  normalizePath
} from "obsidian";
import {
  MakeMDPluginSettingsTab
} from "./adapters/obsidian/settings";
import {
  FILE_TREE_VIEW_TYPE,
  FileTreeView
} from "./adapters/obsidian/ui/navigator/NavigatorView";

import { Extension } from "@codemirror/state";
import { replaceMobileMainMenu } from "adapters/obsidian/replaceMobileMainMenu";
import {
  EMBED_CONTEXT_VIEW_TYPE,
  EmbedContextView
} from "adapters/obsidian/ui/editors/EmbedContextView";
import {
  MDBFileViewer,
  MDB_FILE_VIEWER_TYPE
} from "adapters/obsidian/ui/editors/MDBFileViewer";
import { FILE_VIEW_TYPE, FileLinkView } from "adapters/obsidian/ui/editors/markdownView/FileView";
import {
  flowEditorInfo,
  toggleFlowEditor
} from "adapters/obsidian/ui/editors/markdownView/flowEditor/flowEditor";
import { ContextExplorerLeafView, FILE_CONTEXT_VIEW_TYPE } from "adapters/obsidian/ui/explorer/ContextExplorerLeafView";


import { i18n } from "makemd-core";

import { getActiveCM } from "adapters/obsidian/utils/codemirror";
import {
  defaultConfigFile,
  openURL
} from "adapters/obsidian/utils/file";
import { replaceInlineContext } from "adapters/obsidian/utils/markdownPost";
import { convertPathToSpace } from "core/superstate/utils/path";
import { FilesystemMiddleware, FilesystemSpaceAdapter, SpaceManager, Superstate, UIManager } from "makemd-core";

import { mkLogo } from "adapters/obsidian/ui/icons";
import { patchFilesPlugin, patchWorkspace } from "adapters/obsidian/utils/patches";
import { safelyParseJSON } from "utils/parsers";
import { modifyFlowDom } from "./adapters/obsidian/utils/flow/flow";

import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { ObsidianFileSystem } from "adapters/obsidian/filesystem/filesystem";

import { ObsidianCanvasFiletypeAdapter } from "adapters/obsidian/filetypes/canvasAdapter";
import { ObsidianMarkdownFiletypeAdapter } from "adapters/obsidian/filetypes/markdownAdapter";
import { registerEditorMenus } from "adapters/obsidian/ui/editors/markdownView/menus/registerMenus";
import { ObsidianUI } from "adapters/obsidian/ui/ui";
import { migrate08 } from "adapters/obsidian/utils/migration";
import { modifyTabSticker } from "adapters/obsidian/utils/modifyTabSticker";


import { IconFileTypeAdapter } from "adapters/icons/iconsAdapter";
import { ImageFileTypeAdapter } from "adapters/image/imageAdapter";
import { ObsidianCommands } from "adapters/obsidian/commands/obsidianCommands";
import { TextCacher } from "adapters/text/textCacher";
import { CommandsManager } from "core/middleware/commands";
import { openBlinkModal } from "core/react/components/Blink/Blink";
import { LocalCachePersister, LocalStorageCache } from "core/superstate/localCache/localCache";
import { MobileCachePersister } from "core/superstate/localCache/localCacheMobile";
import { openTestModal } from "core/test/TestComponent";
import "css/Blink.css";
import "css/CardsView.css";
import "css/ContextBuilder.css";
import "css/FileContext.css";
import "css/FileTree.css";
import "css/FilterBar.css";
import "css/FlowEditor.css";
import "css/Frame.css";
import "css/FrameProps.css";
import "css/InlineMenu.css";
import "css/MainMenu.css";
import "css/MakeMenu.css";
import "css/Menu.css";
import "css/NewNote.css";
import "css/Sidebar.css";
import "css/SpaceEditor.css";
import "css/SpaceView.css";
import "css/StickerMenu.css";
import "css/TableView.css";
import "css/makerMode.css";


const makeMDVersion = 0.815;

export default class MakeMDPlugin extends Plugin {
  app: App;
  files: FilesystemMiddleware;
  obsidianAdapter: ObsidianFileSystem
  mdbFileAdapter: MDBFileTypeAdapter;
  markdownAdapter: ObsidianMarkdownFiletypeAdapter;

  activeEditorView?: MarkdownView;
  extensions: Extension[];
  superstate: Superstate;


  
  openFlow() {
    const cm = getActiveCM(this);
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
    const cm = getActiveCM(this);
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
  systemName () {
    return this.app.vault.getName();
  }
  reloadExtensions(firstLoad: boolean) {
    this.extensions = cmExtensions(this, this.superstate.ui.getScreenType() == 'mobile');
    if (firstLoad) {
      this.registerEditorExtension(this.extensions);
    } else {
      this.app.workspace.updateOptions();
    }
  }
  quickOpen() {
    openBlinkModal(this.superstate);
  }

  testPage() {
    openTestModal(this.superstate);
  }

  toggleBold() {
    const cm = getActiveCM(this);
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("strong"),
      });
    }
  }
  toggleEm() {
    const cm = getActiveCM(this);
    if (cm) {
      cm.dispatch({
        annotations: toggleMark.of("em"),
      });
    }
  }

  
loadSuperState() {
  this.app.workspace.onLayoutReady(async () => {
    if (this.superstate.settings.spacesEnabled) {

    await this.superstate.initializeIndex()
    this.obsidianAdapter.loadCacheFromObsidianCache();
    this.openFileTreeLeaf(this.superstate.settings.openSpacesOnLaunch);
    }
    else {
      await this.superstate.loadFromCache();
    this.superstate.initialize();
    }

    this.registerEvent(this.app.vault.on("delete", this.onDelete));
    this.registerEvent(this.app.vault.on("rename", this.onRename));

    this.app.metadataCache.on("changed", this.metadataChange);

    if (makeMDVersion > this.superstate.settings.releaseNotesPrompt) {
      this.releaseTheNotes();
      this.superstate.settings.releaseNotesPrompt = makeMDVersion;
      this.saveSettings();
    }
    
    
    
  });
}
  

  async loadSpaces() {
    
    
    
    if (this.superstate.settings.spacesEnabled) {
      document.body.classList.toggle("mk-hide-tabs", !this.superstate.settings.sidebarTabs);
    document.body.classList.toggle("mk-hide-ribbon", !this.superstate.settings.showRibbon);
    document.body.classList.toggle(
      "mk-folder-lines",
      this.superstate.settings.folderIndentationLines
    );
    document.body.classList.toggle(
      "mk-minimal-fix",
      this.superstate.settings.minimalFix
    );
    

      document.body.classList.toggle(
        "mk-spaces-enabled",
        this.superstate.settings.spacesEnabled
      );

      if (!this.superstate.settings.spacesDisablePatch) patchFilesPlugin(this);
      this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
        return new FileTreeView(leaf, this.superstate);
      });
      
    }

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.activeFileChange())
      
    );
    this.registerEvent(app.workspace.on('layout-change', () => this.activeFileChange()));
  }

  
  convertPathToSpace() {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf?.view.getViewType() == "markdown") {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view instanceof MarkdownView && view.file instanceof TFile) {
        convertPathToSpace(this.superstate, view.file.path, true);
      }
    } else {
      this.superstate.ui.notify(i18n.notice.cantConvertNoteToSpace)
    }
  }
  toggleExperimental() {
    this.superstate.settings.experimental = !this.superstate.settings.experimental;
    this.saveSettings();
  }
  getActiveFile() {
    let filePath = null;
    let leaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
    if (!leaf) {
      leaf = this.app.workspace.getActiveViewOfType(SpaceViewContainer)?.leaf;
    }
    
    const activeView = leaf?.view;
    //@ts-ignore
    if (!activeView || leaf.isFlowBlock) return null;
    if (activeView.getViewType() == SPACE_VIEW_TYPE ) {
      modifyTabSticker(this)
      return  activeView.getState().path
    } else if (activeView.getViewType() == "markdown") {
      filePath = activeView.file.path;
      modifyFlowDom(this)
      modifyTabSticker(this)
  }
    return filePath;
  }
  activeFileChange() {

    const path = this.getActiveFile();
    
    if (path) {
      this.superstate.ui.setActivePath(path)
    }
  }
  
  releaseTheNotes() {
    openURL('https://www.make.md/static/latest.md', this.app, true)
  }
  loadCommands() {
    if (this.superstate.settings.spacesEnabled) {
      
      this.addCommand({
        id: 'mk-debug-close-tabs',
        name: "Close Extra File Tabs",
        callback: () => {
          let filesFound = false;
          this.app.workspace.leftSplit.children.forEach((f: WorkspaceSplit) => {
            f?.children.forEach((g) => {
              if (g.view.getViewType() == 'file-explorer') {
                if (!filesFound) {
                  filesFound = true;
                } else {
                f.removeChild(g);
                }
              }
            })
          })
        }
      })

      this.addCommand({
        id: "mk-collapse-folders",
        name: i18n.commandPalette.collapseAllFolders,
        callback: () => {
          this.superstate.settings.expandedSpaces = [];
          this.saveSettings();
        },
      });
      this.addCommand({
        id: "mk-release-notes",
        name: i18n.commandPalette.releaseNotes,
        callback: () => {
          this.releaseTheNotes();
        },
      });
      // this.addCommand({
      //   id: "mk-reveal-file",
      //   name: t.commandPalette.revealFile,
      //   callback: () => {
      //     const file = getAbstractFileAtPath(this, this.getActiveFile());
      //     const evt = new CustomEvent(eventTypes.revealFile, {
      //       detail: { file: file },
      //     });
      //     window.dispatchEvent(evt);
      //   },
      // });
      
      
      this.addCommand({
        id: "mk-spaces-migrate",
        name: i18n.commandPalette.migrateData,
        callback: () => migrate08(this),
      });
      
      this.addCommand({
        id: "mk-spaces",
        name: i18n.commandPalette.openSpaces,
        callback: () => this.openFileTreeLeaf(true),
      });
    }
    if (this.superstate.settings.enableFolderNote) {
      this.addCommand({
        id: "mk-convert-folder-note",
        name: i18n.commandPalette.convertPathToSpace,
        callback: () => this.convertPathToSpace(),
      });
    }
    if (this.superstate.settings.contextEnabled) {

      this.addCommand({
        id: "mk-open-file-context",
        name: i18n.commandPalette.openFileContext,
        callback: () => this.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE, true),
      });
    }
    if (this.superstate.settings.inlineBacklinks) {
      this.addCommand({
        id: "mk-toggle-backlinks",
        name: i18n.commandPalette.toggleBacklinks,
        callback: () => {
          const evt = new CustomEvent(eventTypes.toggleBacklinks);
          window.dispatchEvent(evt);
        },
      });
    }
    this.addCommand({
      id: "mk-test",
      name: "Open Test Page",
      callback: () => this.testPage(),
      hotkeys: [
        
      ],
    });
    if (this.superstate.settings.blinkEnabled) {
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
    if (this.superstate.settings.editorFlow) {
      this.addCommand({
        id: "mk-open-flow",
        name: i18n.commandPalette.openFlow,
        callback: () => this.openFlow(),
      });

      this.addCommand({
        id: "mk-close-flow",
        name: i18n.commandPalette.closeFlow,
        callback: () => this.closeFlow(),
      });
    }
    
    
  }
  loadContext() {
    this.registerView(SPACE_VIEW_TYPE, (leaf) => {
      return new SpaceViewContainer(leaf, this.superstate, SPACE_VIEW_TYPE);
    });
    this.registerView(EMBED_CONTEXT_VIEW_TYPE, (leaf) => {
      return new EmbedContextView(leaf, this.superstate);
    });
    if (this.superstate.settings.contextEnabled) {
      
      this.registerView(FILE_VIEW_TYPE, (leaf) => {
        return new FileLinkView(leaf, this.app, FILE_VIEW_TYPE);
      });
      
      
      this.app.workspace.onLayoutReady(async () => {
        if (this.superstate.settings.enableDefaultSpaces
        ) {
          await this.files.createFolder(this.superstate.settings.spacesFolder);
          if (this.superstate.settings.enableHomeSpace) {
            await this.files.createFolder(this.superstate.settings.spacesFolder+'/'+'Home')
          }
        }
      });
      this.registerView(FILE_CONTEXT_VIEW_TYPE, (leaf) => {
        return new ContextExplorerLeafView(leaf, this.superstate);
      });
      
      this.registerView(MDB_FILE_VIEWER_TYPE, (leaf) => {
        return new MDBFileViewer(leaf, this);
      });
      this.registerExtensions(["mdb"], MDB_FILE_VIEWER_TYPE);
      this.app.workspace.onLayoutReady(async () => {

        if (this.superstate.settings.autoOpenFileContext) {
          await this.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE);
        }
        setTimeout(() => this.activeFileChange(), 2000);
      });
    }
  }

  loadFlowEditor() {
    patchWorkspace(this);
    document.body.classList.toggle("mk-flow-replace", this.superstate.settings.editorFlow);
    document.body.classList.toggle(
      "mk-flow-" + this.superstate.settings.editorFlowStyle,
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
        replaceAllEmbed(element, context, this.superstate, this.app);
      });

      
      
      
    }

  loadMakerMode() {
    if (this.superstate.settings.makerMode) {
      if (this.superstate.settings.inlineContext) {
        this.registerMarkdownPostProcessor((element, context) => {
          replaceInlineContext(this, element, context);
        });
        document.body.classList.toggle(
          "mk-inline-context-enabled",
          this.superstate.settings.inlineContext
        );
      }
      if (this.superstate.settings.editorFlow) {
        this.loadFlowEditor();
      }
      registerEditorMenus(this);
    }
  }
  
  private debouncedRefresh: () => void = () => null;
  async onload() {
const start = Date.now();
    this.mdbFileAdapter = new MDBFileTypeAdapter(this);   

    this.files = FilesystemMiddleware.create(this);
    this.obsidianAdapter = new ObsidianFileSystem(this, this.files, normalizePath(
      this.app.vault.configDir + "/plugins/make-md/Spaces.mdb"
    ))
    this.files.initiateFileSystemAdapter(this.obsidianAdapter, true);
this.markdownAdapter = new ObsidianMarkdownFiletypeAdapter(this.app);
    this.files.initiateFiletypeAdapter(this.mdbFileAdapter);
    this.files.initiateFiletypeAdapter(this.markdownAdapter);
    
    this.files.initiateFiletypeAdapter(new ObsidianCanvasFiletypeAdapter(this));
    this.files.initiateFiletypeAdapter(new ImageFileTypeAdapter(this));
    this.files.initiateFiletypeAdapter(new IconFileTypeAdapter(this));
    
    const filesystemCosmoform = new FilesystemSpaceAdapter(this.files)
    let cachePersister : LocalCachePersister;
    if (Platform.isMobile) {
      cachePersister = new MobileCachePersister('.makemd/superstate.mdb', this.mdbFileAdapter, ['path', 'space', 'frame', 'context', 'icon'])
    } else {
      cachePersister = new LocalStorageCache('.makemd/superstate.mdb', this.mdbFileAdapter, ['path', 'space', 'frame', 'context', 'icon'])
    }
await cachePersister.initialize()
    this.superstate = 
      Superstate.create('0.9', 
      () => {
          this.debouncedRefresh();
      }, 
      new SpaceManager(), 
      UIManager.create(new ObsidianUI(this)), 
      CommandsManager.create(new ObsidianCommands(this)),
      cachePersister)
    await this.loadSettings();
    
    if (this.superstate.settings.experimental)
      this.files.initiateFiletypeAdapter(new TextCacher(this));

    this.superstate.spaceManager.addSpaceAdapter(filesystemCosmoform, true);

    addIcon("mk-logo", mkLogo);
    
    
  this.superstate.saveSettings = () => this.saveSettings();
  
    
    this.loadSuperState();
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    await this.loadSpaces();
    this.loadContext();
    
    this.loadMakerMode();
    this.reloadExtensions(true);
    this.loadCommands();
    
    
    this.superstate.ui.notify(`Make.md - Plugin loaded in ${(Date.now()-start)/1000} seconds`, 'console');

    
  }

  
  

  //Spaces Listeners
  
  metadataChange = (file: TFile) => {

    this.markdownAdapter.metadataChange(file);
  };
  

  onDelete = async (file: TAbstractFile) => {
    
    this.activeFileChange();
  };
  
  onRename = async (file: TAbstractFile, oldPath: string) => {

    
    this.activeFileChange();
  };

  openFileTreeLeaf = async (showAfterAttach: boolean) => {
    const leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach && !this.app.workspace.leftSplit.collapsed) this.app.workspace.revealLeaf(leaf);
    } else {
      if (!app.workspace.leftSplit.collapsed && showAfterAttach)
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (this.superstate.ui.getScreenType() == 'mobile') {
      this.app.workspace.leftSplit.collapse();
    }
    replaceMobileMainMenu(this.superstate);
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
      if (leaf.view instanceof ContextExplorerLeafView) leaf.view.destroy();
      leaf.detach();
    }
  };

  openFileContextLeaf = async (view: string, reveal?: boolean) => {

    const leafs = this.app.workspace.getLeavesOfType(view);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: view });
      this.app.workspace.revealLeaf(leaf);
    } else {
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (this.superstate.ui.getScreenType() == 'mobile' && !reveal) {
      this.app.workspace.rightSplit.collapse();
    }
  };

  refreshFileContextLeafs = () => {
    this.detachFileContextLeafs();
    this.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE);
  };

  

  async loadSettings() {
    this.superstate.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const userConfig = safelyParseJSON(await defaultConfigFile(this));
    this.superstate.settings.newFileFolderPath = userConfig.newFileFolderPath;
    this.superstate.settings.newFileLocation = userConfig.newFileLocation;
    this.saveSettings();
  }

  async saveSettings(refresh = true) {

    await this.saveData(this.superstate.settings);
    if (refresh)
    this.superstate.dispatchEvent("settingsChanged", null)
    
  }

  onunload() {
    console.log("Unloading Make.md");

    
    this.detachFileTreeLeafs();
  }
}
