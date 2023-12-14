import { EmbedViewComponent, Superstate } from "makemd-core";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root, createRoot } from "react-dom/client";
import { pathDisplayName } from "utils/path";
export const EMBED_CONTEXT_VIEW_TYPE = "make-inline-context";
export const ICON = "sheets-in-box";

export class EmbedContextView extends ItemView {
  superstate: Superstate;
  path: string;
  source: string;
  navigation = true;
  root: Root;

  constructor(leaf: WorkspaceLeaf, superstate: Superstate) {
    super(leaf);
    this.superstate = superstate;
  }

  getViewType(): string {
    return EMBED_CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.path;
  }

  async onClose() {
    this.destroy();
  }

  onunload(): void {
    this.destroy();
  }
  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.path = state.path;
    this.source = state.source;
    this.constructInlineContext(this.path);
    await super.setState(state, result);

    const title = pathDisplayName(this.path, this.superstate);
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
    const state = super.getState();
    state.path = this.path;
    state.source = this.source;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructInlineContext(file: string) {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <div>
        <EmbedViewComponent
          superstate={this.superstate}
          path={this.path}
          source={this.source}
        ></EmbedViewComponent>
      </div>
    );
  }
}
