import { ItemView, TFolder, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { getAbstractFileAtPath } from "utils/file";
import MakeMDPlugin from "../../main";
import { FolderContextViewComponent } from "./FolderContextViewComponent";
import { TagContextViewComponent } from "./TagContextViewComponent";
export const CONTEXT_VIEW_TYPE = "make-folder-view";
export const ICON = "sheets-in-box";

export class ContextView extends ItemView {
  plugin: MakeMDPlugin;
  currentFolderPath: string;
  navigation = true;
  folder: TFolder;
  tag: string;
  type: "folder" | "tag";
  root: Root;
  viewType: string;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin, viewType: string) {
    super(leaf);
    this.plugin = plugin;
    this.viewType = viewType;
  }

  getViewType(): string {
    return this.viewType;
  }

  getDisplayText(): string {
    if (this.type == "tag") {
      return this.tag;
    }
    return this.folder?.name;
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.type = state.type;
    if (state.type == "folder") {
      const folder = getAbstractFileAtPath(
        this.plugin.app,
        state.folder
      ) as TFolder;

      if (!folder) {
        return;
      }
      this.folder = folder;

      this.constructFolderContext(folder);
      await super.setState(state, result);

      this.leaf.tabHeaderInnerTitleEl.innerText = folder.name;
      //@ts-ignore
      this.leaf.view.titleEl = folder.name;
      const headerEl = this.leaf.view.headerEl;
      if (headerEl) {
        //@ts-ignore
        headerEl.querySelector(".view-header-title").innerText = folder.name;
      }
    } else if (state.type == "tag") {
      this.tag = state.tag;

      this.constructTagContext(this.tag);
      await super.setState(state, result);

      this.leaf.tabHeaderInnerTitleEl.innerText = this.tag;
      //@ts-ignore
      this.leaf.view.titleEl = this.tag;
      const headerEl = this.leaf.view.headerEl;
      if (headerEl) {
        //@ts-ignore
        headerEl.querySelector(".view-header-title").innerText = this.tag;
      }
    }
    //@ts-ignore
    result.history = true;
    return;
  }
  getState(): any {
    let state = super.getState();
    state.type = this.type;
    if (state.type == "folder") {
      state.folder = this.folder?.path;
    } else {
      state.tag = this.tag;
    }

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructTagContext(tag: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div className="mk-folder-view">
        <TagContextViewComponent
          type="tag"
          tag={this.tag}
          plugin={this.plugin}
        ></TagContextViewComponent>
      </div>
    );
  }

  constructFolderContext(folder: TFolder) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div className="mk-folder-view">
        {folder && (
          <FolderContextViewComponent
            type="folder"
            folder={folder}
            plugin={this.plugin}
          ></FolderContextViewComponent>
        )}
      </div>
    );
  }
}
