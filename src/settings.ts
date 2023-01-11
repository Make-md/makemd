import t from "i18n";
import {
  App,
  DropdownComponent, PluginSettingTab,
  Setting
} from "obsidian";
import { eventTypes, SectionTree, StringTree } from "types/types";
import MakeMDPlugin from "./main";
export type DeleteFileOption = "trash" | "permanent" | "system-trash";

export interface MakeMDPluginSettings {
  filePreviewOnHover: boolean;
  markSans: boolean;
  makeMenuPlaceholder: boolean;
  inlineStyler: boolean;
  mobileMakeBar: boolean;
  inlineStylerColors: boolean;
  editorFlow: boolean;
  internalLinkClickFlow: boolean;
  editorFlowStyle: string;
  spacesEnabled: boolean;
  spacesDisablePatch: boolean;
  spacesPerformance: boolean;
  spacesStickers: boolean;
  sidebarTabs: boolean;
  showRibbon: boolean;
  deleteFileOption: DeleteFileOption;
  autoOpenFileContext: boolean;
  expandedFolders: Record<string, string[]>;
  expandedSpaces: string[];
  saveAllContextToFrontmatter: boolean;
  folderRank: StringTree;
  openFolders: string[];
  fileIcons: [string, string][];
  spaces: SectionTree[];
  pinnedSpaces: string[];

  tagContextFolder: string;
  folderContextFile: string;
  folderNoteInsideFolder: boolean;
  enableFolderNote: boolean;
  revealActiveFile: boolean;
  spacesCompactMode: boolean;
  menuTriggerChar: string;
  emojiTriggerChar: string;

  hiddenFiles: string[];
  hiddenExtensions: string[];
  vaultSort: [string, boolean];
  newFileLocation: string;
  newFileFolderPath: string;
}

export const DEFAULT_SETTINGS: MakeMDPluginSettings = {
  filePreviewOnHover: false,
  markSans: false,
  makeMenuPlaceholder: true,
  mobileMakeBar: true,
  inlineStyler: true,
  inlineStylerColors: false,
  editorFlow: true,
  internalLinkClickFlow: true,
  saveAllContextToFrontmatter: false,
  editorFlowStyle: "seamless",
  autoOpenFileContext: false,
  spacesCompactMode: false,
  spacesEnabled: true,
  spacesPerformance: false,
  enableFolderNote: true,
  revealActiveFile: false,
  spacesStickers: true,
  spacesDisablePatch: false,
  folderNoteInsideFolder: true,
  sidebarTabs: true,
  showRibbon: true,
  deleteFileOption: "trash",
  expandedFolders: {},
  expandedSpaces: ["/"],
  folderRank: {
    node: "root",
    children: [],
    isFolder: true,
  },
  openFolders: [],
  fileIcons: [],
  spaces: [],
  pinnedSpaces: [],
  menuTriggerChar: "/",
  emojiTriggerChar: ":",
  folderContextFile: "context",
  tagContextFolder: "Context",
  hiddenFiles: ["Context"],
  hiddenExtensions: ["mdb"],
  vaultSort: ["rank", true],
  newFileLocation: "root",
  newFileFolderPath: "",
};

export class MakeMDPluginSettingsTab extends PluginSettingTab {
  plugin: MakeMDPlugin;

  constructor(app: App, plugin: MakeMDPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  refreshView() {
    let evt = new CustomEvent(eventTypes.refreshView, {});
    window.dispatchEvent(evt);
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: t.settings.sectionAppearance });
    new Setting(containerEl)
      .setName(t.settings.sidebarTabs.name)
      .setDesc(t.settings.sidebarTabs.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.sidebarTabs).onChange((value) => {
          this.plugin.settings.sidebarTabs = value;
          this.plugin.saveSettings();
          document.body.classList.toggle("mk-hide-tabs", !value);
        })
      );
    new Setting(containerEl)
      .setName(t.settings.hideRibbon.name)
      .setDesc(t.settings.hideRibbon.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showRibbon).onChange((value) => {
          this.plugin.settings.showRibbon = value;
          this.plugin.saveSettings();
          document.body.classList.toggle("mk-hide-ribbon", !value);
        })
      );

    new Setting(containerEl)
      .setName(t.settings.compactMode.name)
      .setDesc(t.settings.compactMode.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacesCompactMode)
          .onChange((value) => {
            this.plugin.settings.spacesCompactMode = value;
            this.plugin.detachFileTreeLeafs();
            // this.plugin.openFileTreeLeaf(true);
            this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: t.settings.sectionSidebar });
    new Setting(containerEl)
      .setName(t.settings.spaces.name)
      .setDesc(t.settings.spaces.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacesEnabled)
          .onChange((value) => {
            this.plugin.settings.spacesEnabled = value;
            this.plugin.saveSettings();
            if (value) {
              this.plugin.openFileTreeLeaf(true);
            } else {
              this.plugin.detachFileTreeLeafs();
            }
            this.refreshView();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.spacesStickers.name)
      .setDesc(t.settings.spacesStickers.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacesStickers)
          .onChange((value) => {
            this.plugin.settings.spacesStickers = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );

    new Setting(containerEl)
      .setName(t.settings.folderNote.name)
      .setDesc(t.settings.folderNote.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableFolderNote)
          .onChange((value) => {
            this.plugin.settings.enableFolderNote = value;
            this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.activeFile.name)
      .setDesc(t.settings.activeFile.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.revealActiveFile)
          .onChange((value) => {
            this.plugin.settings.revealActiveFile = value;
            this.plugin.saveSettings();
          })
      );
    containerEl.createEl("h2", { text: "Context" });

    new Setting(containerEl)
      .setName(t.settings.openFileContext.name)
      .setDesc(t.settings.openFileContext.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoOpenFileContext)
          .onChange((value) => {
            this.plugin.settings.autoOpenFileContext = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.settings.syncContextToFrontmatter.name)
      .setDesc(t.settings.syncContextToFrontmatter.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoOpenFileContext)
          .onChange((value) => {
            this.plugin.settings.autoOpenFileContext = value;
            this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: t.settings.sectionFlow });
    new Setting(containerEl)
      .setName(t.settings.internalLinkFlowEditor.name)
      .setDesc(t.settings.internalLinkFlowEditor.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.internalLinkClickFlow)
          .onChange((value) => {
            this.plugin.settings.internalLinkClickFlow = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.editorFlowReplace.name)
      .setDesc(t.settings.editorFlowReplace.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.editorFlow).onChange((value) => {
          this.plugin.settings.editorFlow = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
      );
    new Setting(containerEl)
      .setName(t.settings.editorFlowStyle.name)
      .setDesc(t.settings.editorFlowStyle.desc)
      .addDropdown((dropdown: DropdownComponent) => {
        dropdown.addOption("classic", t.settings.editorFlowStyle.classic);
        dropdown.addOption("seamless", t.settings.editorFlowStyle.seamless);
        dropdown.addOption("minimal", "Minimal");
        dropdown
          .setValue(this.plugin.settings.editorFlowStyle)
          .onChange(async (value) => {
            this.plugin.settings.editorFlowStyle = value;
            document.body.classList.toggle("mk-flow-classic", false);
            document.body.classList.toggle("mk-flow-seamless", false);
            document.body.classList.toggle("mk-flow-minimal", false);
            if (value == "seamless")
              document.body.classList.toggle("mk-flow-seamless", true);
            if (value == "classic")
              document.body.classList.toggle("mk-flow-classic", true);
            if (value == "minimal")
              document.body.classList.toggle("mk-flow-minimal", true);
          });
      });

    containerEl.createEl("h2", { text: t.settings.sectionEditor });

    new Setting(containerEl)
      .setName(t.settings.makeChar.name)
      .setDesc(t.settings.makeChar.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.settings.menuTriggerChar)
          .onChange(async (value) => {
            if (value.trim().length < 1) {
              text.setValue(this.plugin.settings.menuTriggerChar);
              return;
            }

            let char = value[0];

            if (value.trim().length === 2) {
              char = value.replace(this.plugin.settings.menuTriggerChar, "");
            }

            text.setValue(char);

            this.plugin.settings.menuTriggerChar = char;

            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t.settings.editorMakePlacholder.name)
      .setDesc(t.settings.editorMakePlacholder.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.makeMenuPlaceholder)
          .onChange((value) => {
            this.plugin.settings.makeMenuPlaceholder = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );

    new Setting(containerEl)
      .setName(t.settings.mobileMakeBar.name)
      .setDesc(t.settings.mobileMakeBar.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.mobileMakeBar)
          .onChange((value) => {
            this.plugin.settings.mobileMakeBar = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );

    new Setting(containerEl)
      .setName(t.settings.inlineStyler.name)
      .setDesc(t.settings.inlineStyler.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.inlineStyler).onChange((value) => {
          this.plugin.settings.inlineStyler = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
      );

    containerEl.createEl("h2", { text: t.settings.sectionAdvanced });

    new Setting(containerEl)
      .setName(t.settings.spacesFileExplorerDual.name)
      .setDesc(t.settings.spacesFileExplorerDual.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacesDisablePatch)
          .onChange((value) => {
            this.plugin.settings.spacesDisablePatch = value;
            this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.folderNoteLocation.name)
      .setDesc(t.settings.folderNoteLocation.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.folderNoteInsideFolder)
          .onChange((value) => {
            this.plugin.settings.folderNoteInsideFolder = value;
            this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.spacesPerformance.name)
      .setDesc(t.settings.spacesPerformance.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.spacesPerformance)
          .onChange((value) => {
            this.plugin.settings.spacesPerformance = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.settings.spacesDeleteOption.name)
      .setDesc(t.settings.spacesDeleteOption.desc)
      .addDropdown((dropdown) => {
        dropdown.addOption(
          "permanent",
          t.settings.spacesDeleteOptions.permanant
        );
        dropdown.addOption("trash", t.settings.spacesDeleteOptions.trash);
        dropdown.addOption(
          "system-trash",
          t.settings.spacesDeleteOptions["system-trash"]
        );
        dropdown.setValue(this.plugin.settings.deleteFileOption);
        dropdown.onChange((option: DeleteFileOption) => {
          this.plugin.settings.deleteFileOption = option;
          this.plugin.saveSettings();
        });
      });

    // new Setting(containerEl)
    // .setName('Tag Context Folder')
    // .setDesc('Store context data for tags in this folder.')
    // .addText((text) => {
    //   text
    //     .setValue(this.plugin.settings.tagContextFolder)
    //     .onChange(async (value) => {
    //       text.setValue(value);
    //       this.plugin.settings.tagContextFolder = value;
    //       await this.plugin.saveSettings();
    //     });
    // });

    new Setting(containerEl)
      .setName(t.settings.inlineStylerColor.name)
      .setDesc(t.settings.inlineStylerColor.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineStylerColors)
          .onChange((value) => {
            this.plugin.settings.inlineStylerColors = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.editorMarkSans.name)
      .setDesc(t.settings.editorMarkSans.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.markSans).onChange((value) => {
          this.plugin.settings.markSans = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
      );
  }
}
