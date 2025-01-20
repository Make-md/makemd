import MakeMDPlugin from "main";
import { around } from "monkey-around";
import {
  OpenViewState, PaneType,
  Workspace,
  WorkspaceLeaf
} from "obsidian";
import { EVER_VIEW_TYPE } from "../ui/navigator/EverLeafView";
import { FILE_TREE_VIEW_TYPE } from "../ui/navigator/NavigatorView";

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
  const uninstaller = around(Workspace.prototype, {
    getLeaf(old) {
      //Patch get leaf to always return root leaf if leaf is a flow block
      return function (newLeaf?: PaneType | boolean) {

        let leaf: WorkspaceLeaf = old.call(this, newLeaf);

        if (leaf.view.getViewType() == EVER_VIEW_TYPE) {
          if (leaf.getContainer() == plugin.app.workspace.rootSplit) {
            leaf = plugin.app.workspace.getLeaf("split");
            return leaf;
          }
        }


        return leaf;
      };
    },
  openLinkText(old) {
    return function openLinkText(linkText: string, sourcePath: string, newLeaf?: PaneType | boolean, openViewState?: OpenViewState) {

      if (plugin.superstate.settings.enableFolderNote && plugin.superstate.settings.spaceViewEnabled) {
        const resolvedPath = plugin.app.metadataCache.getFirstLinkpathDest(linkText, sourcePath);
        const pathState = plugin.superstate.pathsIndex.get(resolvedPath?.path);
        if (pathState?.metadata.spacePath?.length > 0) {
          plugin.ui.openPath(pathState.metadata.spacePath, newLeaf);
          return;
        }
      }
      
      if (plugin.superstate.spacesIndex.has(linkText)) {
        plugin.ui.openPath(linkText, newLeaf);
        return;
      }
      return old.call(this, linkText, sourcePath, newLeaf, openViewState);
    };
  },
  
});
plugin.register(uninstaller);
}


