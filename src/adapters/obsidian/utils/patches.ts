import { FlowEditor } from "adapters/obsidian/ui/editors/FlowEditor";
import { FILE_TREE_VIEW_TYPE } from "adapters/obsidian/ui/navigator/NavigatorView";
import MakeMDPlugin from "main";
import { around } from "monkey-around";
import {
  EphemeralState, OpenViewState, PaneType, SplitDirection, ViewState,
  Workspace,
  WorkspaceContainer,
  WorkspaceItem,
  WorkspaceLeaf
} from "obsidian";

export const patchFilesPlugin = (plugin: MakeMDPlugin) => {
  plugin.register(
    around(Workspace.prototype, {
      getLeavesOfType(old) {
        return function (type: unknown) {
          if (type == "file-explorer") {
            return old.call(this, FILE_TREE_VIEW_TYPE);
          }
          return old.call(this, type);
        };
      },
    })
  );
};

export const patchWorkspace = (plugin: MakeMDPlugin) => {
  let layoutChanging = false;
  const uninstaller = around(Workspace.prototype, {
    changeLayout(old) {
      return async function (workspace: unknown) {
        layoutChanging = true;
        try {
          // Don't consider hover popovers part of the workspace while it's changing
          await old.call(this, workspace);
        } finally {
          layoutChanging = false;
        }
      };
    },

    getLeaf(old) {
      //Patch get leaf to always return root leaf if leaf is a flow block
      return function (newLeaf?: "split", direction?: SplitDirection) {
        let leaf : WorkspaceLeaf = old.call(this, newLeaf, direction);
        if (leaf.isFlowBlock) {
          const currentLeafId = leaf.id
          let foundLeaf = false;
        plugin.app.workspace.iterateLeaves((_leaf) => {
          if (_leaf.flowEditors && !foundLeaf) {
            _leaf.flowEditors.forEach((f) => {
              f.leaves().forEach((l) => {
                if (l.id == currentLeafId) {
                  foundLeaf = true;
                  leaf = _leaf;
                  return;
                }
              })
              
            })
          }
          return;
  }, plugin.app.workspace["rootSplit"]!);
        }
        
        return leaf;
      };
    },
    // iterateLeaves(old) {
    //   type leafIterator = (item: WorkspaceLeaf) => boolean | void;
    //   return function (arg1, arg2) {
    //     // Fast exit if desired leaf found
    //     if (old.call(this, arg1, arg2)) return true;

    //     // Handle old/new API parameter swap
    //     const cb: leafIterator = (
    //       typeof arg1 === "function" ? arg1 : arg2
    //     ) as leafIterator;
    //     const parent: WorkspaceItem = (
    //       typeof arg1 === "function" ? arg2 : arg1
    //     ) as WorkspaceItem;

    //     if (!parent) return false; // <- during app startup, rootSplit can be null
    //     if (layoutChanging) return false; // Don't let HEs close during workspace change

    //     // 0.14.x doesn't have WorkspaceContainer; this can just be an instanceof check once 15.x is mandatory:
    //     if (
    //       parent === plugin.app.workspace.rootSplit ||
    //       (WorkspaceContainer && parent instanceof WorkspaceContainer)
    //     ) {
    //       for (const popover of FlowEditor.popoversForWindow(
    //         (parent as WorkspaceContainer).win
    //       )) {
    //         // Use old API here for compat w/0.14.x
    //         if (old.call(this, cb, popover.rootSplit)) return true;
    //       }
    //     }
    //     return false;
    //   };
    // },
    openLinkText(old) {
      return function openLinkText(linkText: string, sourcePath: string, newLeaf?: PaneType | boolean, openViewState?: OpenViewState) {
        if (linkText.startsWith('spaces://')) {
          plugin.ui.openPath(linkText, newLeaf);
          return;
        }
        return old.call(this, linkText, sourcePath, newLeaf, openViewState);
      };
    },
    setActiveLeaf(old) {
    return function setActiveLeaf(leaf, params) {
      if (leaf.view.getViewType() == 'markdown') {
        this.activeEditor = leaf.view;
        if (leaf.view.file)
      {
      //   if (!plugin.superstate.settings.spacesDisablePatch)
      //   this._['file-open'].forEach((cb: any) => {
      //   if (cb?.fn && cb.ctx?.leaf)
      // {
      //   const bound = cb.fn.bind(cb.ctx)
      //   bound(leaf.view.file)
      // }
      // }
      // );
    }
    }
      return old.call(this, leaf, params);
    }
    },
    getActiveViewOfType(old) {

      return function getActiveViewOfType(type) {
if (type.prototype?.getViewType && type.prototype.getViewType() == 'markdown')
{
  if (this.activeEditor)
  return this.activeEditor
}
        return old.call(this, type);
      }
      },
    getDropLocation(old) {
      return function getDropLocation(event: MouseEvent) {
        for (const popover of FlowEditor.activePopovers()) {
          const dropLoc = this.recursiveGetTarget(event, popover.rootSplit);
          if (dropLoc) {
            return dropLoc;
          }
        }
        return old.call(this, event);
      };
    },
    onDragLeaf(old) {
      return function (event: MouseEvent, leaf: WorkspaceLeaf) {
        const hoverPopover = FlowEditor.forLeaf(leaf);
        return old.call(this, event, leaf);
      };
    },
  });
  plugin.register(uninstaller);
};
export const patchWorkspaceLeaf = (plugin: MakeMDPlugin) => {
  plugin.register(
    around(WorkspaceLeaf.prototype, {
      getRoot(old) {
        return function () {
          const top = old.call(this);
          return top.getRoot === this.getRoot ? top : top.getRoot();
        };
      },
      setViewState(old) {
        return async function (viewState: ViewState, eState?: unknown) {
          const result = await old.call(this, viewState, eState);
          try {
            if (this.flowEditors) {
              for (const he of this.flowEditors) {
                he.hide();
              }
            }
            this.flowEditors = [];
          } catch {}
          return result;
        };
      },
      setEphemeralState(old) {
        return function (state: EphemeralState) {
          old.call(this, state);
          if (state.focus && this.view?.getViewType() === "empty") {
            // Force empty (no-file) view to have focus so dialogs don't reset active pane
            this.view.contentEl.tabIndex = -1;
            this.view.contentEl.focus();
          }
        };
      },
    })
  );
  plugin.register(
    around(WorkspaceItem.prototype, {
      getContainer(old) {
        return function () {
          if (!old) return; // 0.14.x doesn't have this
          if (!this.parentSplit || this instanceof WorkspaceContainer)
            return old.call(this);
          return this.parentSplit.getContainer();
        };
      },
    })
  );
};
