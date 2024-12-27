import MakeBasicsPlugin from "basics/basics";
import { App, DropdownComponent, Setting } from "obsidian";
import t from "shared/i18n";

export class MakeBasicsSettingsTab {
    plugin: MakeBasicsPlugin;
  app: App;
    constructor(app: App, plugin: MakeBasicsPlugin) {
        this.app = app;
      this.plugin = plugin;
    }
  
    refreshObsidian() {
      this.app.commands.executeCommandById("app:reload")
    }
  
    refreshView() {

    }
  
    display(containerEl: HTMLElement): void {
    //   containerEl.innerHTML = "";
  
      
  
  
    
  
      
      
        new Setting(containerEl)
        .setName(t.settings.dataviewInlineContext.name)
        .setDesc(t.settings.dataviewInlineContext.desc)
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.dataviewInlineContext)
            .onChange((value) => {
              this.plugin.settings.dataviewInlineContext = value;
              this.plugin.enactor.saveSettings();
            })
        );
        
        containerEl.createEl("h3", { text: t.settings.sectionFlow });  
        new Setting(containerEl)
        .setName(t.settings.editorFlowReplace.name)
        .setDesc(t.settings.editorFlowReplace.desc)
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.editorFlow).onChange((value) => {
            this.plugin.settings.editorFlow = value;
            this.plugin.enactor.saveSettings();
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
              await this.plugin.enactor.saveSettings();
              this.plugin.reloadExtensions(false);
            })
        );
     
        new Setting(containerEl)
        .setName(t.settings.internalLinkSticker.name)
        .setDesc(t.settings.internalLinkSticker.desc)
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.internalLinkSticker)
            .onChange(async (value) => {
              this.plugin.settings.internalLinkSticker = value;
              await this.plugin.enactor.saveSettings();
              this.plugin.reloadExtensions(false);
            })
        );
     
      new Setting(containerEl)
        .setName(t.settings.editorFlowStyle.name)
        .setDesc(t.settings.editorFlowStyle.desc)
        .addDropdown((dropdown: DropdownComponent) => {
          dropdown.addOption("seamless", t.settings.editorFlowStyle.seamless);
          dropdown.addOption("minimal", t.settings.editorFlowStyle.minimal);
          dropdown
            .setValue(this.plugin.settings.editorFlowStyle)
            .onChange(async (value) => {
              this.plugin.settings.editorFlowStyle = value;
              document.body.classList.toggle("mk-flow-minimal", false);
              document.body.classList.toggle("mk-flow-seamless", false);
  
              if (value == "seamless")
                document.body.classList.toggle("mk-flow-seamless", true);
              if (value == "classic")
                document.body.classList.toggle("mk-flow-minimal", true);
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
            .setValue(this.plugin.settings.flowMenuEnabled)
            .onChange(async (value) => {
              this.plugin.settings.flowMenuEnabled = value;
              await this.plugin.enactor.saveSettings();
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
              if (value.length < 1) {
                text.setValue(this.plugin.settings.menuTriggerChar);
                return;
              }
  
              let char = value[0];
  
              if (value.length === 2) {
                char = value.replace(this.plugin.settings.menuTriggerChar, "");
              }
  
              text.setValue(char);
  
              this.plugin.settings.menuTriggerChar = char;
  
              await this.plugin.enactor.saveSettings();
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
              await this.plugin.enactor.saveSettings();
              this.plugin.reloadExtensions(false);
            })
        );
        containerEl.createEl("h3", { text: t.settings.sectionFlowStyler });
      
  
      new Setting(containerEl)
        .setName(t.settings.inlineStyler.name)
        .setDesc(t.settings.inlineStyler.desc)
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.inlineStyler)
            .onChange(async (value) => {
              this.plugin.settings.inlineStyler = value;
              await this.plugin.enactor.saveSettings();
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
              await this.plugin.enactor.saveSettings();
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
              this.plugin.enactor.saveSettings();
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
              this.plugin.enactor.saveSettings();
              this.refreshView();
            })
        );
      
  
      
    }
  }
  