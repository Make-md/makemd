import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ContextInfo } from "types/contextInfo";
import { mdbContextByPath } from "utils/contexts/contexts";
import { contextDisplayName } from "utils/strings";
import MakeMDPlugin from "../../main";
import { ContextViewComponent } from "./ContextViewComponent";
export const CONTEXT_VIEW_TYPE = "make-folder-view";
export const ICON = "sheets-in-box";

export class ContextView extends ItemView {
  plugin: MakeMDPlugin;
  context: ContextInfo;
  contextPath: string;
  navigation = true;
  root: Root;
  viewType: string;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin, viewType: string) {
    super(leaf);
    this.plugin = plugin;
    this.viewType = viewType;
  }

  getViewType(): string {
    return CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return contextDisplayName(this.context);
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
    this.contextPath = state.contextPath;
    this.context = mdbContextByPath(this.plugin, this.contextPath);
    if (!this.context) return;
    this.constructContext(this.context);
    const displayName = contextDisplayName(this.context);
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
    state.contextPath = this.contextPath;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructContext(context: ContextInfo) {
    this.destroy();

    this.root = createRoot(this.contentEl);
    this.root.render(
      <div className="mk-folder-view">
        <ContextViewComponent
          context={context}
          plugin={this.plugin}
        ></ContextViewComponent>
      </div>
    );
  }
}
