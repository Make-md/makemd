import { SystemSettings } from "core/react/components/System/SystemSettings";
import { SpaceView, Superstate } from "makemd-core";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import {
  folderPathToString,
  getParentFolderPaths,
  pathDisplayName,
} from "utils/path";
import { SpaceInner } from "../../core/react/components/SpaceView/SpaceInner";
import { ObsidianUI } from "./ui/ui";

export const SPACE_VIEW_TYPE = "mk-space";
export const ICON = "sheets-in-box";

export class SpaceViewContainer extends ItemView {
  superstate: Superstate;
  path: string;
  navigation = true;
  root: Root;
  viewType: string;
  ui: ObsidianUI;

  constructor(
    leaf: WorkspaceLeaf,
    superstate: Superstate,
    ObsidianUI: ObsidianUI,
    viewType: string
  ) {
    super(leaf);
    this.superstate = superstate;
    this.viewType = viewType;
    this.ui = ObsidianUI;
  }

  getViewType(): string {
    return SPACE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return pathDisplayName(this.path, this.superstate);
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    this.superstate.eventsDispatcher.removeListener(
      "spaceChanged",
      this.changePath
    );
    this.superstate.eventsDispatcher.removeListener(
      "spaceDeleted",
      this.closePath
    );
    this.root?.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
  }

  changePath(payload: { path: string; newPath: string }) {
    if (this.path == payload.path) {
      this.leaf.setViewState({
        type: SPACE_VIEW_TYPE,
        state: { path: payload.newPath },
      });
    }
  }

  closePath(payload: { path: string }) {
    if (this?.path == payload.path) {
      this.leaf.setViewState({
        type: null,
      });
    }
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.path = state.path;
    if (!this.path) return;
    this.constructNote(this.path);

    const displayName = pathDisplayName(this.path, this.superstate);
    const spaceCache = this.superstate.spacesIndex.get(this.path);
    await super.setState(state, result);

    this.leaf.tabHeaderInnerTitleEl.innerText = displayName;
    //@ts-ignore
    this.leaf.view.titleEl = displayName;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl && spaceCache) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = displayName;
      if (spaceCache.type == "folder") {
        const titleParent = headerEl.querySelector(".view-header-title-parent");
        titleParent.innerHTML = "";
        const parentPaths: string[] = getParentFolderPaths(spaceCache.path);
        if (titleParent) {
          parentPaths.forEach((f) => {
            const breadcrumb = titleParent.createEl("span");
            breadcrumb.addClass("view-header-breadcrumb");
            breadcrumb.innerText = folderPathToString(f);
            breadcrumb.addEventListener("click", () =>
              this.superstate.ui.openPath(f, false)
            );
            const breadcrumbSeparator = titleParent.createEl("span");
            breadcrumbSeparator.addClass("view-header-breadcrumb-separator");
            breadcrumbSeparator.innerText = "/";
          });
        }
      }
    }
    //@ts-ignore
    result.history = true;
    return;
  }
  getState(): any {
    const state = super.getState();
    state.path = this.path;

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file
    return state;
  }

  constructNote(path: string) {
    this.destroy();
    this.superstate.eventsDispatcher.addListener(
      "spaceChanged",
      this.changePath,
      0,
      this
    );
    this.superstate.eventsDispatcher.addListener(
      "spaceDeleted",
      this.closePath,
      0,
      this
    );
    this.root = this.ui.createRoot(this.contentEl);
    if (this.root) {
      this.root.render(
        <div className="mk-space-view">
          {path == "spaces://$settings" ? (
            <SystemSettings superstate={this.superstate}></SystemSettings>
          ) : (
            <SpaceView
              path={path}
              superstate={this.superstate}
              key={path}
              readOnly={false}
            >
              <div className="mk-space-scroller markdown-source-view mod-cm6 is-readable-line-width">
                <SpaceInner
                  superstate={this.superstate}
                  header={true}
                ></SpaceInner>
              </div>
            </SpaceView>
          )}
        </div>
      );
    } else {
      this.ui.manager.eventsDispatch.addOnceListener("windowReady", () => {
        this.constructNote(path);
      });
    }
  }
}
