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
  EMBED_SPACE_VIEW_TYPE,
  EmbedSpaceView
} from "adapters/obsidian/ui/editors/EmbedSpaceView";
import {
  MDBFileViewer,
  MDB_FILE_VIEWER_TYPE
} from "adapters/obsidian/ui/editors/MDBFileViewer";
import { FileLinkView, LINK_VIEW_TYPE } from "adapters/obsidian/ui/editors/markdownView/FileView";
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

import { modifyTabSticker } from "adapters/obsidian/utils/modifyTabSticker";


import { IconFileTypeAdapter } from "adapters/icons/iconsAdapter";
import { MobileCachePersister } from "adapters/mdb/localCache/localCacheMobile";
import { ObsidianCommands } from "adapters/obsidian/commands/obsidianCommands";
import { TextCacher } from "adapters/text/textCacher";
import { CLIManager } from "core/middleware/commands";
import { LocalCachePersister } from "core/middleware/types/persister";
import { BlinkMode, openBlinkModal } from "core/react/components/Blink/Blink";
import { openTestModal } from "core/test/TestComponent";

import { ImageFileTypeAdapter } from "adapters/image/imageAdapter";
import { LocalStorageCache } from "adapters/mdb/localCache/localCache";

import { loadFlowCommands } from "adapters/obsidian/commands/flowCommands";
import { JSONFiletypeAdapter } from "adapters/obsidian/filetypes/jsonAdapter";
import { SPACE_FRAGMENT_VIEW_TYPE, SpaceFragmentView } from "adapters/obsidian/ui/editors/SpaceFragmentViewComponent";
import { installKitModal } from "adapters/obsidian/ui/kit/InstallKitModal";
import { exportSpaceKit } from "adapters/obsidian/ui/kit/kits";
import { InteractionType } from "core/middleware/ui";
import { WebSpaceAdapter } from "core/spaceManager/webAdapter/webAdapter";
import { isTouchScreen } from "core/utils/ui/screen";
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
import "css/Panels/Navigator/FileTree.css";
import "css/Panels/Navigator/Navigator.css";
import "css/Panels/Navigator/Waypoints.css";
import "css/Panels/SpaceEditor.css";
import "css/SpaceViewer/Frame.css";
import "css/SpaceViewer/Layout.css";
import "css/SpaceViewer/Nodes.css";
import "css/SpaceViewer/SpaceView.css";
import "css/SpaceViewer/TableView.css";
import "css/SpaceViewer/Text.css";
import "css/UI/Buttons.css";
import { windowFromDocument } from "utils/dom";

const makeMDVersion = 0.999;

export default class MakeMDPlugin extends Plugin {
  app: App;
  files: FilesystemMiddleware;
  obsidianAdapter: ObsidianFileSystem
  mdbFileAdapter: MDBFileTypeAdapter;
  markdownAdapter: ObsidianMarkdownFiletypeAdapter;

  activeEditorView?: MarkdownView;
  extensions: Extension[];
  superstate: Superstate;
  ui: ObsidianUI;

  
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
    this.extensions = cmExtensions(this, this.superstate.ui.primaryInteractionType() == InteractionType.Touch);
    if (firstLoad) {
      this.registerEditorExtension(this.extensions);
    } else {
      this.app.workspace.updateOptions();
    }
  }
  quickOpen(superstate: Superstate) {
    const win = windowFromDocument(this.app.workspace.getLeaf()?.containerEl.ownerDocument)
    openBlinkModal(superstate, BlinkMode.Blink, win);
  }

  testPage() {
    openTestModal(this);
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
    
    
    
  });
}
  
loadViews () {
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

  async loadSpaces() {
    
    
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
    document.body.classList.toggle(
      "mk-minimal-fix",
      this.superstate.settings.minimalFix
    );
    

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
    
    if (this.superstate.settings.enableFolderNote && this.superstate.settings.spaceViewEnabled) {
      if (this.superstate.spacesIndex.has(path)) {
        const space = this.superstate.spacesIndex.get(path)
        const leaf = this.app.workspace.getLeaf();
        const history = leaf.history.backHistory;
        if (history[history.length - 1]?.state?.state?.file == space.space.notePath) {
          leaf.history.backHistory.pop();
        }
      }
      const pathState = this.superstate.pathsIndex.get(path);
      if (pathState?.metadata.spacePath?.length > 0) {
        
        const leaf = this.app.workspace.getLeaf();
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        leaf.setViewState({
          type: SPACE_VIEW_TYPE,
          state: { path: pathState.metadata.spacePath },
        });
        
      }
    }

    if (path) {
      this.superstate.ui.setActivePath(path)
    }
  }
  
  releaseTheNotes() {
    openURL('https://www.make.md/static/latest.md', this.app, true)
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
          const path = this.getActiveFile();
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
    this.addCommand({
      id: "mk-test",
      name: "Open Test Page",
      callback: () => {
        this.testPage()
      },
      hotkeys: [
        
      ],
    });
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
    if (this.superstate.settings.editorFlow) {
      loadFlowCommands(this);
    }
    
    
  }
  loadContext() {
    
    if (this.superstate.settings.contextEnabled) {
      
      
      
      this.app.workspace.onLayoutReady(async () => {
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
          const embeds = el.querySelectorAll(".internal-embed.markdown-embed");

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
    
    const filesystemCosmoform = new FilesystemSpaceAdapter(this.files)
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
    await cachePersister.initialize()
    this.superstate.persister = cachePersister;
    this.loadSuperState();
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    await this.loadSpaces();
    this.loadContext();
    
    this.loadMakerMode();
    this.reloadExtensions(true);
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
      const leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach && !this.app.workspace.leftSplit.collapsed) this.app.workspace.revealLeaf(leaf);
    } else {
      if (!app.workspace.leftSplit.collapsed && showAfterAttach)
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
    }
    if (isTouchScreen(this.superstate.ui)) {
      this.app.workspace.leftSplit.collapse();
    }
    replaceMobileMainMenu(this.superstate);
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
    if (refresh)
    this.superstate.dispatchEvent("settingsChanged", null)
    
  }

  onunload() {
    console.log("Unloading Make.md");

    
    this.detachFileTreeLeafs();
  }
}
