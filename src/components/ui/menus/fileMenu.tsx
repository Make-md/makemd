import { EditSpaceModal } from "components/ui/modals/editSpaceModal";
import { stickerModal } from "components/ui/modals/stickerModal";
import {
  AddToSpaceModal,
  MoveSuggestionModal,
  RemoveFromSpaceModal,
  VaultChangeModal,
} from "components/ui/modals/vaultChangeModals";
import { isMouseEvent } from "hooks/useLongPress";
import { default as i18n, default as t } from "i18n";
import MakeMDPlugin from "main";
import { Menu, TAbstractFile, TFile, TFolder } from "obsidian";
import { Space } from "schemas/spaces";
import {
  TreeNode,
  insertSpaceAtIndex,
  newFileInSpace,
  newFolderInSpace,
  removeSpace,
  retrieveSpaceItems,
  saveFileColor,
  saveFolderSort,
  toggleSpacePin,
  updateSpaceSort,
} from "superstate/spacesStore/spaces";
import { Path } from "types/types";
import { colors } from "utils/color";
import {
  removeFileIcon,
  removeFileIcons,
  removeSpaceIcon,
  saveFileColors,
  saveFileIcon,
  saveFileIcons,
  saveSpaceIcon,
} from "utils/emoji";
import {
  createNewCanvasFile,
  deleteFiles,
  getAbstractFileAtPath,
  newFileInFolder,
  noteToFolderNote,
  openAFile,
  openFileInNewPane,
} from "utils/file";
import { internalPluginLoaded } from "utils/tree";
import { disclosureMenuItem } from "./menuItems";

export const triggerSectionAddMenu = (
  plugin: MakeMDPlugin,
  e: React.MouseEvent | React.TouchEvent
) => {
  const fileMenu = new Menu();
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("plus");
    menuItem.setTitle(t.buttons.createSection);
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new EditSpaceModal(
        plugin,
        {
          name: "",
          def: {
            type: "focus",
            folder: "",
            filters: [],
          },
        },
        "create"
      );
      vaultChangeModal.open();
    });
  });
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("plus");
    menuItem.setTitle(t.buttons.createSectionSmart);
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new EditSpaceModal(
        plugin,
        {
          name: "",
          def: {
            type: "smart",
            folder: "",
            filters: [],
          },
        },
        "create"
      );
      vaultChangeModal.open();
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

export const triggerSectionMenu = (
  plugin: MakeMDPlugin,
  space: Space,
  spaces: Space[],
  e: React.MouseEvent | React.TouchEvent,
  activeFile: Path
) => {
  if (!space) return;
  const fileMenu = new Menu();
  const spaceName = space.name;

  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("edit");
    menuItem.setTitle(t.buttons.createNote);
    menuItem.onClick((ev: MouseEvent) => {
      newFileInSpace(plugin, space, activeFile);
    });
  });
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("layout-dashboard");
    menuItem.setTitle(t.buttons.createCanvas);
    menuItem.onClick((ev: MouseEvent) => {
      newFileInSpace(plugin, space, activeFile, true);
    });
  });

  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("folder-plus");
    menuItem.setTitle(t.buttons.createFolder);
    menuItem.onClick((ev: MouseEvent) => {
      newFolderInSpace(plugin, space, activeFile);
    });
  });

  fileMenu.addSeparator();
  fileMenu.addItem((menuItem) => {
    const pinned = space?.pinned == "false" || space?.pinned == "home";
    menuItem.setTitle(i18n.menu.homeSpace);
    menuItem.setIcon("home");
    menuItem.setChecked(pinned);
    menuItem.onClick((ev: MouseEvent) => {
      toggleSpacePin(plugin, spaceName, "home");
    });
  });

  fileMenu.addItem((menuItem) => {
    const pinned = space?.pinned == "true" || space?.pinned == "pinned";
    menuItem.setTitle(i18n.menu.pinSpace);
    menuItem.setIcon("pin");
    menuItem.setChecked(pinned);
    menuItem.onClick((ev: MouseEvent) => {
      toggleSpacePin(plugin, spaceName, "pinned");
    });
  });

  fileMenu.addItem((menuItem) => {
    const space = spaces.find((f) => f.name == spaceName);
    const pinned = space?.pinned == "none";
    menuItem.setTitle(i18n.menu.unpinSpace);
    menuItem.setIcon("pin-off");
    menuItem.onClick((ev: MouseEvent) => {
      toggleSpacePin(plugin, spaceName, "none");
    });
  });

  if (plugin.settings.spacesStickers) {
    fileMenu.addSeparator();
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.buttons.changeIcon);
      menuItem.setIcon("lucide-sticker");
      menuItem.onClick((ev: MouseEvent) => {
        const vaultChangeModal = new stickerModal(plugin.app, plugin, (emoji) =>
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
  if (space.def.type == "focus") {
    fileMenu.addItem((menuItem) => {
      const sortOption: [string, boolean] = ["rank", true];
      menuItem.setIcon("arrow-up-down");
      menuItem.setTitle(i18n.menu.customSort);
      menuItem.setChecked(
        space.sort == JSON.stringify(sortOption) || space.sort == ""
      );
      menuItem.onClick((ev: MouseEvent) => {
        updateSpaceSort(plugin, spaceName, sortOption);
      });
    });
  }

  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.sortBy);
    menuItem.setIcon("sort-desc");
    menuItem.onClick((ev: MouseEvent) => {
      const sortMenu = new Menu();

      sortMenu.addItem((menuItem) => {
        const sortOption: [string, boolean] = ["path", true];
        menuItem.setTitle(i18n.menu.fileNameSortAlphaAsc);
        menuItem.setChecked(space.sort == JSON.stringify(sortOption));
        menuItem.onClick((ev: MouseEvent) => {
          updateSpaceSort(plugin, spaceName, sortOption);
        });
      });

      sortMenu.addItem((menuItem) => {
        const sortOption: [string, boolean] = ["path", false];
        menuItem.setTitle(i18n.menu.fileNameSortAlphaDesc);
        menuItem.setChecked(space.sort == JSON.stringify(sortOption));
        menuItem.onClick((ev: MouseEvent) => {
          updateSpaceSort(plugin, spaceName, sortOption);
        });
      });
      sortMenu.addSeparator();

      sortMenu.addItem((menuItem) => {
        const sortOption: [string, boolean] = ["ctime", false];
        menuItem.setTitle(i18n.menu.createdTimeSortAsc);
        menuItem.setChecked(space.sort == JSON.stringify(sortOption));
        menuItem.onClick((ev: MouseEvent) => {
          updateSpaceSort(plugin, spaceName, sortOption);
        });
      });

      sortMenu.addItem((menuItem) => {
        const sortOption: [string, boolean] = ["ctime", true];
        menuItem.setTitle(i18n.menu.createdTimeSortDesc);
        menuItem.setChecked(space.sort == JSON.stringify(sortOption));
        menuItem.onClick((ev: MouseEvent) => {
          updateSpaceSort(plugin, spaceName, sortOption);
        });
      });
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      if (isMouseEvent(e)) {
        sortMenu.showAtPosition({ x: offset.left, y: offset.top + 30 });
      } else {
        sortMenu.showAtPosition({
          // @ts-ignore
          x: e.nativeEvent.locationX,
          // @ts-ignore
          y: e.nativeEvent.locationY,
        });
      }
    });
  });

  fileMenu.addSeparator();
  // Rename Item
  fileMenu.addItem((menuItem) => {
    menuItem.setTitle(t.menu.edit);
    menuItem.setIcon("pencil");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new EditSpaceModal(plugin, space, "rename");
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
  const spaces = plugin.index.allSpaces();
  const spaceItems = retrieveSpaceItems(plugin, spaces);

  const fileMenu = new Menu();

  // Pin - Unpin Item
  fileMenu.addSeparator();

  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("plus");
    menuItem.setTitle("Add to Space");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new AddToSpaceModal(
        plugin,
        selectedFiles.map((f) => f.path)
      );
      vaultChangeModal.open();
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
        const vaultChangeModal = new stickerModal(plugin.app, plugin, (emoji) =>
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
  e: React.MouseEvent | React.TouchEvent,
  source = "file-explorer"
) => {
  const spaces = plugin.index.allSpaces();
  const spaceItems = retrieveSpaceItems(plugin, spaces);
  const cache = plugin.index.filesIndex.get(file.path);
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
      menuItem.setIcon("layout-dashboard");
      menuItem.setTitle(t.buttons.createCanvas);
      menuItem.onClick((ev: MouseEvent) => {
        createNewCanvasFile(plugin, file as TFolder, "");
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
    menuItem.setIcon("plus-square");
    menuItem.setTitle("Add to Space");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new AddToSpaceModal(plugin, [file.path]);
      vaultChangeModal.open();
    });
  });
  fileMenu.addItem((menuItem) => {
    menuItem.setIcon("minus-square");
    menuItem.setTitle("Remove from Space");
    menuItem.onClick((ev: MouseEvent) => {
      let vaultChangeModal = new RemoveFromSpaceModal(plugin, file.path);
      vaultChangeModal.open();
    });
  });
  if (isFolder) {
    // Rename Item
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.createFolderSpace);
      menuItem.setIcon("folder-plus");
      menuItem.onClick((ev: MouseEvent) => {
        insertSpaceAtIndex(
          plugin,
          {
            name: file.name,
            pinned: "home",
            def: { type: "focus", folder: file.path, filters: [] },
          },
          0
        );
      });
    });
  }

  if (isFolder && cache) {
    fileMenu.addSeparator();
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.customSort);
      menuItem.setIcon("arrow-up-down");
      menuItem.setChecked(cache.folderSort == "");
      menuItem.onClick((ev: MouseEvent) => {
        saveFolderSort(plugin, file.path, "");
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.sortBy);
      menuItem.setIcon("sort-desc");
      menuItem.onClick((ev: MouseEvent) => {
        const sortMenu = new Menu();

        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.fileNameSortAlphaAsc);
          menuItem.setChecked(cache.folderSort == "path_asc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "path_asc");
          });
        });

        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.fileNameSortAlphaDesc);
          menuItem.setChecked(cache.folderSort == "path_desc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "path_desc");
          });
        });
        sortMenu.addSeparator();
        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.createdTimeSortAsc);
          menuItem.setChecked(cache.folderSort == "ctime_asc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "ctime_asc");
          });
        });

        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.createdTimeSortDesc);
          menuItem.setChecked(cache.folderSort == "ctime_desc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "ctime_desc");
          });
        });
        sortMenu.addSeparator();
        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.modifiedTimeSortAsc);
          menuItem.setChecked(cache.folderSort == "mtime_asc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "mtime_asc");
          });
        });

        sortMenu.addItem((menuItem) => {
          menuItem.setTitle(i18n.menu.modifiedTimeSortDesc);
          menuItem.setChecked(cache.folderSort == "mtime_desc");
          menuItem.onClick((ev: MouseEvent) => {
            saveFolderSort(plugin, file.path, "mtime_desc");
          });
        });
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        if (isMouseEvent(e)) {
          sortMenu.showAtPosition({ x: offset.left, y: offset.top + 30 });
        } else {
          sortMenu.showAtPosition({
            // @ts-ignore
            x: e.nativeEvent.locationX,
            // @ts-ignore
            y: e.nativeEvent.locationY,
          });
        }
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
        const vaultChangeModal = new stickerModal(plugin.app, plugin, (emoji) =>
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
  if (!isFolder) {
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle(t.menu.changeToFolderNote);
      menuItem.setIcon("file-plus-2");
      menuItem.onClick((ev: MouseEvent) => {
        if (file instanceof TFile) noteToFolderNote(plugin, file, true);
      });
    });
  }
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
  plugin.app.workspace.trigger("file-menu", fileMenu, file, source);
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
