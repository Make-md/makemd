import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { getAbstractFileAtPath, viewTypeByString } from "utils/file";
import MakeMDPlugin from "../../main";
import { InlineContextViewComponent } from "./InlineContextViewComponent";
export const INLINE_CONTEXT_VIEW_TYPE = "make-inline-context";
export const ICON = "sheets-in-box";

export class InlineContextView extends ItemView {
  plugin: MakeMDPlugin;
  file: string;
  ref?: string;
  navigation = true;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return INLINE_CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file;
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
    this.file = state.file;
    this.ref = state.ref ? state.ref.substring(1, state.ref.length) : null;
    this.constructInlineContext(this.file);
    await super.setState(state, result);
    const type = viewTypeByString(this.file);
    const title =
      type == "tag"
        ? this.file
        : getAbstractFileAtPath(app, this.file)?.name ?? this.file;
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
    state.file = this.file;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructInlineContext(file: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div>
        <InlineContextViewComponent
          plugin={this.plugin}
          path={this.file}
          schema={this.ref}
        ></InlineContextViewComponent>
      </div>
    );
  }
}
