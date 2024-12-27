import {
  getAbstractFileAtPath,
  renameFile,
} from "adapters/obsidian/utils/file";
import { ConfirmationModal } from "core/react/components/UI/Modals/ConfirmationModal";
import { updatePrimaryAlias } from "core/superstate/utils/label";
import MakeMDPlugin from "main";
import { TFile } from "obsidian";
import React from "react";
import { sanitizeFileName } from "shared/utils/sanitizers";

export const openPathFixer = (plugin: MakeMDPlugin) => {
  const superstate = plugin.superstate;
  const currentIssueFiles = [...plugin.obsidianAdapter.fileNameWarnings];
  const message = `The following files have issues with their names. Would you like to fix them? \n ${currentIssueFiles.join(
    "\n"
  )}`;
  superstate.ui.openModal(
    "Path Fixer",
    <ConfirmationModal
      message={message}
      confirmLabel="Rename"
      confirmAction={async () => {
        for (const file of currentIssueFiles) {
          const currentFile = getAbstractFileAtPath(plugin.app, file);
          const currentName =
            currentFile instanceof TFile
              ? (currentFile as TFile)?.basename
              : currentFile.name;
          if (!currentFile) return;
          await updatePrimaryAlias(
            plugin.superstate,
            file,
            plugin.superstate.pathsIndex.get(file)?.metadata?.property?.aliases,
            currentName
          );
          await renameFile(plugin, currentFile, sanitizeFileName(currentName));
        }
        plugin.obsidianAdapter.fileNameWarnings = new Set();
      }}
    ></ConfirmationModal>,
    window
  );
};
