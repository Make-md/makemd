import t from "core/i18n";
import { App, DropdownComponent, PluginSettingTab, Setting } from "obsidian";
import { DeleteFileOption, InlineContextLayout } from "../../core/types/settings";
import MakeMDPlugin from "../../main";


export class MakeMDPluginSettingsTab extends PluginSettingTab {
  plugin: MakeMDPlugin;

  constructor(app: App, plugin: MakeMDPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  refreshObsidian() {
    this.app.commands.executeCommandById("app:reload")
  }

  refreshView() {
    this.display();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.innerHTML = "";

    containerEl.createEl("h1", { text: t.settings.sectionSidebar });
    new Setting(containerEl)
      .setName(t.settings.spaces.name)
      .setDesc(t.settings.spaces.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.navigatorEnabled)
          .onChange((value) => {
            this.plugin.superstate.settings.navigatorEnabled = value;
            this.plugin.saveSettings();
            
            if (value) {
              this.plugin.openFileTreeLeaf(true);
            } else {
              this.plugin.detachFileTreeLeafs();
              this.refreshObsidian();
            }
            this.refreshView();
          })
      );

    new Setting(containerEl)
    .setName(t.settings.tagSpaces.name)
    .setDesc(t.settings.tagSpaces.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.enableDefaultSpaces).onChange((value) => {
        this.plugin.superstate.settings.enableDefaultSpaces = value;
        this.plugin.saveSettings();
      })
    );
    

      new Setting(containerEl)
    .setName(t.settings.spacesStickers.name)
    .setDesc(t.settings.spacesStickers.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.spacesStickers)
        .onChange((value) => {
          this.plugin.superstate.settings.spacesStickers = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
    );
    
    new Setting(containerEl)
    .setName(t.settings.spaceView.name)
    .setDesc(t.settings.spaceView.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.spaceViewEnabled).onChange((value) => {
        this.plugin.superstate.settings.spaceViewEnabled = value;
        this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName(t.settings.folderNote.name)
    .setDesc(t.settings.folderNote.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.enableFolderNote).onChange((value) => {
        this.plugin.superstate.settings.enableFolderNote = value;
        this.plugin.saveSettings();
      })
    );
    



    
    if (this.plugin.superstate.settings.spacesEnabled) {
  containerEl.createEl("h3", { text: t.settings.sectionNavigator });
  const spaceAppearances = containerEl.createEl("div");
  new Setting(spaceAppearances)
    .setName(t.settings.sidebarTabs.name)
    .setDesc(t.settings.sidebarTabs.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.sidebarTabs).onChange((value) => {
        this.plugin.superstate.settings.sidebarTabs = value;
        this.plugin.saveSettings();
        document.body.classList.toggle("mk-hide-tabs", !value);
      })
    );
  new Setting(spaceAppearances)
    .setName(t.settings.hideRibbon.name)
    .setDesc(t.settings.hideRibbon.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.showRibbon).onChange((value) => {
        this.plugin.superstate.settings.showRibbon = value;
        this.plugin.saveSettings();
        document.body.classList.toggle("mk-hide-ribbon", !value);
      })
    );


  
  new Setting(spaceAppearances)
    .setName(t.settings.folderIndentationLines.name)
    .setDesc(t.settings.folderIndentationLines.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.folderIndentationLines)
        .onChange((value) => {
          this.plugin.superstate.settings.folderIndentationLines = value;
          this.plugin.saveSettings();
          document.body.classList.toggle("mk-folder-lines", value);
        })
    );
    
    new Setting(spaceAppearances)
    .setName(t.settings.spacesAlias.name)
    .setDesc(t.settings.spacesAlias.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.spacesUseAlias)
        .onChange((value) => {
          this.plugin.superstate.settings.spacesUseAlias = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.readableLineWidth.name)
    .setDesc(t.settings.readableLineWidth.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.readableLineWidth).onChange((value) => {
        this.plugin.superstate.settings.readableLineWidth = value;
        this.plugin.saveSettings();
      })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.openSpacesOnLaunch.name)
    .setDesc(t.settings.openSpacesOnLaunch.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.openSpacesOnLaunch)
        .onChange((value) => {
          this.plugin.superstate.settings.openSpacesOnLaunch = value;
          this.plugin.saveSettings();
        })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.spaceRowHeight.name)
    .setDesc(t.settings.spaceRowHeight.desc)
    .addText((text) => {
      text
        .setValue(this.plugin.superstate.settings.spaceRowHeight.toString())
        .onChange(async (value) => {
          text.setValue(parseInt(value).toString());
          this.plugin.superstate.settings.spaceRowHeight = parseInt(value);
          await this.plugin.saveSettings();
        });
    });

    
    
    new Setting(spaceAppearances)
    .setName(t.settings.expandFolder.name)
    .setDesc(t.settings.expandFolder.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.expandFolderOnClick)
        .onChange((value) => {
          this.plugin.superstate.settings.expandFolderOnClick = value;
          this.plugin.saveSettings();
        })
    );
    new Setting(spaceAppearances)
    .setName(t.settings.hoverPreview.name)
    .setDesc(t.settings.hoverPreview.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.filePreviewOnHover)
        .onChange((value) => {
          this.plugin.superstate.settings.filePreviewOnHover = value;
          this.plugin.saveSettings();
        })
    );
  new Setting(spaceAppearances)
    .setName(t.settings.activeFile.name)
    .setDesc(t.settings.activeFile.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.revealActiveFile)
        .onChange((value) => {
          this.plugin.superstate.settings.revealActiveFile = value;
          this.plugin.saveSettings();
        })
    );
  
    new Setting(spaceAppearances)
    .setName(t.settings.spacesFileExplorerDual.name)
    .setDesc(t.settings.spacesFileExplorerDual.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.spacesDisablePatch)
        .onChange((value) => {
          this.plugin.superstate.settings.spacesDisablePatch = value;
          this.plugin.saveSettings();
        })
    );
  
  new Setting(spaceAppearances)
    .setName(t.settings.spacesPerformance.name)
    .setDesc(t.settings.spacesPerformance.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.spacesPerformance)
        .onChange((value) => {
          this.plugin.superstate.settings.spacesPerformance = value;
          this.plugin.saveSettings();
        })
    );



    new Setting(spaceAppearances)
    .setName(t.settings.generateThumbnails.name)
    .setDesc(t.settings.generateThumbnails.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.imageThumbnails)
        .onChange((value) => {
          this.plugin.superstate.settings.imageThumbnails = value;
          this.plugin.saveSettings();
        })
    );

    new Setting(spaceAppearances)
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
      dropdown.setValue(this.plugin.superstate.settings.deleteFileOption);
      dropdown.onChange((option: DeleteFileOption) => {
        this.plugin.superstate.settings.deleteFileOption = option;
        this.plugin.saveSettings();
      });
    });  
    new Setting(containerEl)
      .setName(t.settings.newNotePlaceholder.name)
      .setDesc(t.settings.newNotePlaceholder.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.superstate.settings.newNotePlaceholder)
          .onChange(async (value) => {
            this.plugin.superstate.settings.newNotePlaceholder = value;
            await this.plugin.saveSettings();
          });
      });  
  
}

if (this.plugin.superstate.settings.spacesStickers) {
  
containerEl.createEl("h3", { text: t.settings.sectionStickers });



    new Setting(containerEl)
    .setName(t.settings.indexSVG.name)
    .setDesc(t.settings.indexSVG.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.indexSVG)
        .onChange((value) => {
          this.plugin.superstate.settings.indexSVG = value;
          this.plugin.saveSettings();
        })
    );
      }

      new Setting(containerEl)
    .setName(t.settings.coverHeight.name)
    .setDesc(t.settings.coverHeight.desc)
    .addText((text) => {
      text
        .setValue(this.plugin.superstate.settings.bannerHeight.toString())
        .onChange(async (value) => {
          text.setValue(parseInt(value).toString());
          this.plugin.superstate.settings.bannerHeight = parseInt(value);
          await this.plugin.saveSettings();
        });
    });
      if (this.plugin.superstate.settings.spaceViewEnabled) {
        
    containerEl.createEl("h3", { text: t.settings.sectionSpaceView });
    new Setting(containerEl)
      .setName(t.settings.defaultSpaceTemplate.name)
      .setDesc(t.settings.defaultSpaceTemplate.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.superstate.settings.defaultSpaceTemplate)
          .onChange(async (value) => {
            this.plugin.superstate.settings.defaultSpaceTemplate = value;
            await this.plugin.saveSettings();
          });
      });
    new Setting(containerEl)
    .setName(t.settings.minimalThemeFix.name)
    .setDesc(t.settings.minimalThemeFix.description)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.minimalFix).onChange((value) => {
        this.plugin.superstate.settings.minimalFix = value;
        this.plugin.saveSettings();
        document.body.classList.toggle("mk-minimal-fix", !value);
      })
    );
      }
    containerEl.createEl("h1", { text: t.settings.sectionContext });
    new Setting(containerEl)
      .setName(t.settings.contexts.name)
      .setDesc(t.settings.contexts.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.contextEnabled)
          .onChange((value) => {
            this.plugin.superstate.settings.contextEnabled = value;
            this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.defaultDateFormat.name)
      .setDesc(t.settings.defaultDateFormat.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.superstate.settings.defaultDateFormat)
          .onChange(async (value) => {
            this.plugin.superstate.settings.defaultDateFormat = value;
            await this.plugin.saveSettings();
          });
      });
      
      
      
      containerEl.createEl("h3", { text: t.settings.sectionAdvanced });
    new Setting(containerEl)
      .setName(t.settings.openFileContext.name)
      .setDesc(t.settings.openFileContext.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.autoOpenFileContext)
          .onChange((value) => {
            this.plugin.superstate.settings.autoOpenFileContext = value;
            this.plugin.saveSettings();
          })
      );
      
      new Setting(containerEl)
      .setName(t.settings.syncContextToFrontmatter.name)
      .setDesc(t.settings.syncContextToFrontmatter.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.saveAllContextToFrontmatter)
          .onChange((value) => {
            this.plugin.superstate.settings.saveAllContextToFrontmatter = value;
            this.plugin.saveSettings();
          })
      );
      new Setting(containerEl)
      .setName(t.settings.syncFormulaToFrontmatter.name)
      .setDesc(t.settings.syncFormulaToFrontmatter.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.syncFormulaToFrontmatter)
          .onChange((value) => {
            this.plugin.superstate.settings.syncFormulaToFrontmatter = value;
            this.plugin.saveSettings();
          })
      );
      containerEl.createEl("h1", { text: t.settings.sectionBlink});
      new Setting(containerEl)
      .setName(t.settings.blink.name)
      .setDesc(t.settings.blink.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.blinkEnabled)
          .onChange(async (value) => {
            this.plugin.superstate.settings.blinkEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
  
    containerEl.createEl("h1", { text: t.settings.sectionFlow });
    new Setting(containerEl)
    .setName(t.settings.editorMakerMode.name)
    .setDesc(t.settings.editorMakerMode.desc)
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.superstate.settings.makerMode).onChange((value) => {
        this.plugin.superstate.settings.makerMode = value;
        this.plugin.saveSettings();
        this.refreshView();
      })
    );
    if (this.plugin.superstate.settings.makerMode) {

    
    containerEl.createEl("h3", { text: t.settings.sectionInlineContext });  
    new Setting(containerEl)
      .setName(t.settings.inlineContextExplorer.name)
      .setDesc(t.settings.inlineContextExplorer.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineContext)
          .onChange((value) => {
            this.plugin.superstate.settings.inlineContext = value;
            this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      
      new Setting(containerEl)
      .setName(t.settings.inlineContextProperties.name)
      .setDesc(t.settings.inlineContextProperties.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineContextProperties)
          .onChange((value) => {
            this.plugin.superstate.settings.inlineContextProperties = value;
            this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineContextExpanded.name)
      .setDesc(t.settings.inlineContextExpanded.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineContextSectionsExpanded)
          .onChange((value) => {
            this.plugin.superstate.settings.inlineContextSectionsExpanded = value;
            this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName(t.settings.inlineContextHorizontal.name)
      .setDesc(t.settings.inlineContextHorizontal.desc)
      .addDropdown((dropdown) => {
        dropdown.addOption("vertical", t.settings.layoutVertical);
        dropdown.addOption("horizontal", t.settings.layoutHorizontal);
        dropdown.setValue(this.plugin.superstate.settings.inlineContextNameLayout);
        dropdown.onChange((option: InlineContextLayout) => {
          this.plugin.superstate.settings.inlineContextNameLayout = option;
          this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t.settings.hideFrontmatter.name)
      .setDesc(t.settings.hideFrontmatter.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.hideFrontmatter)
          .onChange(async (value) => {
            this.plugin.superstate.settings.hideFrontmatter = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.dataviewInlineContext.name)
      .setDesc(t.settings.dataviewInlineContext.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.dataviewInlineContext)
          .onChange((value) => {
            this.plugin.superstate.settings.dataviewInlineContext = value;
            this.plugin.saveSettings();
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineBacklinks.name)
      .setDesc(t.settings.inlineBacklinks.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineBacklinks)
          .onChange(async (value) => {
            this.plugin.superstate.settings.inlineBacklinks = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      containerEl.createEl("h3", { text: t.settings.sectionFlow });  
      new Setting(containerEl)
      .setName(t.settings.editorFlowReplace.name)
      .setDesc(t.settings.editorFlowReplace.desc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.superstate.settings.editorFlow).onChange((value) => {
          this.plugin.superstate.settings.editorFlow = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
      );
    new Setting(containerEl)
      .setName(t.settings.internalLinkFlowEditor.name)
      .setDesc(t.settings.internalLinkFlowEditor.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.internalLinkClickFlow)
          .onChange(async (value) => {
            this.plugin.superstate.settings.internalLinkClickFlow = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
   
      new Setting(containerEl)
      .setName(t.settings.internalLinkSticker.name)
      .setDesc(t.settings.internalLinkSticker.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.internalLinkSticker)
          .onChange(async (value) => {
            this.plugin.superstate.settings.internalLinkSticker = value;
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
          .setValue(this.plugin.superstate.settings.editorFlowStyle)
          .onChange(async (value) => {
            this.plugin.superstate.settings.editorFlowStyle = value;
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

    


    
      containerEl.createEl("h3", { text: t.settings.sectionFlowMenu });
      new Setting(containerEl)
      .setName(t.settings.editorMakeMenu.name)
      .setDesc(t.settings.editorMakeMenu.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.flowMenuEnabled)
          .onChange(async (value) => {
            this.plugin.superstate.settings.flowMenuEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.makeChar.name)
      .setDesc(t.settings.makeChar.desc)
      .addText((text) => {
        text
          .setValue(this.plugin.superstate.settings.menuTriggerChar)
          .onChange(async (value) => {
            if (value.length < 1) {
              text.setValue(this.plugin.superstate.settings.menuTriggerChar);
              return;
            }

            let char = value[0];

            if (value.length === 2) {
              char = value.replace(this.plugin.superstate.settings.menuTriggerChar, "");
            }

            text.setValue(char);

            this.plugin.superstate.settings.menuTriggerChar = char;

            await this.plugin.saveSettings();
          });
      });
      
    new Setting(containerEl)
      .setName(t.settings.editorMakePlacholder.name)
      .setDesc(t.settings.editorMakePlacholder.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.makeMenuPlaceholder)
          .onChange(async (value) => {
            this.plugin.superstate.settings.makeMenuPlaceholder = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      containerEl.createEl("h3", { text: t.settings.sectionFlowStyler });
    

    new Setting(containerEl)
      .setName(t.settings.inlineStyler.name)
      .setDesc(t.settings.inlineStyler.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineStyler)
          .onChange(async (value) => {
            this.plugin.superstate.settings.inlineStyler = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineStickerMenu.name)
      .setDesc(t.settings.inlineStickerMenu.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineStickerMenu)
          .onChange(async (value) => {
            this.plugin.superstate.settings.inlineStickerMenu = value;
            await this.plugin.saveSettings();
            this.plugin.reloadExtensions(false);
          })
      );
      new Setting(containerEl)
      .setName(t.settings.inlineStylerColor.name)
      .setDesc(t.settings.inlineStylerColor.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.inlineStylerColors)
          .onChange((value) => {
            this.plugin.superstate.settings.inlineStylerColors = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );
      new Setting(containerEl)
      .setName(t.settings.mobileMakeBar.name)
      .setDesc(t.settings.mobileMakeBar.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.superstate.settings.mobileMakeBar)
          .onChange((value) => {
            this.plugin.superstate.settings.mobileMakeBar = value;
            this.plugin.saveSettings();
            this.refreshView();
          })
      );
    }
    new Setting(containerEl)
    .setName(t.settings.experimental.name)
    .setDesc(t.settings.experimental.desc)
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.superstate.settings.experimental)
        .onChange((value) => {
          this.plugin.superstate.settings.experimental = value;
          this.plugin.saveSettings();
          this.refreshView();
        })
    );
    
  }
}
