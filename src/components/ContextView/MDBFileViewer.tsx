import { FileView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { mdbContextByDBPath } from "utils/contexts/contexts";
import { getAbstractFileAtPath } from "utils/file";
import MakeMDPlugin from "../../main";
import { ContextViewComponent } from "./ContextViewComponent";
export const MDB_FILE_VIEWER_TYPE = "make-mdb-viewer";
export const ICON = "sheets-in-box";

export class MDBFileViewer extends FileView {
  plugin: MakeMDPlugin;
  navigation = true;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return MDB_FILE_VIEWER_TYPE;
  }

  getDisplayText(): string {
    return this.file?.name;
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
    this.file = getAbstractFileAtPath(app, state.file) as TFile;

    this.constructInlineContext();
    await super.setState(state, result);
    this.leaf.tabHeaderInnerTitleEl.innerText = this.file.name;
    //@ts-ignore
    this.leaf.view.titleEl = this.file.name;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = this.file.name;
    }

    return;
  }
  getState(): any {
    let state = super.getState();
    state.file = this.file.path;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructInlineContext() {
    const context = mdbContextByDBPath(this.plugin, this.file.path);

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
