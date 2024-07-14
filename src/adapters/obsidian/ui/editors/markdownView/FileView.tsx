import { Superstate } from "makemd-core";
import { App, ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { FileLinkViewComponent } from "./FileLinkViewComponent";
export const LINK_VIEW_TYPE = "mk-uri-view";
export const ICON = "sheets-in-box";

export class FileLinkView extends ItemView {
  app: App;
  path: string;
  navigation = true;
  root: Root;
  viewType: string;
  flow = false;
  constructor(
    leaf: WorkspaceLeaf,
    app: App,
    viewType: string,
    private superstate: Superstate
  ) {
    super(leaf);
    this.app = app;
    this.viewType = viewType;
  }

  getViewType(): string {
    return LINK_VIEW_TYPE;
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
    this.flow = state.flow;
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
    const state = super.getState();
    state.path = this.path;
    state.flow = this.flow;
    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructView(path: string) {
    this.destroy();
    this.root = this.superstate.ui.createRoot(this.contentEl);
    this.root.render(
      <div className="markdown-reading-view">
        <FileLinkViewComponent
          app={this.app}
          component={this}
          superstate={this.superstate}
          path={path}
          flow={this.flow}
        ></FileLinkViewComponent>
      </div>
    );
  }
}
