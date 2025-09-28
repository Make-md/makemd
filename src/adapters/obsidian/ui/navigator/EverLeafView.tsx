import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
export const EVER_VIEW_TYPE = "mk-ever-view";
export const VIEW_DISPLAY_TEXT = "Overview";
export const ICON = "columns";

import { EverView } from "core/react/components/Navigator/EverView";
import { SpaceManagerProvider } from "core/react/context/SpaceManagerContext";
import { Superstate } from "makemd-core";
import { Root } from "react-dom/client";
import { ObsidianUI } from "../ui";

export class EverLeafView extends ItemView {
  ui: ObsidianUI;
  root: Root;
  superstate: Superstate;
  path: string;
  navigation = false;

  constructor(leaf: WorkspaceLeaf, superstate: Superstate, ui: ObsidianUI) {
    super(leaf);
    this.superstate = superstate;
    this.ui = ui;
  }

  getViewType(): string {
    return EVER_VIEW_TYPE;
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
  getState(): any {
    const state = super.getState();
    state.path = this.path;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file
    return state;
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.ui.manager.activePath;
    this.path = state.path;
    if (!this.path) return;
    this.constructView(this.path);
  }
  destroy() {
    this.root?.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructView(this.path);
  }

  constructView(path: string) {
    this.destroy();
    this.root = this.ui.createRoot(this.contentEl);
    if (!path) {
      if (this.superstate.spacesIndex.has(this.ui.manager.activePath)) {
        path = this.ui.manager.activePath;
      } else {
        path = this.superstate.pathsIndex.get(
          this.ui.manager.activePath
        )?.parent;
      }
    }
    if (this.root) {
      this.root.render(
        <SpaceManagerProvider superstate={this.superstate}>
          <EverView superstate={this.superstate} path={path} />
        </SpaceManagerProvider>
      );
    } else {
      this.ui.manager.eventsDispatch.addOnceListener("windowReady", () => {
        this.constructView(path);
      });
    }
  }
}
