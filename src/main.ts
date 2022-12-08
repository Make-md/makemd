import {
  FileExplorerPlugin,
  Plugin,
  addIcon,
  TAbstractFile,
  MarkdownView,
  WorkspaceLeaf,
  Menu,
  EphemeralState,
  ViewState,
  WorkspaceItem,
  WorkspaceContainer,
  Workspace,
  App,
  Plugin_2,
} from "obsidian";
import {
  FILE_TREE_VIEW_TYPE,
  FileTreeView,
  ICON,
  SETS_VIEW_TYPE,
} from "./components/Spaces/FileTreeView";
import {
  MakeMDPluginSettings as MakeMDPluginSettings,
  MakeMDPluginSettingsTab,
  DEFAULT_SETTINGS,
} from "./settings";
import {
  eventTypes,
  FocusPortalEvent,
  LoadPortalEvent,
  OpenFilePortalEvent,
  SpawnPortalEvent,
  VaultChange,
} from "types/types";
import MakeMenu from "components/MakeMenu/MakeMenu";
import StickerMenu from "components/StickerMenu/StickerMenu";
import { FlowView, FOLDER_VIEW_TYPE } from "components/FlowView/FlowView";
import { FlowEditor } from "components/FlowEditor/FlowEditor";
import { around } from "monkey-around";
import { EditorView } from "@codemirror/view";
import "css/makerMode.css";
import { cmExtensions } from "cm-extensions/cmExtensions";
import {
  focusPortal,
  loadFlowEditorByDOM,
  loadFlowEditorsForLeaf,
  openFileFromPortal,
  spawnNewPortal,
} from "utils/flowEditor";
import { replaceAllEmbed } from "utils/markdownPost";
import { toggleMark } from "cm-extensions/inlineStylerView/marks";
import { platformIsMobile } from "utils/utils";
import { replaceMobileMainMenu } from "components/Spaces/MainMenu";
import { loadStylerIntoContainer } from "cm-extensions/inlineStylerView/InlineMenu";
import { patchFileExplorer, patchWorkspace } from "utils/patches";
import { platform } from "os";
import { getActiveCM, iterateTreeAtPos } from "utils/codemirror";
import { mkLogo } from "utils/icons";
import {
  flowEditorInfo,
  toggleFlowEditor,
} from "cm-extensions/flowEditor/flowEditor";
import t from "i18n";
export default class MakeMDPlugin extends Plugin {
  settings: MakeMDPluginSettings;
  activeEditorView?: MarkdownView;
  flowEditors: FlowEditor[];

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

  loadSpaces() {
    patchWorkspace(this);
    document.body.classList.toggle("mk-hide-tabs", !this.settings.sidebarTabs);
    this.registerView(FOLDER_VIEW_TYPE, (leaf) => {
      return new FlowView(leaf, this);
    });
    if (this.settings.spacesEnabled) {
      if (!this.settings.spacesDisablePatch) patchFileExplorer(this);
      this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
        return new FileTreeView(leaf, this);
      });
      this.app.workspace.onLayoutReady(async () => {
        await this.openFileTreeLeaf(true);
      });
    }
    this.registerEvent(this.app.vault.on("create", this.onCreate));
    this.registerEvent(this.app.vault.on("delete", this.onDelete));
    this.registerEvent(this.app.vault.on("rename", this.onRename));
  }

  loadFlowEditor() {
    document.body.classList.toggle("mk-flow-replace", this.settings.editorFlow);
    document.body.classList.toggle(
      "mk-flow-" + this.settings.editorFlowStyle,
      true
    );

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

      window.addEventListener(eventTypes.spawnPortal, this.spawnPortal);
      window.addEventListener(eventTypes.loadPortal, this.loadPortal);
      window.addEventListener(eventTypes.focusPortal, this.focusPortal);
      window.addEventListener(
        eventTypes.openFilePortal,
        this.openFileFromPortal
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
          modifiers: ["Mod", "Shift"],
          key: "i",
        },
      ],
    });
    this.registerEditorSuggest(new MakeMenu(this.app, this));
    this.registerEditorSuggest(new StickerMenu(this.app, this));
    if (platformIsMobile() && this.settings.mobileMakeBar)
      loadStylerIntoContainer(app.mobileToolbar.containerEl, this);
  }
  async onload() {
    addIcon("mk-logo", mkLogo);
    console.log("Loading Make.md");
    // Load Settings
    this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
    await this.loadSettings();
    this.loadSpaces();
    this.loadFlowEditor();
    this.loadMakerMode();
    this.registerEditorExtension(cmExtensions(this, platformIsMobile()));
  }

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
  onCreate = (file: TAbstractFile) =>
    this.triggerVaultChangeEvent(file, "create", "");
  onDelete = (file: TAbstractFile) =>
    this.triggerVaultChangeEvent(file, "delete", "");
  onRename = (file: TAbstractFile, oldPath: string) =>
    this.triggerVaultChangeEvent(file, "rename", oldPath);

  openFileTreeLeaf = async (showAfterAttach: boolean) => {
    let leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      let leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
      if (showAfterAttach) this.app.workspace.revealLeaf(leaf);
    } else {
      leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
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

  refreshTreeLeafs = () => {
    this.detachFileTreeLeafs();
    this.openFileTreeLeaf(true);
  };

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
