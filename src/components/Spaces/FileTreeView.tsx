import "css/FileTree.css";
import {
  ItemView,
  TAbstractFile, TFolder,
  WorkspaceLeaf
} from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { RecoilRoot } from "recoil";
import MakeMDPlugin from "../../main";
export const FILE_TREE_VIEW_TYPE = "mk-file-view";
export const SETS_VIEW_TYPE = "mk-sets-view";
export const VIEW_DISPLAY_TEXT = "Spaces";
export const ICON = "layout-grid";

import { CONTEXT_VIEW_TYPE } from "components/ContextView/ContextView";
import { MainMenu } from "components/Spaces/MainMenu";
import { eventTypes } from "types/types";
import { platformIsMobile } from "utils/file";
import { MainList } from "./MainList";

export class FileTreeView extends ItemView {
  plugin: MakeMDPlugin;
  currentFolderPath: string;
  navigation = false;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  revealInFolder(file: TAbstractFile) {
    if (file instanceof TFolder) {
      this.plugin.app.workspace.activeLeaf.setViewState({
        type: CONTEXT_VIEW_TYPE,
        state: { type: "folder", folder: file.path },
      });
      this.plugin.app.workspace.requestSaveLayout();
    } else {
      let evt = new CustomEvent(eventTypes.revealFile, {
        detail: { file: file },
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
    let leafs = this.app.workspace.getLeavesOfType(FILE_TREE_VIEW_TYPE);
    if (leafs.length == 0) {
      let leaf = this.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({ type: FILE_TREE_VIEW_TYPE });
    }
    this.destroy();
  }

  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructFileTree(this.app.vault.getRoot().path, "");
  }

  constructFileTree(folderPath: string, vaultChange: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div className="mk-sidebar">
        <RecoilRoot>
          {!platformIsMobile() && !this.plugin.settings.spacesCompactMode ? (
            <MainMenu plugin={this.plugin}></MainMenu>
          ) : null}

          <MainList plugin={this.plugin}></MainList>
        </RecoilRoot>
      </div>
    );
  }
}
