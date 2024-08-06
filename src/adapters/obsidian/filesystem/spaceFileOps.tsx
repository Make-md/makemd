import { ConfirmationModal } from "core/react/components/UI/Modals/ConfirmationModal";
import { retrieveAllRecursiveChildren } from "core/spaceManager/filesystemAdapter/spaces";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
import React from "react";
import { FilesystemSpaceInfo } from "types/mdb";
import { windowFromDocument } from "utils/dom";

export const moveSpaceFiles = async (
  plugin: MakeMDPlugin,
  oldString: string,
  newString: string
) => {
  const allChildren = plugin.superstate.allSpaces();
  plugin.superstate.settings.spaceSubFolder = newString;
  plugin.superstate.saveSettings();
  for (const f of allChildren) {
    if (
      await plugin.superstate.spaceManager.pathExists(
        (f.space as FilesystemSpaceInfo)?.folderPath + "/" + oldString
      )
    ) {
      await plugin.superstate.spaceManager.renamePath(
        (f.space as FilesystemSpaceInfo)?.folderPath + "/" + oldString,
        (f.space as FilesystemSpaceInfo)?.folderPath + "/" + newString
      );
    }
  }
  if (await plugin.superstate.spaceManager.pathExists(oldString)) {
    await plugin.superstate.spaceManager.renamePath(oldString, newString);
  }
  await plugin.superstate.initializeSpaces();
  plugin.superstate.ui.notify("All space files have been move.");
};

export const deleteSpaceFiles = async (plugin: MakeMDPlugin, doc: Document) => {
  plugin.superstate.ui.openModal(
    "Delete Space Files",

    <ConfirmationModal
      confirmAction={() => {
        const settings = plugin.superstate.settings;
        const spaceSubFolder = settings.spaceSubFolder;

        const allChildren = retrieveAllRecursiveChildren(
          plugin.superstate.vaultDBCache,
          settings,
          settings.spacesFolder
        );
        allChildren.forEach((f) => {
          if (f.name == spaceSubFolder && f.folder == "true") {
            plugin.superstate.spaceManager.deletePath(f.path);
          }
        });
        plugin.superstate.ui.notify("All space files have been deleted.");
      }}
      confirmLabel={i18n.buttons.delete}
      message={
        "Are you sure you want to delete all space files? Warning: if you have a custom space folder name, all folders with that name will be deleted."
      }
    ></ConfirmationModal>,
    windowFromDocument(doc)
  );
};
