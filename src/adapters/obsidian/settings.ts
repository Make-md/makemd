import { MakeBasicsSettingsTab } from "basics/ui/SettingsPanel";
import { App, PluginSettingTab, Setting } from "obsidian";
import t from "shared/i18n";
import MakeMDPlugin from "../../main";
import { MakeMDSettings } from "../../shared/types/settings";

type SettingObject = {
  name: keyof MakeMDSettings;
  category: string;
  subCategory?: string;
  type: string;
  props?: {
    control?: string;
    options?: {name: string, value: string}[],
    limits?: [number, number, number]
  };
  onChange?: (value: any) => void;
  dep?: string;
}

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

    const settings : {
      categories: string[],
      subCategories: Record<string, string[]>,
      settings: SettingObject[]
    } = {
      categories: ['general', 'navigator',  'space', 'notes', 'performance', 'advanced'],
      subCategories: {
        general: ['label', 'tags'],
        navigator: ['appearance', 'interaction', 'advanced'],
        label: ['appearance'],
        notes: ['appearance', 'folderNote'],
        space: ['appearance' , 'context'],
        performance: [],
        advanced: []
      },
      settings: [
        {
          name: 'navigatorEnabled',
          category: 'general',
          type: 'boolean',
          onChange: (value: boolean) => {
            
            if (value) {
              this.plugin.openFileTreeLeaf(true);
            } else {
              this.plugin.detachFileTreeLeafs();
              this.refreshObsidian();
            }
          }
        },
        
        {
          name: 'spacesStickers',
          category: 'general',
          subCategory: 'label',
          type: 'boolean',
          
        },
        {
          name: 'indexSVG',
          category: 'general',
            subCategory: 'label',
          type: 'boolean',
        },
      {
        name: 'enableDefaultSpaces',
        category: 'general',
        subCategory: 'tags',
        type: 'boolean',
        
      },
      {
        name: 'spaceViewEnabled',
        category: 'general',
        type: 'boolean',
        
      },
      {
        name: 'basics',
        category: 'notes',
        type: 'boolean',
      },
      { name: 'sidebarTabs',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'boolean',
        onChange: (value: boolean) => {
          document.body.classList.toggle("mk-hide-tabs", !value);
        }
      },
      { name: 'vaultSelector',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'boolean',
        onChange: (value: boolean) => {
          document.body.classList.toggle("mk-hide-vault-selector", !value);
        }
      },
      {
        name: 'showRibbon',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'boolean',
        onChange: (value: boolean) => {
          document.body.classList.toggle("mk-hide-ribbon", !value);
        }
      },
      {
        name: 'spacesUseAlias',
        category: 'general',
          subCategory: 'label',
        type: 'boolean',
        
      },
      {
        name: 'openSpacesOnLaunch',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
        
      },
      {
        name: 'editStickerInSidebar',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
      },
      {
        name: 'overrideNativeMenu',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
      },
      {
        name: 'spacesRightSplit',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'boolean',
      },
      {
        name: 'spaceRowHeight',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'number',
        props: {
          control: 'slider',
          limits: [20, 40, 1]
        }
      },
      {
        name: 'folderIndentationLines',
        category: 'navigator',
        subCategory: 'appearance',
        type: 'boolean',
        onChange: (value: boolean) => {
          document.body.classList.toggle("mk-folder-lines", value);
        }
      },
      {
        
        name: 'expandFolderOnClick',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
      },
      {
        name: 'filePreviewOnHover',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
      },
      {
        name: 'revealActiveFile',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean', 
      },
      {
        name: 'deleteFileOption',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'options',
        props: {
          options: [
            { name: t.settings.spacesDeleteOptions.permanant, value: 'permanent' },
            { name: t.settings.spacesDeleteOptions.trash, value: 'trash' },
            { name: t.settings.spacesDeleteOptions["system-trash"], value: 'system-trash' }
          ]
        }
      },
      {
        name: 'spacesDisablePatch',
        category: 'navigator',
        subCategory: 'advanced',
        type: 'boolean',
      },
      {
        name: 'enableFolderNote',
        category: 'notes',
        subCategory: 'folderNote',
        type: 'boolean',
      },
      {
        name: 'folderNoteName',
        category: 'notes',
        subCategory: 'folderNote',
        type: 'text',
      },
      {
        name: 'newNotePlaceholder',
        category: 'notes',
        type: 'text',
      },
      {
        name: 'autoAddContextsToSubtags',
        category: 'general',
        subCategory: 'tags',
        type: 'boolean',
      },
      {
        name: 'notesPreview',
        category: 'notes',
        type: 'boolean',
      },
      
      {
        name: 'spacesPerformance',
        category: 'performance',
        type: 'boolean',
      },
      
      {
        name: 'banners',
        category: 'general',
          subCategory: 'label',
        type: 'boolean',
      },
      {
        name: 'bannerHeight',
        category: 'general',
          subCategory: 'label',
        type: 'number',
        
      },
      {
        name: 'defaultSpaceTemplate',
        category: 'space',
        subCategory: 'appearance',
        type: 'text',
      },
      {
        name: 'contextEnabled',
        category: 'space',
        subCategory: 'context',
        type: 'boolean',
      },
      {
        name: 'contextPagination',
        category: 'space',
        subCategory: 'context',
        type: 'number',
      },
      {
        name: 'defaultDateFormat',
        category: 'advanced',
        type: 'text',
      },
      {
        name: 'datePickerTime',
        category: 'advanced',
        type: 'boolean',
      },
      {
        name: 'defaultTimeFormat',
        category: 'advanced',
        type: 'text',
      },
      {
        name: 'autoOpenFileContext',
        category: 'space',
        subCategory: 'context',
        type: 'boolean',
      },
      {
        name: 'saveAllContextToFrontmatter',
        category: 'space',
        subCategory: 'context',
        type: 'boolean',
      },
      {
        name: 'syncFormulaToFrontmatter',
        category: 'space',
        subCategory: 'context',
        type: 'boolean',
      },
      {
        name: 'blinkEnabled',
        category: 'navigator',
        subCategory: 'interaction',
        type: 'boolean',
      },
      {
        name: 'inlineContext',
        category: 'notes',
        type: 'boolean',
      },
      
      {
        name: 'inlineContextProperties',
        category: 'notes',
        subCategory: 'appearance',
        type: 'boolean',
      },
      {
        name: 'inlineContextExpanded',
        category: 'notes',
        subCategory: 'appearance',
        type: 'boolean',
      },
      {
        name: 'inlineContextNameLayout',
        category: 'notes',
        subCategory: 'appearance',
        type: 'options',
        props: {
          options: [
            { name: t.settings.layoutVertical, value: 'vertical' },
            { name: t.settings.layoutHorizontal, value: 'horizontal' }
          ]
        }
      },
      {
        name: 'hideFrontmatter',
        category: 'space',
        subCategory: 'context',
        type: 'boolean',
      },
      
      {
        name: 'noteThumbnails',
        category: 'notes',
        type: 'boolean',
      },
      {
        name: 'imageThumbnails',
        category: 'performance',
        type: 'boolean',
      },
      
      {
        name: 'cacheIndex',
        category: 'performance',
        type: 'boolean',
      },
      {
        name: 'experimental',
        category: 'advanced',
        type: 'boolean',
      },
      {
        name: 'spaceSubFolder',
        category: 'advanced',
        type: 'text',
      },
      {
        name: 'spacesFolder',
        category: 'advanced',
        type: 'text',
      }
      
    ]
      }
      
    containerEl.innerHTML = "";
    const sectionKeys = t.settings.sections as unknown as Record<string, string>;
    const insertSetting = (containerEl: HTMLElement, setting: SettingObject) => {
      const localizationKeys = t.settings as unknown as Record<keyof MakeMDSettings, {
        name: string;
        desc: string;
      }>;
      
      const newSetting = new Setting(containerEl)
      .setName(localizationKeys[setting.name].name)
      .setDesc(localizationKeys[setting.name].desc);
      if (setting.type === 'boolean') {
      newSetting.addToggle((toggle) =>
          toggle
            .setValue(this.plugin.superstate.settings[setting.name] as boolean)
            .onChange(
              (value: boolean) => {
                Object.assign(this.plugin.superstate.settings, { [setting.name]: value });
                this.plugin.saveSettings();
                if(setting.onChange) setting.onChange(value);
              }
            )
        );
      }
      
      if (setting.type == 'number') {
        if (setting.props?.control === 'slider') {
          newSetting
          .addSlider((slider) =>
            slider
              .setValue(this.plugin.superstate.settings[setting.name] as number)
              .setDynamicTooltip()
              .setLimits(20, 40, 1)
              .onChange((value: number) => {
                Object.assign(this.plugin.superstate.settings, { [setting.name]: value });
                this.plugin.saveSettings();
                if(setting.onChange) setting.onChange(value);
              })
          );
        } else {
          newSetting
        .addText((text) =>
          text
            .setValue(this.plugin.superstate.settings[setting.name].toString())
            .onChange((value: string) => {
              Object.assign(this.plugin.superstate.settings, { [setting.name]: parseInt(value) });
              this.plugin.saveSettings();
              if(setting.onChange) setting.onChange(parseInt(value));
            })
        );
      }
      }
      if (setting.type == 'text') {
        
        newSetting.addText((text) =>
          text
            .setValue(this.plugin.superstate.settings[setting.name] as string)
            .onChange((value: string) => {
              Object.assign(this.plugin.superstate.settings, { [setting.name]: value });
              this.plugin.saveSettings();
              if(setting.onChange) setting.onChange(value);
            })
        );
      }
      if (setting.type == 'options') {
        newSetting
        .addDropdown((dropdown) => {
          setting.props.options?.forEach(option => {
            dropdown.addOption(option.value, option.name);
          });
          dropdown.setValue(this.plugin.superstate.settings[setting.name] as string);
          dropdown.onChange((value: string) => {
            Object.assign(this.plugin.superstate.settings, { [setting.name]: value });
              this.plugin.saveSettings();
          if(setting.onChange) setting.onChange(value);
          });
          
        });
    }
  }

    settings.categories.forEach((category) => {
      containerEl.createEl("h1", { text: sectionKeys[category] });
      settings.settings.forEach((setting) => {
        if (setting.category === category && !setting.subCategory) {
          insertSetting(containerEl, setting);
        }
      });
      settings.subCategories[category].forEach((subCategory) => {
        const subCategoryItems = settings.settings.filter((setting) => setting.category === category && setting.subCategory === subCategory);
        if (subCategoryItems.length > 0) {
          containerEl.createEl("h2", { text: sectionKeys[subCategory] });
        }
        subCategoryItems.forEach((setting) => {
            insertSetting(containerEl, setting);
        });
      });
    });

    if (this.plugin.superstate.settings.basics) {
      containerEl.createEl("h1", { text: "Basics Settings" });
    const basicsSettings = new MakeBasicsSettingsTab(this.app, this.plugin.basics);
    basicsSettings.display(containerEl);
    }

  }
  }
