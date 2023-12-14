import { ItemView, TAbstractFile, TFolder, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root, createRoot } from "react-dom/client";
export const FILE_TREE_VIEW_TYPE = "mk-path-view";
export const VIEW_DISPLAY_TEXT = "Spaces";
export const ICON = "layout-grid";

import { SPACE_VIEW_TYPE } from "adapters/obsidian/SpaceViewContainer";

import { eventTypes } from "core/types/types";
import { Navigator, Superstate } from "makemd-core";

export class FileTreeView extends ItemView {
  superstate: Superstate;
  currentFolderPath: string;
  navigation = false;
  root: Root;

  constructor(leaf: WorkspaceLeaf, superstate: Superstate) {
    super(leaf);
    this.superstate = superstate;
  }

  revealInFolder(file: TAbstractFile) {
    if (file instanceof TFolder) {
      this.leaf.view.app.workspace.activeLeaf.setViewState({
        type: SPACE_VIEW_TYPE,
        state: { path: file.path },
      });
      this.leaf.view.app.workspace.requestSaveLayout();
    } else {
      const evt = new CustomEvent(eventTypes.revealPath, {
        detail: { path: file.path },
      });
      window.dispatchEvent(evt);
    }
  }
  getViewType(): string {
    return FILE_TREE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return VIEW_DISPLAY_TEXT;
  }

  getIcon(): string {
    return ICON;
  }

  async onClose() {
    const leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      const leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
    }
    this.destroy();
  }

  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructFileTree();
  }

  constructFileTree() {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(<Navigator superstate={this.superstate} />);
  }
}
