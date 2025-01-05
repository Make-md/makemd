
import { SPACE_VIEW_TYPE, SpaceViewContainer } from "adapters/obsidian/SpaceViewContainer";
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
  TFolder,
  WorkspaceLeaf,
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

import {
  EMBED_SPACE_VIEW_TYPE,
  EmbedSpaceView
} from "adapters/obsidian/ui/editors/EmbedSpaceView";
import {
  MDBFileViewer,
  MDB_FILE_VIEWER_TYPE
} from "adapters/obsidian/ui/editors/MDBFileViewer";
import { FileLinkView, LINK_VIEW_TYPE } from "adapters/obsidian/ui/editors/markdownView/FileView";
import { ContextExplorerLeafView, FILE_CONTEXT_VIEW_TYPE } from "adapters/obsidian/ui/explorer/ContextExplorerLeafView";


import { i18n } from "makemd-core";

import {
  defaultConfigFile,
  fileExtensionForFile,
  fileNameForFile,
  getAbstractFileAtPath,
  openTFile,
  openTFolder,
  openTagContext,
  openURL
} from "adapters/obsidian/utils/file";
import { replaceInlineContext } from "adapters/obsidian/utils/markdownPost";
import { convertPathToSpace } from "core/superstate/utils/path";
import { FilesystemMiddleware, FilesystemSpaceAdapter, SpaceManager, UIManager } from "makemd-core";

import { mkLogo } from "adapters/obsidian/ui/icons";
import { patchFilesPlugin, patchWorkspace } from "adapters/obsidian/utils/patches";
import { safelyParseJSON } from "shared/utils/json";
import { modifyFlowDom } from "./adapters/obsidian/inlineContextLoader";

import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { ObsidianFileSystem } from "adapters/obsidian/filesystem/filesystem";

import { ObsidianCanvasFiletypeAdapter } from "adapters/obsidian/filetypes/canvasAdapter";
import { ObsidianMarkdownFiletypeAdapter } from "adapters/obsidian/filetypes/markdownAdapter";
import { ObsidianUI } from "adapters/obsidian/ui/ui";

import { modifyTabSticker } from "adapters/obsidian/utils/modifyTabSticker";


import { IconFileTypeAdapter } from "adapters/icons/iconsAdapter";
import { MobileCachePersister } from "adapters/mdb/localCache/localCacheMobile";
import { ObsidianCommands } from "adapters/obsidian/commands/obsidianCommands";
import { TextCacher } from "adapters/text/textCacher";
import { CLIManager } from "core/middleware/commands";
import { openBlinkModal } from "core/react/components/Blink/Blink";
import { LocalCachePersister } from "shared/types/persister";

import { ImageFileTypeAdapter } from "adapters/image/imageAdapter";
import { LocalStorageCache } from "adapters/mdb/localCache/localCache";

import { openPathFixer } from "adapters/obsidian/fileSystemPathFixer";
import { moveSpaceFiles } from "adapters/obsidian/filesystem/spaceFileOps";
import { JSONFiletypeAdapter } from "adapters/obsidian/filetypes/jsonAdapter";
import { SPACE_FRAGMENT_VIEW_TYPE, SpaceFragmentView } from "adapters/obsidian/ui/editors/SpaceFragmentViewComponent";
import { installKitModal } from "adapters/obsidian/ui/kit/InstallKitModal";
import { exportSpaceKit } from "adapters/obsidian/ui/kit/kits";
import { EVER_VIEW_TYPE, EverLeafView } from "adapters/obsidian/ui/navigator/EverLeafView";
import MakeBasicsPlugin from "basics/basics";
import { showWarningsModal } from "core/react/components/Navigator/SyncWarnings";
import { openInputModal } from "core/react/components/UI/Modals/InputModal";
import { WebSpaceAdapter } from "core/spaceManager/webAdapter/webAdapter";
import { Superstate } from "core/superstate/superstate";
import { defaultSpace, newPathInSpace } from "core/superstate/utils/spaces";
import { isPhone, isTouchScreen } from "core/utils/ui/screen";
import "css/DefaultVibe.css";
import "css/Editor/Actions/Actions.css";
import "css/Editor/Context/ContextList.css";
import "css/Editor/Context/FilterBar.css";
import "css/Editor/Flow/FlowEditor.css";
import "css/Editor/Flow/FlowState.css";
import "css/Editor/Flow/Properties.css";
import "css/Editor/Frames/Insert.css";
import "css/Editor/Frames/Node.css";
import "css/Editor/Frames/Overlay.css";
import "css/Editor/Frames/Page.css";
import "css/Editor/Frames/Slides.css";
import "css/Editor/Properties/DatePicker.css";
import "css/Menus/ColorPicker.css";
import "css/Menus/InlineMenu.css";
import "css/Menus/MainMenu.css";
import "css/Menus/MakeMenu.css";
import "css/Menus/Menu.css";
import "css/Menus/StickerMenu.css";
import "css/Modal/Modal.css";
import "css/Obsidian/Mods.css";
import "css/Panels/Blink.css";
import "css/Panels/ContextBuilder.css";
import "css/Panels/FileContext.css";
import "css/Panels/Navigator/EverView.css";
import "css/Panels/Navigator/FileTree.css";
import "css/Panels/Navigator/Focuses.css";
import "css/Panels/Navigator/Navigator.css";
import "css/Panels/SpaceEditor.css";
import "css/SpaceViewer/Calendar.css";
import "css/SpaceViewer/Frame.css";
import "css/SpaceViewer/Layout.css";
import "css/SpaceViewer/Nodes.css";
import "css/SpaceViewer/SpaceView.css";
import "css/SpaceViewer/TableView.css";
import "css/SpaceViewer/Text.css";
import "css/UI/Buttons.css";
import { IMakeMDPlugin } from "shared/types/makemd";
import { ISuperstate } from "shared/types/superstate";
import { windowFromDocument } from "shared/utils/dom";
import { removeTrailingSlashFromFolder } from "shared/utils/paths";
import { getParentPathFromString } from "utils/path";

const makeMDVersion = 0.999;

export default class MakeMDPlugin extends Plugin implements IMakeMDPlugin {
  app: App;
  files: FilesystemMiddleware;
  obsidianAdapter: ObsidianFileSystem
  mdbFileAdapter: MDBFileTypeAdapter;
  markdownAdapter: ObsidianMarkdownFiletypeAdapter;

  activeEditorView?: MarkdownView;
  
  superstate: Superstate;
  ui: ObsidianUI;

  
  
  
  
  quickOpen(superstate: ISuperstate, mode?: number, onSelect?: (link: string) => void, source?: string) {
    const win = windowFromDocument(this.app.workspace.getLeaf()?.containerEl.ownerDocument)
    openBlinkModal(superstate, mode, win, onSelect, source);
  }


  

  
loadSuperState() {
  this.app.workspace.onLayoutReady(async () => {
    if (this.superstate.settings.spacesEnabled) {

    await this.superstate.initializeIndex()
    this.obsidianAdapter.loadCacheFromObsidianCache();
    if (this.superstate.settings.navigatorEnabled) {
      this.openFileTreeLeaf(this.superstate.settings.openSpacesOnLaunch);
    }
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
    if (!this.superstate.settings.firstLaunch) {
      this.getStarted();
      this.superstate.settings.firstLaunch = true;
      this.saveSettings();
    }
  });
}
  
loadViews () {
  this.registerView(EVER_VIEW_TYPE, (leaf) => {
    return new EverLeafView(leaf, this.superstate, this.ui);
  });
  this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
    return new FileTreeView(leaf, this.superstate, this.ui);
  });
  this.registerView(SPACE_VIEW_TYPE, (leaf) => {
    return new SpaceViewContainer(leaf, this.superstate, this.ui, SPACE_VIEW_TYPE);
  });
  
  this.registerView(SPACE_FRAGMENT_VIEW_TYPE, (leaf) => {
    return new SpaceFragmentView(leaf, this);
  });
  this.registerView(EMBED_SPACE_VIEW_TYPE, (leaf) => {
    return new EmbedSpaceView(leaf, this);
  });
  if (this.superstate.settings.contextEnabled) {
      
    this.registerView(LINK_VIEW_TYPE, (leaf) => {
      return new FileLinkView(leaf, this.app, LINK_VIEW_TYPE, this.superstate);
    });
    
    
    this.registerView(FILE_CONTEXT_VIEW_TYPE, (leaf) => {
      return new ContextExplorerLeafView(leaf, this.superstate, this.ui);
    });
    
    this.registerView(MDB_FILE_VIEWER_TYPE, (leaf) => {
      return new MDBFileViewer(leaf, this);
    });
    
  }
}

  async loadSpaces()  {
  document.body.querySelector(".app-container").setAttribute("vaul-drawer-wrapper", "");
  
    document.body.classList.toggle("mk-spaces-right", this.superstate.settings.spacesRightSplit);
  
    document.body.classList.toggle("mk-readable-line", this.app.vault.getConfig("readableLineLength"));
    this.superstate.settings.readableLineWidth = this.app.vault.getConfig("readableLineLength");
    if (this.superstate.settings.spacesEnabled) {
      document.body.classList.toggle("mk-hide-tabs", !this.superstate.settings.sidebarTabs);
      
    document.body.classList.toggle("mk-hide-ribbon", !this.superstate.settings.showRibbon);
    // document.body.classList.toggle("mk-flow-state", this.superstate.settings.flowState);
    document.body.classList.toggle(
      "mk-folder-lines",
      this.superstate.settings.folderIndentationLines
    );
    if (this.app.vault.config.cssTheme == 'Minimal')
    {document.body.classList.toggle(
      "mk-minimal-fix", true
    );}
    

      document.body.classList.toggle(
        "mk-spaces-enabled",
        this.superstate.settings.spacesEnabled
      );

      if (!this.superstate.settings.spacesDisablePatch && this.superstate.settings.navigatorEnabled) patchFilesPlugin(this);
      
      
    }
    

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.activeFileChange())
      
    );
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      this.activeFileChange()
    }));
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
    let state = null;
    let leaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
    if (!leaf) {
      leaf = this.app.workspace.getActiveViewOfType(SpaceViewContainer)?.leaf;
    }
    
    const activeView = leaf?.view;
    //@ts-ignore
    if (!activeView || leaf.isFlowBlock) return null;
    if (activeView.getViewType() == SPACE_VIEW_TYPE ) {
      modifyTabSticker(this)
      state = activeView.getState();
      filePath =  activeView.getState().path
      
    } else if (activeView.getViewType() == "markdown") {
      filePath = activeView.file.path;
      state = activeView.getState();
      modifyFlowDom(this)
      modifyTabSticker(this)
  }
  if (!filePath || !state) return null;
    return {
      path: filePath,
      state: state
    };
  }

  fixFileWarnings () {
    openPathFixer(this);
  }
  
  activeFileChange() {
    
    const activeFile = this.getActiveFile();
    

    if (activeFile) {
      if (this.superstate.ui.activePath == activeFile?.path) {
        this.superstate.ui.setActiveState(activeFile.state)
        return;
    } 
      this.superstate.ui.setActivePath(activeFile.path);
      this.superstate.ui.setActiveState(activeFile.state)
    }
  }
  
  releaseTheNotes() {
    openURL('https://www.make.md/static/latest.md', this.app, true)
  }
  getStarted() {
    openURL('https://www.make.md/static/GetStarted.md', this.app, true)
  }
  closeExtraFileTabs () {
    let filesFound = false;
          if (Platform.isMobile) {
            this.app.workspace.leftSplit?.children.forEach((g: any) => {
                if (g.view.getViewType() == 'file-explorer') {
                  if (!filesFound) {
                    filesFound = true;
                  } else {
                    this.app.workspace.leftSplit.removeChild(g);
                  }
                }
            })
            return;
          }
          this.app.workspace.leftSplit?.children.forEach((f: WorkspaceSplit) => {
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
  loadCommands() {
    this.registerObsidianProtocolHandler("make", async (e) => {
      const parameters = e as unknown as { [key: string]: string };
      if (parameters.kit) {
        installKitModal(this, this.superstate, parameters.kit, window);
      }
      if (parameters.open) {
        this.superstate.ui.openPath(parameters.open);
      }

  });
  if (!isPhone(this.superstate.ui))
  this.addCommand({
    id: "open-ever-view",
    name: "Open Overview",
    callback: () => {
      this.openEverView();
    
    },
  })
  this.addCommand({
    id: "show-warnings",
    name: "Show Sync Warnings",
    callback: () => {
      showWarningsModal(this.superstate, window);
    },
  })
  this.addCommand({
    id: "logs",
    name: "Toggle Enhanced Logs",
    callback: () => {
      this.superstate.settings.enhancedLogs = !this.superstate.settings.enhancedLogs;
      this.saveSettings();
    },
  })
  this.addCommand({
    id: "path-fixer",
    name: "Fix Unsupported Characters in Paths",
    callback: () => {
      openPathFixer(this);
    },
  })
  this.addCommand({
    id: "move-space-folder",
    name: "Move Space Data Folder",
    callback: () => {
      const win = windowFromDocument(this.app.workspace.getLeaf()?.containerEl.ownerDocument)
      openInputModal(this.superstate, "Move Space Data Folder", this.superstate.settings.spaceSubFolder, (path) => {moveSpaceFiles(this, this.superstate.settings.spaceSubFolder, path)}, "Move", win);
    },
  })
    if (this.superstate.settings.spacesEnabled) {
      
      this.addCommand({
        id: 'mk-debug-close-tabs',
        name: "Close Extra File Tabs",
        callback: () => {
          this.closeExtraFileTabs();
        }
      })

      this.addCommand({
        id: "mk-open-kit",
        name: "Open Kit",
        callback: () => {
            installKitModal(this, this.superstate, '', window);
        },
      });

      this.addCommand({
        id: "mk-kit",
        name: "Save Space as Kit",
        callback: () => {
          const path = this.getActiveFile().path;
          if (this.superstate.spacesIndex.has(path)) {
            exportSpaceKit(this, this.superstate, path, path).then((kit) => {
              this.superstate.spaceManager.createItemAtPath('/', 'mkit', 'kit', JSON.stringify(kit))
            })
          }
        },
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
      this.addCommand({
        id: "mk-get-started",
        name: i18n.commandPalette.getStarted,
        callback: () => {
          this.getStarted();
        },
      });
      this.addCommand({
        id: "mk-reveal-file",
        name: i18n.commandPalette.revealFile,
        callback: () => {
          const file = this.superstate.ui.activePath;
          if (!file) return;
          const evt = new CustomEvent(eventTypes.revealPath, {
            detail: { path: file },
          });
          window.dispatchEvent(evt);
        },
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
    
    if (this.superstate.settings.blinkEnabled) {
      this.addCommand({
        id: "mk-blink",
        name: i18n.commandPalette.blink,
        callback: () => this.quickOpen(this.superstate),
        hotkeys: [
          {
            modifiers: ["Mod"],
            key: "o",
          },
        ],
      });
    }
    
    
    
  }
  loadContext() {
    
    if (this.superstate.settings.contextEnabled) {
      
      
      
      this.app.workspace.onLayoutReady(async () => {
        this.closeExtraFileTabs();
        if (this.superstate.settings.enableDefaultSpaces
        ) {
          await this.files.createFolder(this.superstate.settings.spacesFolder);
          
        }
      });
      
      this.registerExtensions(["mdb"], MDB_FILE_VIEWER_TYPE);
      this.app.workspace.onLayoutReady(async () => {

        if (this.superstate.settings.autoOpenFileContext) {
          await this.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE);
        }
        setTimeout(() => this.activeFileChange(), 2000);
      });
      if (this.superstate.settings.inlineContext) {
        this.registerMarkdownPostProcessor((element, context) => {
          replaceInlineContext(this, element, context);
        });
        document.body.classList.toggle(
          "mk-inline-context-enabled",
          this.superstate.settings.inlineContext
        );
      }
    }
  }

  openEverView () {
    const leafs = this.app.workspace.getLeavesOfType(EVER_VIEW_TYPE);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.createLeafBySplit(this.app.workspace.getLeaf(), "vertical", true);
      leaf.setViewState({ type: EVER_VIEW_TYPE });
      leaf.setPinned(true);
    } else {
        leafs.forEach((oldLeaf) => {
          if (oldLeaf.getRoot() != this.app.workspace.rootSplit)
          {
            oldLeaf.detach();
          }
            const leaf = this.app.workspace.createLeafBySplit(this.app.workspace.getLeaf(), "vertical", true);
            leaf.setViewState({ type: EVER_VIEW_TYPE });
            leaf.setPinned(true);
        });
    }
    patchWorkspace(this)
  }
  

  
public basics: MakeBasicsPlugin;    
  
  
  private debouncedRefresh: () => void = () => null;

  
   openPath = async (
    leaf: WorkspaceLeaf,
    path: string,
    flow?: boolean
  ) => {
    const uri = this.superstate.spaceManager.uriByString(path);
    if (!uri) return;
    if (uri.scheme == 'https' || uri.scheme == 'http') {
      if (this.superstate.spacesIndex.has(path)) {
        const viewType = SPACE_VIEW_TYPE;
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        await leaf.setViewState({
          type: viewType,
          state: { path: path, flow },
        });
        return;
      } else if (this.superstate.pathsIndex.has(path)) {
        const viewType = LINK_VIEW_TYPE;
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        await leaf.setViewState({
          type: viewType,
          state: { path: path, flow },
        });
        return;
      }
      window.open(uri.fullPath, '_blank');
      return;
    }
    if (uri.scheme == 'obsidian') {
        await leaf.setViewState({
          type: uri.authority,
        });
      return;
    }
  
    if (uri.ref) {
      const cache = this.superstate.pathsIndex.get(uri.path);
  
      if (cache?.type == "space" || uri.scheme == 'spaces') {
        if (flow && uri.ref == 'main') {
        await leaf.setViewState({
          type: EMBED_SPACE_VIEW_TYPE,
          state: { path: uri.fullPath },
        });
      } else {
        await leaf.setViewState({
          type: SPACE_FRAGMENT_VIEW_TYPE,
          state: { path: uri.fullPath, flow },
        });
      }
      return;
    }
    }
    
    if (uri.scheme == 'spaces') {
      openTagContext(leaf, uri.basePath, this.app)
      return;
    }
    this.files.getFile(path).then(f => {
      if (f)
      {
        if (f.isFolder) {
          openTFolder(leaf, getAbstractFileAtPath(this.app, f.path) as TFolder, this, flow);
        } else if (f) {
          openTFile(leaf, getAbstractFileAtPath(this.app, f.path) as TFile, this.app);
        } else {
          return;
        }
      } else {
        if (path.contains('/')) {
          const folder = removeTrailingSlashFromFolder(getParentPathFromString(path));
          const spaceFolder = this.superstate.spacesIndex.get(folder);
          if (spaceFolder) {
            newPathInSpace(
              this.superstate,
                  spaceFolder,
                  fileExtensionForFile(path),
                  fileNameForFile(path),
                );
              }
        } else {
          defaultSpace(this.superstate, this.superstate.pathsIndex.get(this.superstate.ui.activePath)).then(f => {
            if (f)
          newPathInSpace(
        this.superstate,
            f,
            fileExtensionForFile(path),
            fileNameForFile(path),
          )});
        }
    }})
    
  };

  async onload() {
const start = Date.now();
const settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.mdbFileAdapter = new MDBFileTypeAdapter(this);   

    this.files = FilesystemMiddleware.create();
    this.obsidianAdapter = new ObsidianFileSystem(this, this.files, normalizePath(
      this.app.vault.configDir + "/plugins/make-md/Spaces.mdb"
    ))
    this.files.initiateFileSystemAdapter(this.obsidianAdapter, true);
this.markdownAdapter = new ObsidianMarkdownFiletypeAdapter(this);
    this.files.initiateFiletypeAdapter(this.mdbFileAdapter);
    this.files.initiateFiletypeAdapter(this.markdownAdapter);
    
    this.files.initiateFiletypeAdapter(new ObsidianCanvasFiletypeAdapter(this));
    this.files.initiateFiletypeAdapter(new JSONFiletypeAdapter(this));
    this.files.initiateFiletypeAdapter(new ImageFileTypeAdapter(this));
    this.files.initiateFiletypeAdapter(new IconFileTypeAdapter(this));
    
    const filesystemCosmoform = new FilesystemSpaceAdapter(this.files, settings.spaceSubFolder)
    const webSpaceAdapter = new WebSpaceAdapter();
    this.ui = new ObsidianUI(this);
    const uiManager = UIManager.create(this.ui);
    const commandsManager = CLIManager.create(new ObsidianCommands(this));
    this.superstate = 
      Superstate.create('0.9', 
      () => {
          this.debouncedRefresh();
      }, 
      new SpaceManager(), 
      uiManager,
      commandsManager
      )
    await this.loadSettings();
    
    if (this.superstate.settings.experimental)
      this.files.initiateFiletypeAdapter(new TextCacher(this));

    this.superstate.spaceManager.addSpaceAdapter(filesystemCosmoform, true);
    this.superstate.spaceManager.addSpaceAdapter(webSpaceAdapter);

    addIcon("mk-logo", mkLogo);
    
    
  this.superstate.saveSettings = () => this.saveSettings();
  this.loadViews();
    
  let cachePersister : LocalCachePersister;
    if (Platform.isMobile) {
      cachePersister = new MobileCachePersister('.makemd/superstate.mdc', this.mdbFileAdapter, ['path', 'space', 'frame', 'context', 'icon'])
    } else {
      // cachePersister = new MobileCachePersister('.makemd/superstate.mdc', this.mdbFileAdapter, ['path', 'space', 'frame', 'context', 'icon'])
      cachePersister = new LocalStorageCache('.makemd/superstate.mdc', this.mdbFileAdapter, ['path', 'space', 'frame', 'context', 'icon'])
    }
    if (this.superstate.settings.cacheIndex) {
    await cachePersister.initialize()
    }
    this.superstate.persister = cachePersister;
    this.loadSuperState();
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    await this.loadSpaces();
    this.loadContext();
    
    if (Object.keys(this.superstate.settings as Record<string, any>).some(f => f == "makerMode")){
      this.superstate.settings.basics = (this.superstate.settings as any).makerMode;
      delete (this.superstate.settings as any).makerMode;
      this.saveSettings();
    }

    if (this.superstate.settings.basics) {
    this.basics = new MakeBasicsPlugin(this);
    this.basics.loadBasics();
    }
    
    this.loadCommands();
    
    
    this.superstate.ui.notify(`Make.md - Plugin loaded in ${(Date.now()-start)/1000} seconds`, 'console');

    if (this.superstate.settings.systemName == 'Vault') {
    this.superstate.settings.systemName = this.app.vault.getName();
    this.saveSettings();
    } 
    
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
      const leaf = this.superstate.settings.spacesRightSplit ?  this.app.workspace.getRightLeaf(false) :  this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach && !this.app.workspace.leftSplit.collapsed) this.app.workspace.revealLeaf(leaf);
    } else {
      if (!this.app.workspace.leftSplit.collapsed && showAfterAttach)
      {
        const leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    for (const leaf of leafs) {
      if (leaf.view instanceof FileTreeView) leaf.view.destroy();
      leaf.detach();
    }
        const leaf = this.superstate.settings.spacesRightSplit ?  this.app.workspace.getRightLeaf(false) :  this.app.workspace.getLeftLeaf(false);
        await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
        this.app.workspace.revealLeaf(leaf);
      }
    }
    if (isTouchScreen(this.superstate.ui)) {
      this.app.workspace.leftSplit.collapse();
    }
    
    this.closeDuplicateTabs();
  };

  closeDuplicateTabs = () => {
    try {
      //@ts-ignore
    this.app.workspace.leftSplit.children[0].children.filter((f, i, a) => i != a.findIndex(g => g.view.getViewType() == f.view.getViewType())).forEach(g => this.app.workspace.leftSplit.children[0].removeChild(g))
    }
    catch {
      
    }
  }
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
    if (isTouchScreen(this.superstate.ui) && !reveal) {
      this.app.workspace.rightSplit.collapse();
    }
  };

  refreshFileContextLeafs = () => {
    this.detachFileContextLeafs();
    this.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE);
  };

  

  async loadSettings() {
    this.superstate.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (this.superstate.settings.hiddenExtensions.length == 1 && this.superstate.settings.hiddenExtensions[0] == ".mdb") {
      this.superstate.settings.hiddenExtensions = DEFAULT_SETTINGS.hiddenExtensions;
    }
    const userConfig = safelyParseJSON(await defaultConfigFile(this));
    this.superstate.settings.newFileFolderPath = userConfig.newFileFolderPath;
    this.superstate.settings.newFileLocation = userConfig.newFileLocation;
    this.saveSettings();
  }

  async saveSettings(refresh = true) {

    await this.saveData(this.superstate.settings);
    this.obsidianAdapter.pathLastUpdated.set(normalizePath(this.app.vault.configDir + "/plugins/make-md/data.json"), Date.now());
    if (refresh)
    this.superstate.dispatchEvent("settingsChanged", null)
    
  }

  onunload() {
    console.log("Unloading Make.md");
    this.superstate.persister.unload();
    
    this.detachFileTreeLeafs();
  }
}
