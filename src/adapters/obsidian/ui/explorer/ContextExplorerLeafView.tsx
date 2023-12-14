import { FileContextView, Superstate } from "makemd-core";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root, createRoot } from "react-dom/client";

export class ContextExplorerLeafView extends ItemView {
  superstate: Superstate;
  navigation = false;

  root: Root;

  constructor(leaf: WorkspaceLeaf, superstate: Superstate) {
    super(leaf);
    this.superstate = superstate;
  }

  getViewType(): string {
    return FILE_CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return VIEW_DISPLAY_TEXT;
  }

  getIcon(): string {
    return ICON;
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructFileContext();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.constructFileContext();
    await super.setState(state, result);

    return;
  }
  getState(): any {
    const state = super.getState();

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file
    return state;
  }

  constructFileContext() {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <FileContextView superstate={this.superstate}></FileContextView>
    );
  }
}
export const FILE_CONTEXT_VIEW_TYPE = "make-context-view";
export const ICON = "component";
export const VIEW_DISPLAY_TEXT = "Explorer";
