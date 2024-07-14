import { FileContextView, Superstate, i18n } from "makemd-core";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { ObsidianUI } from "../ui";

export class ContextExplorerLeafView extends ItemView {
  superstate: Superstate;
  navigation = false;
  root: Root;
  ui: ObsidianUI;
  constructor(leaf: WorkspaceLeaf, superstate: Superstate, ui: ObsidianUI) {
    super(leaf);
    this.superstate = superstate;
    this.ui = ui;
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
    this.root?.unmount();
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
    this.root = this.ui.createRoot(this.contentEl);
    if (this.root)
      this.root.render(
        <FileContextView superstate={this.superstate}></FileContextView>
      );
  }
}
export const FILE_CONTEXT_VIEW_TYPE = "make-context-view";
export const ICON = "component";
export const VIEW_DISPLAY_TEXT = i18n.views.explorer;
