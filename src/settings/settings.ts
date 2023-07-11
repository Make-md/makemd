import t from "i18n";
import { App, DropdownComponent, PluginSettingTab, Setting } from "obsidian";
import MakeMDPlugin from "../main";
import { DeleteFileOption, InlineContextLayout, MakeMDPluginSettings } from "../types/settings";


export const DEFAULT_SETTINGS: MakeMDPluginSettings = {
  defaultInitialization: false,
  filePreviewOnHover: false,
  flowMenuEnabled: true,
  markSans: false,
  blinkEnabled: true,
  makeMenuPlaceholder: true,
  mobileMakeBar: true,
  inlineStyler: true,
  makerMode: true,
  inlineStylerColors: false,
  editorFlow: true,
  internalLinkClickFlow: true,
  contextEnabled: true,
  saveAllContextToFrontmatter: true,
  editorFlowStyle: "seamless",
  autoOpenFileContext: false,
  activeView: "root",
  hideFrontmatter: true,
  activeSpace: "",
  spacesCompactMode: false,
  defaultDateFormat: "MMM dd yyyy",
  spacesEnabled: true,
  spacesPerformance: false,
  collapsedTags: [],
  enableFolderNote: true,
  folderIndentationLines: true,
  revealActiveFile: false,
  spacesStickers: true,
  spaceRowHeight: 29,
  spacesDisablePatch: false,
  folderNoteInsideFolder: true,
  folderNoteDefaultView: true,
  sidebarTabs: true,
  showRibbon: true,
  deleteFileOption: "trash",
  expandedFolders: {},
  expandedSpaces: ["/"],
  openFolders: [],
  fileIcons: [],
  cachedSpaces: [],
  menuTriggerChar: "/",
  inlineStickerMenu: true,
  emojiTriggerChar: ":",
  folderContextFile: "context",
  tagContextFolder: "Context",
  hiddenFiles: ["Context"],
  lineNumbers: false,
  hiddenExtensions: ["mdb"],
  newFileLocation: "root",
  newFileFolderPath: "",
  inlineBacklinks: false,
  inlineContext: true,
  inlineBacklinksExpanded: false,
  inlineContextExpanded: true,
  inlineContextSectionsExpanded: true,
  dataviewInlineContext: false,
  inlineContextNameLayout: "vertical",
  spacesSyncLastUpdated: 'Context/spacesLastSync.log',
  spacesSyncTimeoutSeconds: 10,
  spacesAutoBackup: true,
  spacesAutoBackupInterval: 10,
  spacesAutoBackupLast: 0,
  spacesUseAlias: false,
  precreateVaultSpace: false,
  fmKeyAlias: 'alias',
  fmKeyBanner: 'banner',
  fmKeyColor: 'color',
  fmKeySticker: 'sticker',
  openSpacesOnLaunch: true,
  indexSVG: false
};

export class MakeMDPluginSettingsTab extends PluginSettingTab {
  plugin: MakeMDPlugin;

  constructor(app: App, plugin: MakeMDPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  refreshView() {
    this.display();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h1", { text: t.settings.sectionSidebar });
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
    
if (this.plugin.settings.spacesEnabled) {
  containerEl.createEl("h3", { text: t.settings.sectionAppearance });
  const spaceAppearances = containerEl.createEl("div");
  new Setting(spaceAppearances)
    .setName(t.settings.sidebarTabs.name)
    .setDesc(t.settings.sidebarTabs.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.sidebarTabs).onChange((value) => {
        this.plugin.settings.sidebarTabs = value;
        this.plugin.saveSettings();
        document.body.classList.toggle("mk-hide-tabs", !value);
      })
    );
  new Setting(spaceAppearances)
    .setName(t.settings.hideRibbon.name)
    .setDesc(t.settings.hideRibbon.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.showRibbon).onChange((value) => {
        this.plugin.settings.showRibbon = value;
        this.plugin.saveSettings();
        document.body.classList.toggle("mk-hide-ribbon", !value);
      })
    );

  new Setting(spaceAppearances)
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
  
  new Setting(spaceAppearances)
    .setName(t.settings.folderIndentationLines.name)
    .setDesc(t.settings.folderIndentationLines.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.folderIndentationLines)
        .onChange((value) => {
          this.plugin.settings.folderIndentationLines = value;
          this.plugin.saveSettings();
          document.body.classList.toggle("mk-folder-lines", value);
        })
    );
    new Setting(spaceAppearances)
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
    new Setting(spaceAppearances)
    .setName(t.settings.spacesAlias.name)
    .setDesc(t.settings.spacesAlias.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.spacesUseAlias)
        .onChange((value) => {
          this.plugin.settings.spacesUseAlias = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.openSpacesOnLaunch.name)
    .setDesc(t.settings.openSpacesOnLaunch.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.openSpacesOnLaunch)
        .onChange((value) => {
          this.plugin.settings.openSpacesOnLaunch = value;
          this.plugin.saveSettings();
        })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.spaceRowHeight.name)
    .setDesc(t.settings.spaceRowHeight.desc)
    .addText((text) => {
      text
        .setValue(this.plugin.settings.spaceRowHeight.toString())
        .onChange(async (value) => {
          text.setValue(parseInt(value).toString());
          this.plugin.settings.spaceRowHeight = parseInt(value);
          await this.plugin.saveSettings();
        });
    });
    containerEl.createEl("h3", { text: "Folder Note" });
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
    .setName(t.settings.folderViewDefault.name)
    .setDesc(t.settings.folderViewDefault.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.folderNoteDefaultView)
        .onChange((value) => {
          this.plugin.settings.folderNoteDefaultView = value;
          this.plugin.saveSettings();
        })
    );
    containerEl.createEl("h3", { text: "Sync and Backup" });
    new Setting(containerEl)
    .setName(t.settings.syncTimeout.name)
    .setDesc(t.settings.syncTimeout.desc)
    .addText((text) => {
      text
        .setValue(this.plugin.settings.spacesSyncTimeoutSeconds.toString())
        .onChange(async (value) => {
          text.setValue(parseInt(value).toString());

          this.plugin.settings.spacesSyncTimeoutSeconds = parseInt(value);

          await this.plugin.saveSettings();
        });
    });
    
    new Setting(containerEl)
    .setName(t.settings.spaceAutoBackup.name)
    .setDesc(t.settings.spaceAutoBackup.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.spacesAutoBackup)
        .onChange((value) => {
          this.plugin.settings.spacesAutoBackup = value;
          this.plugin.saveSettings();
        })
    );
    
    new Setting(containerEl)
    .setName(t.settings.spaceAutoBackupInterval.name)
    .setDesc(t.settings.spaceAutoBackupInterval.desc)
    .addText((text) => {
      text
        .setValue(this.plugin.settings.spacesAutoBackupInterval.toString())
        .onChange(async (value) => {
          text.setValue(parseInt(value).toString());

          this.plugin.settings.spacesAutoBackupInterval = parseInt(value);

          await this.plugin.saveSettings();
        });
    });
    containerEl.createEl("h3", { text: "Advanced" });
  new Setting(containerEl)
    .setName(t.settings.hoverPreview.name)
    .setDesc(t.settings.hoverPreview.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.filePreviewOnHover)
        .onChange((value) => {
          this.plugin.settings.filePreviewOnHover = value;
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
    .setName(t.settings.indexSVG.name)
    .setDesc(t.settings.indexSVG.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.indexSVG)
        .onChange((value) => {
          this.plugin.settings.indexSVG = value;
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
}
    
    containerEl.createEl("h1", { text: "Context" });
    new Setting(containerEl)
      .setName(t.settings.contexts.name)
      .setDesc(t.settings.contexts.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.contextEnabled)
          .onChange((value) => {
            this.plugin.settings.contextEnabled = value;
            this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      containerEl.createEl("h3", { text: t.settings.sectionAppearance });
      new Setting(containerEl)
      .setName(t.settings.defaultDateFormat.name)
      .setDesc(t.settings.defaultDateFormat.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.settings.defaultDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.defaultDateFormat = value;
            await this.plugin.saveSettings();
          });
      });
      
      
      
      containerEl.createEl("h3", { text: t.settings.sectionAdvanced });
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
          .setValue(this.plugin.settings.saveAllContextToFrontmatter)
          .onChange((value) => {
            this.plugin.settings.saveAllContextToFrontmatter = value;
            this.plugin.saveSettings();
          })
      );
      containerEl.createEl("h1", { text: "Blink" });
      new Setting(containerEl)
      .setName(t.settings.blink.name)
      .setDesc(t.settings.blink.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.blinkEnabled)
          .onChange(async (value) => {
            this.plugin.settings.blinkEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
  
    containerEl.createEl("h1", { text: t.settings.sectionFlow });
    new Setting(containerEl)
    .setName(t.settings.editorMakerMode.name)
    .setDesc(t.settings.editorMakerMode.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.makerMode).onChange((value) => {
        this.plugin.settings.makerMode = value;
        this.plugin.saveSettings();
        this.refreshView();
      })
    );
    if (this.plugin.settings.makerMode) {

    
    containerEl.createEl("h3", { text: "Inline Context" });  
    new Setting(containerEl)
      .setName(t.settings.inlineContextExplorer.name)
      .setDesc(t.settings.inlineContextExplorer.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineContext)
          .onChange((value) => {
            this.plugin.settings.inlineContext = value;
            this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.lineNumbers.name)
      .setDesc(t.settings.lineNumbers.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.lineNumbers)
          .onChange(async (value) => {
            this.plugin.settings.lineNumbers = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineContextExpanded.name)
      .setDesc(t.settings.inlineContextExpanded.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineContextSectionsExpanded)
          .onChange((value) => {
            this.plugin.settings.inlineContextSectionsExpanded = value;
            this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.inlineContextHorizontal.name)
      .setDesc(t.settings.inlineContextHorizontal.desc)
      .addDropdown((dropdown) => {
        dropdown.addOption("vertical", t.settings.layoutVertical);
        dropdown.addOption("horizontal", t.settings.layoutHorizontal);
        dropdown.setValue(this.plugin.settings.inlineContextNameLayout);
        dropdown.onChange((option: InlineContextLayout) => {
          this.plugin.settings.inlineContextNameLayout = option;
          this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t.settings.hideFrontmatter.name)
      .setDesc(t.settings.hideFrontmatter.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.hideFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.hideFrontmatter = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.dataviewInlineContext.name)
      .setDesc(t.settings.dataviewInlineContext.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.dataviewInlineContext)
          .onChange((value) => {
            this.plugin.settings.dataviewInlineContext = value;
            this.plugin.saveSettings();
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineBacklinks.name)
      .setDesc(t.settings.inlineBacklinks.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineBacklinks)
          .onChange(async (value) => {
            this.plugin.settings.inlineBacklinks = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      containerEl.createEl("h3", { text: "Flow Block" });  
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
      .setName(t.settings.internalLinkFlowEditor.name)
      .setDesc(t.settings.internalLinkFlowEditor.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.internalLinkClickFlow)
          .onChange(async (value) => {
            this.plugin.settings.internalLinkClickFlow = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
   
    new Setting(containerEl)
      .setName(t.settings.editorFlowStyle.name)
      .setDesc(t.settings.editorFlowStyle.desc)
      .addDropdown((dropdown: DropdownComponent) => {
        dropdown.addOption("classic", t.settings.editorFlowStyle.classic);
        dropdown.addOption("seamless", t.settings.editorFlowStyle.seamless);
        dropdown.addOption("minimal", t.settings.editorFlowStyle.minimal);
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

    


    
      containerEl.createEl("h3", { text: "Flow Menu" });
      new Setting(containerEl)
      .setName(t.settings.editorMakeMenu.name)
      .setDesc(t.settings.editorMakeMenu.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.flowMenuEnabled)
          .onChange(async (value) => {
            this.plugin.settings.flowMenuEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
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
          .onChange(async (value) => {
            this.plugin.settings.makeMenuPlaceholder = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      containerEl.createEl("h3", { text: "Flow Styler" });
    

    new Setting(containerEl)
      .setName(t.settings.inlineStyler.name)
      .setDesc(t.settings.inlineStyler.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineStyler)
          .onChange(async (value) => {
            this.plugin.settings.inlineStyler = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineStickerMenu.name)
      .setDesc(t.settings.inlineStickerMenu.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.inlineStickerMenu)
          .onChange(async (value) => {
            this.plugin.settings.inlineStickerMenu = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
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
    }

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

    
    // new Setting(containerEl)
    //   .setName(t.settings.editorMarkSans.name)
    //   .setDesc(t.settings.editorMarkSans.desc)
    //   .addToggle((toggle) =>
    //     toggle.setValue(this.plugin.settings.markSans).onChange((value) => {
    //       this.plugin.settings.markSans = value;
    //       this.plugin.saveSettings();
    //       this.refreshView();
    //     })
    //   );
  }
}
