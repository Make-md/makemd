import { FileExplorerPlugin, Plugin, addIcon, TAbstractFile, MarkdownView, WorkspaceLeaf, Menu, EphemeralState, ViewState, WorkspaceItem, WorkspaceContainer, Workspace, App, Plugin_2 } from 'obsidian';
import { FILE_TREE_VIEW_TYPE, FileTreeView, ICON, SETS_VIEW_TYPE } from './components/Spaces/FileTreeView';
import { MakeMDPluginSettings as MakeMDPluginSettings, MakeMDPluginSettingsTab, DEFAULT_SETTINGS } from './settings';
import {  eventTypes, FocusPortalEvent, OpenFilePortalEvent, SpawnPortalEvent, VaultChange } from 'types/types';
import MakeMenu from 'components/MakeMenu/MakeMenu';
import StickerMenu from 'components/StickerMenu/StickerMenu';
import { FlowView, FOLDER_VIEW_TYPE } from 'components/FlowView/FlowView';
import { FlowEditor } from 'components/FlowEditor/FlowEditor';
import { around } from "monkey-around";
import { EditorView } from '@codemirror/view'
import 'css/makerMode.css'
import { cmExtensions } from 'cm-extensions/cmExtensions';
import { focusPortal, loadFlowEditorsForLeaf, openFileFromPortal, spawnNewPortal } from 'utils/flowEditor';
import { replaceAllEmbed } from 'utils/markdownPost';
import { toggleMark } from 'cm-extensions/inlineStylerView/marks';
import { platformIsMobile } from 'utils/utils';
import { replaceMobileMainMenu } from 'components/Spaces/MainMenu';
import { loadStylerIntoContainer } from 'cm-extensions/inlineStylerView/InlineMenu';
import { patchFileExplorer, patchWorkspace } from 'utils/patches';
import { platform } from 'os';
import { getActiveCM } from 'utils/codemirror';
import { mkLogo } from 'utils/icons';
export default class MakeMDPlugin extends Plugin {
    settings: MakeMDPluginSettings;
    activeEditorView?: MarkdownView;
    flowEditors: FlowEditor[];
      
      toggleBold () {
        const cm = getActiveCM();
        if (cm) {
          cm.dispatch({
            annotations: toggleMark.of('strong')
          })
        }
      }
      toggleEm () {
        const cm = getActiveCM();
        if (cm) {
          cm.dispatch({
            annotations: toggleMark.of('em')
          })
        }
      }
      
      loadSpaces () {
        patchWorkspace(this);
        document.body.classList.toggle('mk-hide-ribbon', !this.settings.sidebarRibbon);    
        document.body.classList.toggle('mk-hide-ribbon', !this.settings.sidebarRibbon);
            document.body.classList.toggle('mk-hide-tabs', !this.settings.sidebarTabs);
            this.registerView(FOLDER_VIEW_TYPE, (leaf) => {
              return new FlowView(leaf, this);
          });
          if (this.settings.spacesEnabled) {
            patchFileExplorer(this);
            this.registerView(FILE_TREE_VIEW_TYPE, (leaf) => {
              return new FileTreeView(leaf, this);
          });
            this.app.workspace.onLayoutReady(async () => {
                await this.openFileTreeLeaf(true);
            });
          }

          this.app.vault.on('create', this.onCreate);
        this.app.vault.on('delete', this.onDelete);
        this.app.vault.on('rename', this.onRename);
      }

      loadFlowEditor () {
        document.body.classList.toggle('mk-flow-replace', this.settings.editorFlow);
        document.body.classList.toggle('mk-flow-'+this.settings.editorFlowStyle, true);
        if (this.settings.editorFlow) {
          this.registerMarkdownPostProcessor((element, context) => {
            const removeAllFlowMarks = (el: HTMLElement) => {
              const embeds = el.querySelectorAll(".internal-embed");

              for (let index = 0; index < embeds.length; index++) {
                const embed = embeds.item(index);
                if (embed.previousSibling && embed.previousSibling.textContent.slice(-1) == '!')
                  embed.previousSibling.textContent = embed.previousSibling.textContent.slice(0, -1)
              }
            }
            removeAllFlowMarks(element);
            replaceAllEmbed(element, context);
          })
            
          
          window.addEventListener(eventTypes.spawnPortal, this.spawnPortal);
          window.addEventListener(eventTypes.focusPortal, this.focusPortal);
          window.addEventListener(eventTypes.openFilePortal, this.openFileFromPortal);
        }
      }

      loadMakerMode () {
        document.body.classList.toggle('mk-mark-sans', this.settings.markSans);
        this.addCommand({
          id: 'mk-toggle-bold',
          name: 'Toggle Bold',
          callback: () => this.toggleBold(),
          hotkeys: [
            {
              modifiers: ['Mod'],
              key: 'b',
            },
          ],
        });
    
        this.addCommand({
          id: 'mk-toggle-italics',
          name: 'Toggle Italics',
          callback: () => this.toggleEm(),
          hotkeys: [
            {
              modifiers: ['Mod', 'Shift'],
              key: 'i',
            },
          ],
        });
        this.registerEditorSuggest(new MakeMenu(this.app, this))
          this.registerEditorSuggest(new StickerMenu(this.app, this))
        if (platformIsMobile() && this.settings.mobileMakeBar)
          loadStylerIntoContainer(app.mobileToolbar.containerEl);
      }
    async onload() {
      window.make = this;
      addIcon('mk-logo', mkLogo)
        console.log('Loading Make.md');
        // Load Settings
        this.addSettingTab(new MakeMDPluginSettingsTab(this.app, this));
        await this.loadSettings();
        this.loadSpaces();
        this.loadFlowEditor();
        this.loadMakerMode();    
        this.registerEditorExtension(cmExtensions(this, platformIsMobile()));
    }

    //Flow Editor Listeners
    openFileFromPortal (e: OpenFilePortalEvent) {
      openFileFromPortal(this, e)
    }
    spawnPortal (e: SpawnPortalEvent) {
      spawnNewPortal(this, e);
    }
    focusPortal (e: FocusPortalEvent) {
      focusPortal(this, e);
    }

    //Spaces Listeners
    triggerVaultChangeEvent = (file: TAbstractFile, changeType: VaultChange, oldPath?: string) => {
      let event = new CustomEvent(eventTypes.vaultChange, {
          detail: {
              file: file,
              changeType: changeType,
              oldPath: oldPath ? oldPath : '',
          },
      });
      window.dispatchEvent(event);
  };
  onCreate = (file: TAbstractFile) => this.triggerVaultChangeEvent(file, 'create', '');
  onDelete = (file: TAbstractFile) => this.triggerVaultChangeEvent(file, 'delete', '');
  onRename = (file: TAbstractFile, oldPath: string) => this.triggerVaultChangeEvent(file, 'rename', oldPath);

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
        if ((leaf.view as FileTreeView).destroy)
          (leaf.view as FileTreeView).destroy();
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

    async saveSettings(refresh=true) {
        await this.saveData(this.settings);
        if(refresh) {
        let evt = new CustomEvent(eventTypes.settingsChanged, {});
        window.dispatchEvent(evt);
        }
    }

   

    onunload() {
      console.log('Unloading Make.md');
      window.removeEventListener(eventTypes.spawnPortal, this.spawnPortal)
      window.removeEventListener(eventTypes.focusPortal, this.focusPortal)
      window.removeEventListener(eventTypes.openFilePortal, this.openFileFromPortal)
      this.detachFileTreeLeafs();
      // Remove event listeners
      this.app.vault.off('create', this.onCreate);
      this.app.vault.off('delete', this.onDelete);
      this.app.vault.off('rename', this.onRename);
  }
}
