import { ItemView, TFolder, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import React, { cloneElement, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createRoot, Root } from 'react-dom/client'
import MakeMDPlugin from '../../main';
export const FOLDER_VIEW_TYPE = 'make-folder-view';
export const ICON = 'sheets-in-box';
import { FolderComponent } from './FlowComponent';


export class FlowView extends ItemView {
    plugin: MakeMDPlugin;
    currentFolderPath: string;
    navigation = true;
    folder: TFolder;
    root: Root;

    constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return FOLDER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.folder?.name;
    }

 

    async onClose() {
        this.destroy();
    }

    destroy() {
        if (this.root)
        this.root.unmount();
    }

    async onOpen(): Promise<void> {
        this.destroy();
    }

    async setState(state: any, result: ViewStateResult): Promise<void> {

        const folder = this.plugin.app.vault.getAbstractFileByPath(state.folder) as TFolder;

        this.folder = folder;
        
        this.constructFileTree(folder);
        await super.setState(state, result);

        this.leaf.tabHeaderInnerTitleEl.innerText = folder.name;
        //@ts-ignore
        this.leaf.view.titleEl = folder.name;
        const headerEl = this.leaf.view.headerEl;
        if (headerEl) {
            //@ts-ignore
            headerEl.querySelector('.view-header-title').innerText = folder.name
        }

        return;
    }
    getState(): any {
        let state = super.getState();
        state.folder = this.folder?.path;
        // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file 

        return state;
    }
    
    constructFileTree(folder: TFolder) {
        this.destroy();
        this.root = createRoot(this.contentEl);
        this.root.render(
            <div className="mk-folder-view">
                <FolderComponent folder={folder} plugin={this.plugin}></FolderComponent>
            </div>
        );
    }
}
