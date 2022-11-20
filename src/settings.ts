import MakeMDPlugin from './main';
import { PluginSettingTab, Setting, App, DropdownComponent } from 'obsidian';
import { eventTypes, SectionTree, StringTree } from 'types/types';
import t from 'i18n'
export type DeleteFileOption = 'trash' | 'permanent' | 'system-trash';

export interface MakeMDPluginSettings {
    filePreviewOnHover: boolean;
    markSans: boolean;
    makeMenuPlaceholder: boolean;
    inlineStyler: boolean;
    mobileMakeBar: boolean;
    inlineStylerColors: boolean;
    editorFlow: boolean;
    editorFlowStyle: string;
    spacesEnabled: boolean;
    spacesPerformance: boolean;
    spacesStickers: boolean;
    sidebarRibbon: boolean;
    sidebarTabs: boolean;
    deleteFileOption: DeleteFileOption;
    folderRank: StringTree;
    openFolders: string[];
    fileIcons: [string, string][];
    spaces: SectionTree[];
    vaultCollapsed: boolean;
    menuTriggerChar: string;
    emojiTriggerChar: string;
}

export const DEFAULT_SETTINGS: MakeMDPluginSettings = {
    
    filePreviewOnHover: false,
    markSans: true,
    makeMenuPlaceholder: true,
    mobileMakeBar: true,
    inlineStyler: true,
    inlineStylerColors: false,
    editorFlow: true,
    editorFlowStyle: 'seamless',
    spacesEnabled: true,
    spacesPerformance: false,
    spacesStickers: true,
    sidebarRibbon: false,
    sidebarTabs: false,
    deleteFileOption: 'trash',
    folderRank: {
        node: 'root',
        children: [],
        isFolder: true,
    },
    openFolders: [],
    fileIcons: [],
    spaces: [],
    vaultCollapsed: false,
    menuTriggerChar: '/',
    emojiTriggerChar: ':'
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

        containerEl.createEl('h2', { text: t.settings.sectionSidebar });
        new Setting(containerEl)
            .setName(t.settings.spaces.name)
            .setDesc(t.settings.spaces.desc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.spacesEnabled).onChange((value) => {
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
                        toggle.setValue(this.plugin.settings.spacesStickers).onChange((value) => {
                            this.plugin.settings.spacesStickers = value;
                            this.plugin.saveSettings();
                            this.refreshView();
                        })
                    );
                    new Setting(containerEl)
                    .setName(t.settings.sidebarRibbon.name)
                    .setDesc(t.settings.sidebarRibbon.desc)
                    .addToggle((toggle) =>
                        toggle.setValue(this.plugin.settings.sidebarRibbon).onChange((value) => {
                            this.plugin.settings.sidebarRibbon = value;
                            this.plugin.saveSettings();
                            document.body.classList.toggle('mk-hide-ribbon', !value);
                        })
                    );
                    new Setting(containerEl)
                    .setName(t.settings.sidebarTabs.name)
                    .setDesc(t.settings.sidebarTabs.desc)
                    .addToggle((toggle) =>
                        toggle.setValue(this.plugin.settings.sidebarTabs).onChange((value) => {
                            this.plugin.settings.sidebarTabs = value;
                            this.plugin.saveSettings();
                            document.body.classList.toggle('mk-hide-tabs', !value);
                        })
                    );
                    new Setting(containerEl)
                    .setName(t.settings.spacesPerformance.name)
                    .setDesc(t.settings.spacesPerformance.desc)
                    .addToggle((toggle) =>
                        toggle.setValue(this.plugin.settings.spacesPerformance).onChange((value) => {
                            this.plugin.settings.spacesPerformance = value;
                            this.plugin.saveSettings();
                        })
                    );
            
                    new Setting(containerEl)
            .setName(t.settings.spacesDeleteOption.name)
            .setDesc(t.settings.spacesDeleteOption.desc)
            .addDropdown((dropdown) => {
                dropdown.addOption('permanent', t.settings.spacesDeleteOptions.permanant);
                dropdown.addOption('trash', t.settings.spacesDeleteOptions.trash);
                dropdown.addOption('system-trash', t.settings.spacesDeleteOptions['system-trash']);
                dropdown.setValue(this.plugin.settings.deleteFileOption);
                dropdown.onChange((option: DeleteFileOption) => {
                    this.plugin.settings.deleteFileOption = option;
                    this.plugin.saveSettings();
                });
            });

                    containerEl.createEl('h2', { text: t.settings.sectionFlow });

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
                    dropdown
                    .setValue(this.plugin.settings.editorFlowStyle)
                    .onChange(async (value) => {
                        this.plugin.settings.editorFlowStyle = value;
                        document.body.classList.toggle('mk-flow-classic', false);
                        document.body.classList.toggle('mk-flow-seamless', false);
                        if (value == 'seamless') 
                            document.body.classList.toggle('mk-flow-seamless', true);
                        if (value == 'classic') 
                            document.body.classList.toggle('mk-flow-classic', true);
                    });
                });

                    containerEl.createEl('h2', { text: t.settings.sectionEditor });
            
                    new Setting(containerEl)
            .setName(t.settings.makeChar.name)
            .setDesc(t.settings.makeChar.desc)
            .addText(text => {
                text.setValue(this.plugin.settings.menuTriggerChar).onChange(
                    async value => {
                        if (value.trim().length < 1) {
                            text.setValue(this.plugin.settings.menuTriggerChar)
                            return
                        }

                        let char = value[0]

                        if (value.trim().length === 2) {
                            char = value.replace(
                                this.plugin.settings.menuTriggerChar,
                                ""
                            )
                        }

                        text.setValue(char)

                        this.plugin.settings.menuTriggerChar = char

                        await this.plugin.saveSettings()
                    }
                )
            })

            
            new Setting(containerEl)
            .setName(t.settings.editorMakePlacholder.name)
            .setDesc(t.settings.editorMakePlacholder.desc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.makeMenuPlaceholder).onChange((value) => {
                    this.plugin.settings.makeMenuPlaceholder = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

            new Setting(containerEl)
            .setName(t.settings.mobileMakeBar.name)
            .setDesc(t.settings.mobileMakeBar.desc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mobileMakeBar).onChange((value) => {
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
            new Setting(containerEl)
            .setName(t.settings.inlineStylerColor.name)
            .setDesc(t.settings.inlineStylerColor.desc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.inlineStylerColors).onChange((value) => {
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
