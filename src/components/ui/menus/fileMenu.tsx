import { StickerModal } from "components/Spaces/TreeView/FileStickerMenu/FileStickerMenu";
import {
  MoveSuggestionModal,
  VaultChangeModal
} from "components/ui/modals/vaultChangeModals";
import { EditSpaceModal } from "components/ui/modals/editSpaceModal";
import { isMouseEvent } from "hooks/useLongPress";
import i18n from "i18n";
import t from "i18n";
import MakeMDPlugin from "main";
import { Menu, TAbstractFile, TFile, TFolder } from "obsidian";
import { Space } from "schemas/spaces";
import { colors } from "utils/color";
import {
  removeFileIcon,
  removeFileIcons,
  removeSpaceIcon,
  saveFileColors,
  saveFileIcon,
  saveFileIcons,
  saveSpaceIcon
} from "utils/emoji";
import {
  deleteFiles, getAbstractFileAtPath, newFileInFolder, openAFile, openFileInNewPane
} from "utils/file";
import {
  addPathsToSpace,
  insertSpaceAtIndex,
  insertSpaceItemAtIndex,
  removePathsFromSpace,
  removeSpace,
  retrieveSpaceItems,
  retrieveSpaces,
  saveFileColor, toggleSpacePin,
  TreeNode,
  updateSpaceSort
} from "utils/spaces/spaces";
import { internalPluginLoaded } from "utils/tree";
import { disclosureMenuItem } from "./menuItems";

export const triggerSectionMenu = (
  plugin: MakeMDPlugin,
  spaceName: string,
  spaces: Space[],
  e: React.MouseEvent | React.TouchEvent
) => {
  const fileMenu = new Menu();
  const space = spaces.find((f) => f.name == spaceName);
  fileMenu.addItem((menuItem) => {
    const pinned = spaces.find((f) => f.name == spaceName)?.pinned == "true";
    if (pinned) {
      menuItem.setTitle(i18n.menu.unpinSpace);
    } else {
      menuItem.setTitle(i18n.menu.pinSpace);
    }
    menuItem.setIcon("pin");
    menuItem.onClick((ev: MouseEvent) => {
      toggleSpacePin(plugin, spaceName, !pinned);
    });
  });

  if (plugin.settings.spacesStickers) {
    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.changeIcon);
      menuItem.setIcon("lucide-sticker");
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new StickerModal(plugin.app, (emoji) =>
          saveSpaceIcon(plugin, spaceName, emoji)
        );
        vaultChangeModal.open();
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.removeIcon);
      menuItem.setIcon("lucide-file-minus");
      menuItem.onClick((ev: MouseEvent) => {
        removeSpaceIcon(plugin, spaceName);
      });
    });
  }
  fileMenu.addSeparator();
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.collapseAll);
    menuItem.setIcon("lucide-chevrons-down-up");
    menuItem.onClick((ev: MouseEvent) => {
      plugin.settings.expandedFolders = {
        ...plugin.settings.expandedFolders,
        [spaceName]: [],
      };
      plugin.saveSettings();
    });
  });
  fileMenu.addSeparator();

  fileMenu.addItem((menuItem) => {
    const sortOption: [string, boolean] = ["rank", true];
    menuItem.setTitle(i18n.menu.customSort);
    menuItem.setChecked(
      space.sort == JSON.stringify(sortOption) || space.sort == ""
    );
    menuItem.onClick((ev: MouseEvent) => {
      updateSpaceSort(plugin, spaceName, sortOption);
    });
  });
  fileMenu.addSeparator();

  fileMenu.addItem((menuItem) => {
    const sortOption: [string, boolean] = ["path", true];
    menuItem.setTitle(i18n.menu.fileNameSortAlphaAsc);
    menuItem.setChecked(space.sort == JSON.stringify(sortOption));
    menuItem.onClick((ev: MouseEvent) => {
      updateSpaceSort(plugin, spaceName, sortOption);
    });
  });

  fileMenu.addItem((menuItem) => {
    const sortOption: [string, boolean] = ["path", false];
    menuItem.setTitle(i18n.menu.fileNameSortAlphaDesc);
    menuItem.setChecked(space.sort == JSON.stringify(sortOption));
    menuItem.onClick((ev: MouseEvent) => {
      updateSpaceSort(plugin, spaceName, sortOption);
    });
  });
  fileMenu.addSeparator();

  fileMenu.addItem((menuItem) => {
    const sortOption: [string, boolean] = ["created", false];
    menuItem.setTitle(i18n.menu.createdTimeSortAsc);
    menuItem.setChecked(space.sort == JSON.stringify(sortOption));
    menuItem.onClick((ev: MouseEvent) => {
      updateSpaceSort(plugin, spaceName, sortOption);
    });
  });

  fileMenu.addItem((menuItem) => {
    const sortOption: [string, boolean] = ["created", true];
    menuItem.setTitle(i18n.menu.createdTimeSortDesc);
    menuItem.setChecked(space.sort == JSON.stringify(sortOption));
    menuItem.onClick((ev: MouseEvent) => {
      updateSpaceSort(plugin, spaceName, sortOption);
    });
  });
  fileMenu.addSeparator();
  // Rename Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.edit);
    menuItem.setIcon("pencil");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new EditSpaceModal(
        plugin,
        space.name,
        "rename"
      );
      vaultChangeModal.open();
    });
  });

  // Delete Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.deleteSpace);
    menuItem.setIcon("trash");
    menuItem.onClick((ev: MouseEvent) => {
      removeSpace(plugin, space.name);
    });
  });

  if (isMouseEvent(e)) {
    fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
  } else {
    fileMenu.showAtPosition({
      // @ts-ignore
      x: e.nativeEvent.locationX,
      // @ts-ignore
      y: e.nativeEvent.locationY,
    });
  }
  return false;
};

export const triggerMultiFileMenu = (
  plugin: MakeMDPlugin,
  selectedFiles: TreeNode[],
  e: React.MouseEvent | React.TouchEvent
) => {
  const files = selectedFiles.map((s) => s.item.path);
  const spaces = retrieveSpaces(plugin);
  const spaceItems = retrieveSpaceItems(plugin, spaces);

  const fileMenu = new Menu();

  // Pin - Unpin Item
  fileMenu.addSeparator();
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.spaceTitle);
    menuItem.setDisabled(true);
  });
  spaces.map((f) => {
    fileMenu.addItem((menuItem) => {
      // const truncPaths = files.map(f => "/"+f.name+'/'+g.path);
      const allIn = files.reduce(
        (p, c) => (p ? spaceItems[f.name]?.some((g) => g.path == c) : p),
        true
      );
      if (allIn) {
        menuItem.setIcon("checkmark");
        menuItem.setTitle(f.name);
      } else {
        menuItem.setTitle(f.name);
        menuItem.setIcon("plus");
      }

      menuItem.onClick((ev: MouseEvent) => {
        if (allIn) {
          removePathsFromSpace(plugin, f.name, files);
        } else {
          addPathsToSpace(plugin, f.name, files);
        }
      });
    });
  });

  if (plugin.settings.spacesStickers) {
    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("palette");
      disclosureMenuItem(
        menuItem,
        false,
        false,
        i18n.menu.changeColor,
        "",
        [
          { name: "None", value: "" },
          ...colors.map((f) => ({ name: f[0], value: f[1] })),
        ],
        (_, values) => {
          saveFileColors(plugin, files, values[0]);
        }
      );
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.changeIcon);
      menuItem.setIcon("lucide-sticker");
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new StickerModal(plugin.app, (emoji) =>
          saveFileIcons(plugin, files, emoji)
        );
        vaultChangeModal.open();
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.removeIcon);
      menuItem.setIcon("lucide-file-minus");
      menuItem.onClick((ev: MouseEvent) => {
        removeFileIcons(plugin, files);
      });
    });
  }

  fileMenu.addSeparator();

  // Delete Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.deleteFiles);
    menuItem.setIcon("trash");
    menuItem.onClick((ev: MouseEvent) => {
      deleteFiles(plugin, files);
    });
  });

  // Open in a New Pane
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("go-to-file");
    menuItem.setTitle(t.menu.openFilePane);
    menuItem.onClick((ev: MouseEvent) => {
      files.forEach((file) =>
        openAFile(getAbstractFileAtPath(app, file), plugin, true)
      );
    });
  });

  // Move Item
  if (!internalPluginLoaded("file-explorer", plugin.app)) {
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.menu.moveFile);
      menuItem.setIcon("paper-plane");
      menuItem.onClick((ev: MouseEvent) => {
        let fileMoveSuggester = new MoveSuggestionModal(plugin.app, files);
        fileMoveSuggester.open();
      });
    });
  }
  // Trigger
  if (isMouseEvent(e)) {
    fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
  } else {
    fileMenu.showAtPosition({
      // @ts-ignore
      x: e.nativeEvent.locationX,
      // @ts-ignore
      y: e.nativeEvent.locationY,
    });
  }
  return false;
};

export const triggerFileMenu = (
  plugin: MakeMDPlugin,
  file: TAbstractFile,
  isFolder: boolean,
  e: React.MouseEvent | React.TouchEvent
) => {
  const spaces = retrieveSpaces(plugin);
  const spaceItems = retrieveSpaceItems(plugin, spaces);

  const fileMenu = new Menu();
  if (isFolder) {
    fileMenu.addSeparator();
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("edit");
      menuItem.setTitle(t.buttons.createNote);
      menuItem.onClick((ev: MouseEvent) => {
        newFileInFolder(plugin, file as TFolder);
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("folder-plus");
      menuItem.setTitle(t.buttons.createFolder);
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new VaultChangeModal(
          plugin,
          file,
          "create folder",
          "/"
        );
        vaultChangeModal.open();
      });
    });
  }

  // Pin - Unpin Item
  fileMenu.addSeparator();
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.spaceTitle);
    menuItem.setDisabled(true);
  });
  spaces.map((f, i) => {
    const itemExists = spaceItems[f.name]?.some((g) => g.path == file.path);
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(f.name);

      if (f.def?.length > 0) {
        menuItem.setDisabled(true);
        menuItem.setIcon("folder");
      } else {
        if (itemExists) {
          menuItem.setIcon("checkmark");
        } else {
          menuItem.setIcon("plus");
        }

        menuItem.onClick((ev: MouseEvent) => {
          if (!itemExists) {
            insertSpaceItemAtIndex(plugin, f.name, file.path, 0);
          } else {
            removePathsFromSpace(plugin, f.name, [file.path]);
          }
        });
      }
    });
  });
  if (isFolder) {
    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.createFolderSpace);
      menuItem.setIcon("plus-square");
      menuItem.onClick((ev: MouseEvent) => {
        insertSpaceAtIndex(plugin, file.name, false, 0, file.path);
      });
    });
  }

  if (plugin.settings.spacesStickers) {
    fileMenu.addSeparator();
    fileMenu.addItem((menuItem) => {
      menuItem.setIcon("palette");
      disclosureMenuItem(
        menuItem,
        false,
        false,
        i18n.menu.changeColor,
        "",
        [
          { name: "None", value: "" },
          ...colors.map((f) => ({ name: f[0], value: f[1] })),
        ],
        (_, values) => {
          saveFileColor(plugin, file.path, values[0]);
        }
      );
    });
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.changeIcon);
      menuItem.setIcon("lucide-sticker");
      menuItem.onClick((ev: MouseEvent) => {
        let vaultChangeModal = new StickerModal(plugin.app, (emoji) =>
          saveFileIcon(plugin, file, emoji)
        );
        vaultChangeModal.open();
      });
    });

    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.removeIcon);
      menuItem.setIcon("lucide-file-minus");
      menuItem.onClick((ev: MouseEvent) => {
        removeFileIcon(plugin, file);
      });
    });
  }

  fileMenu.addSeparator();
  // Rename Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.rename);
    menuItem.setIcon("pencil");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new VaultChangeModal(plugin, file, "rename");
      vaultChangeModal.open();
    });
  });

  // Delete Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.delete);
    menuItem.setIcon("trash");
    menuItem.onClick((ev: MouseEvent) => {
      let deleteOption = plugin.settings.deleteFileOption;
      if (deleteOption === "permanent") {
        plugin.app.vault.delete(file, true);
      } else if (deleteOption === "system-trash") {
        plugin.app.vault.trash(file, true);
      } else if (deleteOption === "trash") {
        plugin.app.vault.trash(file, false);
      }
    });
  });

  // Open in a New Pane
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("go-to-file");
    menuItem.setTitle(t.menu.openFilePane);
    menuItem.onClick((ev: MouseEvent) => {
      // @ts-ignore
      openFileInNewPane(plugin, { ...file, isFolder: isFolder });
    });
  });

  // Make a Copy Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.duplicate);
    menuItem.setIcon("documents");
    menuItem.onClick((ev: MouseEvent) => {
      if ((file as TFile).basename && (file as TFile).extension)
        plugin.app.vault.copy(
          file as TFile,
          `${file.parent.path}/${(file as TFile).basename} 1.${
            (file as TFile).extension
          }`
        );
    });
  });

  // Move Item
  if (!internalPluginLoaded("file-explorer", plugin.app)) {
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.menu.moveFile);
      menuItem.setIcon("paper-plane");
      menuItem.onClick((ev: MouseEvent) => {
        let fileMoveSuggester = new MoveSuggestionModal(plugin.app, [
          file.path,
        ]);
        fileMoveSuggester.open();
      });
    });
  }
  // Trigger
  plugin.app.workspace.trigger("file-menu", fileMenu, file, "file-explorer");
  if (isMouseEvent(e)) {
    fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
  } else {
    fileMenu.showAtPosition({
      // @ts-ignore
      x: e.nativeEvent.locationX,
      // @ts-ignore
      y: e.nativeEvent.locationY,
    });
  }
  return false;
};
