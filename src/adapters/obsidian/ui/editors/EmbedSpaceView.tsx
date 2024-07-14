import { SpaceInner } from "core/react/components/SpaceView/SpaceInner";
import MakeMDPlugin from "main";
import { SpaceView } from "makemd-core";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { pathDisplayName } from "utils/path";
export const EMBED_SPACE_VIEW_TYPE = "mk-space-embed";
export const ICON = "sheets-in-box";

export class EmbedSpaceView extends ItemView {
  plugin: MakeMDPlugin;
  path: string;
  source: string;
  navigation = true;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return EMBED_SPACE_VIEW_TYPE;
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
    this.constructInlineContext();
    await super.setState(state, result);

    const title = pathDisplayName(this.path, this.plugin.superstate);
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

  constructInlineContext() {
    this.destroy();
    this.root = this.plugin.ui.createRoot(this.contentEl);
    if (this.root) {
      this.root.render(
        <SpaceView
          path={this.path}
          superstate={this.plugin.superstate}
          key={this.path}
          readOnly={true}
        >
          <SpaceInner
            superstate={this.plugin.superstate}
            header={false}
          ></SpaceInner>
        </SpaceView>
      );
    } else {
      this.plugin.ui.manager.eventsDispatch.addOnceListener(
        "windowReady",
        () => {
          this.constructInlineContext();
        }
      );
    }
  }
}
