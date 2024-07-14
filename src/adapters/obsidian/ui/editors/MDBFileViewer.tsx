import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import MakeMDPlugin from "main";
import { MDBViewer } from "makemd-core";
import { FileView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { getParentPathFromString } from "utils/path";
export const MDB_FILE_VIEWER_TYPE = "make-mdb-viewer";
export const ICON = "sheets-in-box";

export const openContextEditor = async (
  file: string,
  schema: string,
  plugin: MakeMDPlugin
) => {
  const leaf = plugin.app.workspace.getLeaf(false);
  const viewType = MDB_FILE_VIEWER_TYPE;
  plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({
    type: viewType,
    state: { file, schema },
  });
  await plugin.app.workspace.requestSaveLayout();
};

export class MDBFileViewer extends FileView {
  plugin: MakeMDPlugin;
  navigation = true;
  schema: string;
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
    this.file = getAbstractFileAtPath(this.plugin.app, state.file) as TFile;
    this.schema = state.schema;
    this.constructInlineContext(state.file, state.schema);
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
    const state = super.getState();
    state.file = this.file.path;
    state.schema = this.schema;
    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructInlineContext(path: string, schema: string) {
    const space = this.plugin.superstate.spaceManager.spaceInfoForPath(
      getParentPathFromString(path)
    );

    this.destroy();

    if (space) {
      this.root = this.plugin.ui.createRoot(this.contentEl);
      if (this.root) {
        this.root.render(
          <MDBViewer
            superstate={this.plugin.superstate}
            space={space}
            schema={schema}
          ></MDBViewer>
        );
      } else {
        this.plugin.ui.manager.eventsDispatch.addOnceListener(
          "windowReady",
          () => {
            this.constructInlineContext(path, schema);
          }
        );
      }
    }
  }
}
