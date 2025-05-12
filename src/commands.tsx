import { moveSpaceFiles } from "adapters/obsidian/filesystem/spaceFileOps";
import { openPathFixer } from "adapters/obsidian/fileSystemPathFixer";
import { FILE_CONTEXT_VIEW_TYPE } from "adapters/obsidian/ui/explorer/ContextExplorerLeafView";
import { showWarningsModal } from "core/react/components/Navigator/SyncWarnings";
import { newSpaceModal } from "core/react/components/UI/Menus/navigator/showSpaceAddMenu";
import { HiddenPaths } from "core/react/components/UI/Modals/HiddenFiles";
import { openInputModal } from "core/react/components/UI/Modals/InputModal";
import { addPathToSpaceAtIndex } from "core/superstate/utils/spaces";
import { eventTypes } from "core/types/types";
import { isPhone } from "core/utils/ui/screen";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
import React from "react";
import { BlinkMode } from "shared/types/blink";
import { windowFromDocument } from "shared/utils/dom";

export const attachCommands = (plugin: MakeMDPlugin) => {
  if (!isPhone(plugin.superstate.ui))
    plugin.addCommand({
      id: "open-ever-view",
      name: "Open Overview",
      callback: () => {
        plugin.openEverView();
      },
    });
  plugin.addCommand({
    id: "open-hidden",
    name: "Manage Hidden Files",
    callback: () => {
      plugin.superstate.ui.openModal(
        i18n.labels.hiddenFiles,
        <HiddenPaths superstate={plugin.superstate}></HiddenPaths>,
        windowFromDocument(
          plugin.app.workspace.getLeaf()?.containerEl.ownerDocument
        )
      );
    },
  });
  plugin.addCommand({
    id: "show-warnings",
    name: "Show Sync Warnings",
    callback: () => {
      showWarningsModal(plugin.superstate, window);
    },
  });
  plugin.addCommand({
    id: "logs",
    name: "Toggle Enhanced Logs",
    callback: () => {
      plugin.superstate.settings.enhancedLogs =
        !plugin.superstate.settings.enhancedLogs;
      plugin.saveSettings();
    },
  });
  plugin.addCommand({
    id: "path-fixer",
    name: "Fix Unsupported Characters in Paths",
    callback: () => {
      openPathFixer(plugin);
    },
  });
  plugin.addCommand({
    id: "move-space-folder",
    name: "Move Space Data Folder",
    callback: () => {
      const win = windowFromDocument(
        plugin.app.workspace.getLeaf()?.containerEl.ownerDocument
      );
      openInputModal(
        plugin.superstate,
        "Move Space Data Folder",
        plugin.superstate.settings.spaceSubFolder,
        (path) => {
          moveSpaceFiles(
            plugin,
            plugin.superstate.settings.spaceSubFolder,
            path
          );
        },
        "Move",
        win
      );
    },
  });
  if (plugin.superstate.settings.spacesEnabled) {
    plugin.addCommand({
      id: "mk-new-space",
      name: "New Folder",
      callback: () => {
        newSpaceModal(plugin.superstate);
      },
    });

    plugin.addCommand({
      id: "mk-debug-close-tabs",
      name: "Close Extra File Tabs",
      callback: () => {
        plugin.closeExtraFileTabs();
      },
    });

    plugin.addCommand({
      id: "mk-expand-folders",
      name: i18n.menu.expandAllSections,
      callback: () => {
        const spaces =
          plugin.superstate.focuses[plugin.superstate.settings.currentWaypoint]
            .paths;
        const newSections = spaces;
        plugin.superstate.settings.expandedSpaces = newSections;
        plugin.superstate.saveSettings();
      },
    });

    plugin.addCommand({
      id: "mk-collapse-folders",
      name: i18n.commandPalette.collapseAllFolders,
      callback: () => {
        plugin.superstate.settings.expandedSpaces = [];
        plugin.saveSettings();
      },
    });
    plugin.addCommand({
      id: "mk-release-notes",
      name: i18n.commandPalette.releaseNotes,
      callback: () => {
        plugin.releaseTheNotes();
      },
    });
    plugin.addCommand({
      id: "mk-get-started",
      name: i18n.commandPalette.getStarted,
      callback: () => {
        plugin.getStarted();
      },
    });
    plugin.addCommand({
      id: "mk-reveal-file",
      name: i18n.commandPalette.revealFile,
      callback: () => {
        const file = plugin.superstate.ui.activePath;
        if (!file) return;
        const evt = new CustomEvent(eventTypes.revealPath, {
          detail: { path: file },
        });
        window.dispatchEvent(evt);
      },
    });

    plugin.addCommand({
      id: "mk-pin-active",
      name: "Pin Active File to Space",
      callback: () => {
        const file = plugin.superstate.ui.activePath;
        if (!file) return;
        const pathState = plugin.superstate.pathsIndex.get(file);
        if (!pathState) return;
        plugin.quickOpen(plugin.superstate, BlinkMode.OpenSpaces, (space) => {
          const spaceCache = plugin.superstate.spacesIndex.get(space);
          if (spaceCache)
            addPathToSpaceAtIndex(plugin.superstate, spaceCache, file, -1);
        });
      },
    });

    plugin.addCommand({
      id: "mk-spaces",
      name: i18n.commandPalette.openSpaces,
      callback: () => plugin.openFileTreeLeaf(true),
    });
  }
  if (plugin.superstate.settings.enableFolderNote) {
    plugin.addCommand({
      id: "mk-convert-folder-note",
      name: i18n.commandPalette.convertPathToSpace,
      callback: () => plugin.convertPathToSpace(),
    });
  }
  if (plugin.superstate.settings.contextEnabled) {
    plugin.addCommand({
      id: "mk-open-file-context",
      name: i18n.commandPalette.openFileContext,
      callback: () => plugin.openFileContextLeaf(FILE_CONTEXT_VIEW_TYPE, true),
    });
  }
  if (plugin.superstate.settings.inlineBacklinks) {
    plugin.addCommand({
      id: "mk-toggle-backlinks",
      name: i18n.commandPalette.toggleBacklinks,
      callback: () => {
        const evt = new CustomEvent(eventTypes.toggleBacklinks);
        window.dispatchEvent(evt);
      },
    });
  }

  if (plugin.superstate.settings.blinkEnabled) {
    plugin.addCommand({
      id: "mk-blink",
      name: i18n.commandPalette.blink,
      callback: () => plugin.quickOpen(plugin.superstate, BlinkMode.Blink),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "o",
        },
      ],
    });
  }
};
