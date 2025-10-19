import MakeBasicsPlugin from "basics/basics";
import { App, DropdownComponent, Setting } from "obsidian";
import i18n from "shared/i18n";

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
  
      
  
  
    
  
      
      
        
        
        containerEl.createEl("h3", { text: i18n.settings.sectionFlow || "Flow" });  
        new Setting(containerEl)
        .setName(i18n.settings.editorFlowReplace?.name || "Flow Block")
        .setDesc(i18n.settings.editorFlowReplace?.desc || "Open your internal links or toggle your embeds in the flow block.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.editorFlow).onChange((value) => {
            this.plugin.settings.editorFlow = value;
            this.plugin.enactor.saveSettings();
            this.refreshView();
          })
        );
      new Setting(containerEl)
        .setName(i18n.settings.internalLinkFlowEditor?.name || "Open Links in Flow")
        .setDesc(i18n.settings.internalLinkFlowEditor?.desc || "Open internal links in flow block")
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
        .setName(i18n.settings.internalLinkSticker?.name || "Internal Link Sticker")
        .setDesc(i18n.settings.internalLinkSticker?.desc || "Show stickers for internal links")
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
        .setName(i18n.settings.editorFlowStyle?.name || "Flow Block Style")
        .setDesc(i18n.settings.editorFlowStyle?.desc || "Select a theme for your flow block")
        .addDropdown((dropdown: DropdownComponent) => {
          dropdown.addOption("seamless", i18n.settings.editorFlowStyle?.seamless || "Seamless");
          dropdown.addOption("minimal", i18n.settings.editorFlowStyle?.minimal || "Minimal");
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
  
      
  
  
      
        containerEl.createEl("h3", { text: i18n.settings.sectionFlowMenu || "Flow Menu" });
        new Setting(containerEl)
        .setName(i18n.settings.editorMakeMenu?.name || "Flow Menu")
        .setDesc(i18n.settings.editorMakeMenu?.desc || "Open the Flow menu to quickly add content")
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
        .setName(i18n.settings.makeChar?.name || "Menu Trigger Character")
        .setDesc(i18n.settings.makeChar?.desc || "Character to trigger the flow menu")
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
        .setName(i18n.settings.editorMakePlaceholder?.name || "Menu Placeholder")
        .setDesc(i18n.settings.editorMakePlaceholder?.desc || "Show placeholder text for menu")
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.makeMenuPlaceholder)
            .onChange(async (value) => {
              this.plugin.settings.makeMenuPlaceholder = value;
              await this.plugin.enactor.saveSettings();
              this.plugin.reloadExtensions(false);
            })
        );
        containerEl.createEl("h3", { text: i18n.settings.sectionFlowStyler || "Flow Styler" });
      
  
      new Setting(containerEl)
        .setName(i18n.settings.inlineStyler?.name || "Inline Styler")
        .setDesc(i18n.settings.inlineStyler?.desc || "Enable inline styling options")
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
        .setName(i18n.settings.inlineStickerMenu?.name || "Inline Sticker Menu")
        .setDesc(i18n.settings.inlineStickerMenu?.desc || "Show sticker menu for inline content")
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
        .setName(i18n.settings.inlineStylerColor?.name || "Inline Styler Colors")
        .setDesc(i18n.settings.inlineStylerColor?.desc || "Enable color options in inline styler")
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
        .setName(i18n.settings.mobileMakeBar?.name || "Mobile Make Bar")
        .setDesc(i18n.settings.mobileMakeBar?.desc || "Show make bar on mobile devices")
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
  