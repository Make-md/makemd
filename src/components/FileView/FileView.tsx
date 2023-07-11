import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import MakeMDPlugin from "../../main";
import { FileLinkViewComponent } from "./FileLinkViewComponent";
export const FILE_VIEW_TYPE = "make-file-view";
export const ICON = "sheets-in-box";

export class FileLinkView extends ItemView {
  plugin: MakeMDPlugin;
  path: string;
  navigation = true;
  root: Root;
  viewType: string;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin, viewType: string) {
    super(leaf);
    this.plugin = plugin;
    this.viewType = viewType;
  }

  getViewType(): string {
    return FILE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.path;
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
    this.path = state.path;

    this.constructView(this.path);
    const displayName = this.path;
    await super.setState(state, result);

    this.leaf.tabHeaderInnerTitleEl.innerText = displayName;
    //@ts-ignore
    this.leaf.view.titleEl = displayName;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = displayName;
    }
    //@ts-ignore
    result.history = true;
    return;
  }
  getState(): any {
    let state = super.getState();
    state.path = this.path;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructView(path: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div className="markdown-reading-view">
        <FileLinkViewComponent
          path={path}
          plugin={this.plugin}
        ></FileLinkViewComponent>
      </div>
    );
  }
}
