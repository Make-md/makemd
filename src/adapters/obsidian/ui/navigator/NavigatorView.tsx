import { ItemView, TAbstractFile, TFolder, WorkspaceLeaf } from "obsidian";
import React from "react";
export const FILE_TREE_VIEW_TYPE = "mk-path-view";
export const VIEW_DISPLAY_TEXT = "Navigator";
export const ICON = "layout-grid";

import { SPACE_VIEW_TYPE } from "adapters/obsidian/SpaceViewContainer";

import { getLeaf } from "adapters/obsidian/utils/file";
import { eventTypes } from "core/types/types";
import { Navigator, Superstate } from "makemd-core";
import { Root } from "react-dom/client";
import { ObsidianUI } from "../ui";

export class FileTreeView extends ItemView {
  ui: ObsidianUI;
  root: Root;
  superstate: Superstate;
  currentFolderPath: string;
  navigation = false;

  constructor(leaf: WorkspaceLeaf, superstate: Superstate, ui: ObsidianUI) {
    super(leaf);
    this.superstate = superstate;
    this.ui = ui;
  }

  revealInFolder(file: TAbstractFile) {
    
    if (file instanceof TFolder) {
      const leaf = getLeaf(this.leaf.view.app, false);
      leaf.setViewState({
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
      const leaf = this.superstate.settings.spacesRightSplit
        ? this.app.workspace.getRightLeaf(false)
        : this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
    }
    this.destroy();
  }

  destroy() {
    this.root?.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructFileTree();
  }

  constructFileTree() {
    this.destroy();
    this.root = this.ui.createRoot(this.contentEl);
    if (this.root) {
      this.root.render(<Navigator superstate={this.superstate} />);
    } else {
      this.ui.manager.eventsDispatch.addOnceListener("windowReady", () => {
        this.constructFileTree();
      });
    }
  }
}
