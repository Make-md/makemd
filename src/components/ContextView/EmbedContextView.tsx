import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { mdbContextByPath } from "utils/contexts/contexts";
import { contextDisplayName } from "utils/strings";
import MakeMDPlugin from "../../main";
import { EmbedContextViewComponent } from "./EmbedContextViewComponent";
export const EMBED_CONTEXT_VIEW_TYPE = "make-inline-context";
export const ICON = "sheets-in-box";

export class EmbedContextView extends ItemView {
  plugin: MakeMDPlugin;
  contextPath: string;
  ref?: string;
  navigation = true;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return EMBED_CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.contextPath;
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
    this.ref = state.ref ? state.ref.substring(1, state.ref.length) : null;
    this.constructInlineContext(this.contextPath);
    await super.setState(state, result);
    const context = mdbContextByPath(this.plugin, this.contextPath);
    const title = contextDisplayName(context);
    this.leaf.tabHeaderInnerTitleEl.innerText = title;
    //@ts-ignore
    this.leaf.view.titleEl = title;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = title;
    }

    return;
  }
  getState(): any {
    let state = super.getState();
    state.contextPath = this.contextPath;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructInlineContext(file: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div>
        <EmbedContextViewComponent
          plugin={this.plugin}
          path={this.contextPath}
          schema={this.ref}
        ></EmbedContextViewComponent>
      </div>
    );
  }
}
