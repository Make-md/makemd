import { around } from "monkey-around";
import { EphemeralState, PaneType, ViewState, Workspace, WorkspaceContainer, WorkspaceItem, WorkspaceLeaf } from "obsidian";

import { FlowEditor } from "shared/FlowEditor";
import MakeBasicsPlugin from "../basics";


export const patchWorkspaceForFlow = (plugin: MakeBasicsPlugin) => {
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
      return function (newLeaf?: PaneType | boolean) {

        let leaf: WorkspaceLeaf = old.call(this, newLeaf);


        if (leaf.isFlowBlock) {
          const currentLeafId = leaf.id;
          let foundLeaf = false;
          plugin.app.workspace.iterateLeaves((_leaf) => {
            if (_leaf.flowEditors && !foundLeaf) {
              _leaf.flowEditors.forEach((f) => {
                f.leaves().forEach((l: any) => {
                  if (l.id == currentLeafId) {
                    foundLeaf = true;
                    leaf = _leaf;
                    return;
                  }
                });

              });
            }
            return;
          }, plugin.app.workspace["rootSplit"]!);
        }

        return leaf;
      };
    },

    
    setActiveLeaf(old) {
      return function setActiveLeaf(leaf, params) {
        if (leaf.view.getViewType() == 'markdown') {
          this.activeEditor = leaf.view;
          if (leaf.view.file) {
            
          }
        }
        return old.call(this, leaf, params);
      };
    },

    getDropLocation(old) {
      return function getDropLocation(event: MouseEvent) {
        for (const popover of FlowEditor.activePopovers(plugin.app)) {
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
  plugin.plugin.register(uninstaller);
};
export const patchWorkspaceLeafForFlow = (plugin: MakeBasicsPlugin) => {
  plugin.plugin.register(
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
          } catch { }
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
  plugin.plugin.register(
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
