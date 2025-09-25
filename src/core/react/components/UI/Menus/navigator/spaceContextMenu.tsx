import { savePathColor } from "core/superstate/utils/label";
import { hidePath, renamePathByName } from "core/superstate/utils/path";
import {
  addPathToSpaceAtIndex,
  removePathsFromSpace,
  removeSpace,
  saveSpaceTemplate,
  updateSpaceSort,
} from "core/superstate/utils/spaces";
import { removePathIcon } from "core/utils/emoji";
import { isTouchScreen } from "core/utils/ui/screen";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import React from "react";
import StickerModal from "shared/components/StickerModal";
import { default as i18n } from "shared/i18n";
import { PathState } from "shared/types/PathState";
import { SpaceSort } from "shared/types/spaceDef";
import { FilesystemSpaceInfo } from "shared/types/spaceInfo";
import { windowFromDocument } from "shared/utils/dom";
import { savePathSticker } from "shared/utils/sticker";
import { movePath } from "shared/utils/uri";
import { stringFromTag } from "utils/tags";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import { InputModal } from "../../Modals/InputModal";
import { openContextCreateItemModal } from "../../Modals/ContextCreateItemModal";
import { defaultMenu, menuSeparator } from "../menu/SelectionMenu";
import { showColorPickerMenu } from "../properties/colorPickerMenu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";
import { showApplyItemsMenu } from "./showApplyItemsMenu";
import { showSpaceAddMenu } from "./showSpaceAddMenu";

export const showSpaceContextMenu = (
  superstate: Superstate,
  path: PathState,
  e: React.MouseEvent | React.TouchEvent,
  activePath: string,
  parentSpace?: string,
  onClose?: () => void
) => {
  const space = superstate.spacesIndex.get(path.path);
  if (!space) return;
  const menuOptions: SelectOption[] = [];
  menuOptions.push({
    name: i18n.menu.openFilePane,
    icon: "ui//go-to-file",
    onClick: (e) => {
      superstate.ui.openPath(path.path, true);
    },
  });
  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: "New",
    type: SelectOptionType.Submenu,
    onSubmenu: (offset) => {
      return showSpaceAddMenu(
        superstate,
        offset,
        windowFromDocument(e.view.document),
        space,
        false,
        true
      );
    },
    icon: "ui//plus",
  });

  menuOptions.push(menuSeparator);

  menuOptions.push(menuSeparator);
  if (superstate.settings.spacesStickers) {
    menuOptions.push({
      name: i18n.menu.changeColor,
      icon: "ui//palette",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset) => {
        return showColorPickerMenu(
          superstate,
          offset,
          windowFromDocument(e.view.document),
          "",
          (value) => savePathColor(superstate, space.path, value),
          false,
          true
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.changeIcon,
      icon: "ui//sticker",
      onClick: (e) => {
        superstate.ui.openPalette(
          <StickerModal
            ui={superstate.ui}
            selectedSticker={(emoji) =>
              savePathSticker(superstate, space.path, emoji)
            }
          />,
          windowFromDocument(e.view.document)
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "ui//file-minus",
      onClick: (e) => {
        removePathIcon(superstate, space.path);
      },
    });
  }
  if (space.metadata?.sort) {
    menuOptions.push(menuSeparator);

    menuOptions.push({
      name: i18n.menu.sortBy,
      icon: "ui//sort-desc",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset) => {
        const sortOptions: SelectOption[] = [];
        sortOptions.push({
          name: i18n.menu.groupSpaces,
          icon: "ui//arrow-up-down",
          value: space.metadata.sort.group == true,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, {
              field: space.metadata.sort.field,
              asc: space.metadata.sort.asc,
              group: !space.metadata.sort.group,
              recursive: space.metadata.sort.recursive,
            });
          },
        });
        sortOptions.push(menuSeparator);
        sortOptions.push({
          name: i18n.menu.recursiveSort,
          icon: "ui//arrow-up-down",
          value: space.metadata.sort.recursive == true,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, {
              field: space.metadata.sort.field,
              asc: space.metadata.sort.asc,
              group: space.metadata.sort.group,
              recursive: !space.metadata.sort.recursive,
            });
          },
        });
        sortOptions.push(menuSeparator);
        const rankSortOption: SpaceSort = {
          field: "rank",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.customSort,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == rankSortOption.field &&
            space.metadata.sort.asc == rankSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, rankSortOption);
          },
        });
        sortOptions.push(menuSeparator);
        const nameSortOption: SpaceSort = {
          field: "name",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.fileNameSortAlphaAsc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == nameSortOption.field &&
            space.metadata.sort.asc == nameSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, nameSortOption);
          },
        });
        const nameSortOptionDesc: SpaceSort = {
          field: "name",
          asc: false,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.fileNameSortAlphaDesc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == nameSortOptionDesc.field &&
            space.metadata.sort.asc == nameSortOptionDesc.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, nameSortOptionDesc);
          },
        });
        sortOptions.push(menuSeparator);
        const numberSortOption: SpaceSort = {
          field: "number",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.fileNameSortNumericalAsc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == numberSortOption.field &&
            space.metadata.sort.asc == numberSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, numberSortOption);
          },
        });
        const numberSortOptionDesc: SpaceSort = {
          field: "number",
          asc: false,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.fileNameSortNumericalDesc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == numberSortOptionDesc.field &&
            space.metadata.sort.asc == numberSortOptionDesc.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, numberSortOptionDesc);
          },
        });
        sortOptions.push(menuSeparator);
        const createdTimeSortOption: SpaceSort = {
          field: "ctime",
          asc: false,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.createdTimeSortAsc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == createdTimeSortOption.field &&
            space.metadata.sort.asc == createdTimeSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, createdTimeSortOption);
          },
        });
        const createdTimeSortOptionDesc: SpaceSort = {
          field: "ctime",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.createdTimeSortDesc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == createdTimeSortOptionDesc.field &&
            space.metadata.sort.asc == createdTimeSortOptionDesc.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, createdTimeSortOptionDesc);
          },
        });
        sortOptions.push(menuSeparator);
        const modifiedTimeSortOption: SpaceSort = {
          field: "mtime",
          asc: false,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.modifiedTimeSortAsc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == modifiedTimeSortOption.field &&
            space.metadata.sort.asc == modifiedTimeSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, modifiedTimeSortOption);
          },
        });
        const modifiedTimeSortOptionDesc: SpaceSort = {
          field: "mtime",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.modifiedTimeSortDesc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == modifiedTimeSortOptionDesc.field &&
            space.metadata.sort.asc == modifiedTimeSortOptionDesc.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, modifiedTimeSortOptionDesc);
          },
        });

        sortOptions.push(menuSeparator);
        const sizeSortOption: SpaceSort = {
          field: "size",
          asc: false,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.sizeSortAsc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == sizeSortOption.field &&
            space.metadata.sort.asc == sizeSortOption.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, sizeSortOption);
          },
        });
        const sizeSortOptionDesc: SpaceSort = {
          field: "size",
          asc: true,
          group: space.metadata.sort.group,
          recursive: space.metadata.sort.recursive,
        };
        sortOptions.push({
          name: i18n.menu.sizeSortDesc,
          icon: "ui//arrow-up-down",
          value:
            space.metadata.sort.field == sizeSortOptionDesc.field &&
            space.metadata.sort.asc == sizeSortOptionDesc.asc,
          type: SelectOptionType.Radio,
          onClick: (e) => {
            updateSpaceSort(superstate, space.path, sizeSortOptionDesc);
          },
        });

        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, sortOptions),
          windowFromDocument(e.view.document)
        );
      },
    });
  }
  menuOptions.push({
    name: i18n.menu.applyItems,
    icon: "ui//apply-items",
    value: "apply-all",
    type: SelectOptionType.Submenu,
    onSubmenu: (offset) =>
      showApplyItemsMenu(
        offset,
        superstate,
        space,
        windowFromDocument(e.view.document)
      ),
  });

  if (superstate.ui.hasNativePathMenu(space.path)) {
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.menu.openNativeMenu,
      icon: "ui//options",
      onClick: (e) => {
        superstate.ui.nativePathMenu(e, space.path);
      },
    });
  }
  if (space.type != "default") {
    menuOptions.push(menuSeparator);

    menuOptions.push({
      name: i18n.menu.rename,
      icon: "ui//edit",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.rename,
          <InputModal
            saveLabel={i18n.buttons.rename}
            value={space.type == "tag" ? stringFromTag(space.name) : space.name}
            saveValue={(v) => renamePathByName(superstate, space.path, v)}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      },
    });

    // Edit Properties option - for spaces with context data
    const contextInfo = superstate.contextsIndex.get(space.path);
    if (contextInfo && contextInfo.contextTable) {
      menuOptions.push({
        name: i18n.menu.editProperties || "Edit Properties",
        icon: "ui//list",
        onClick: async (e) => {
          // Get the context table from spaceManager
          const contextTable = await superstate.spaceManager.readTable(space.path, "context");
          
          if (contextTable && contextTable.rows) {
            // Find the row index for this space path
            const rowIndex = contextTable.rows.findIndex(
              row => row["File"] === space.path || row["_path"] === space.path
            );
            
            if (rowIndex >= 0) {
              // Open the modal in edit mode
              openContextCreateItemModal(
                superstate,
                space.path,
                "context", // context schema
                undefined, // frameSchema
                windowFromDocument(e.view.document),
                rowIndex, // Row index for edit mode
                contextTable.rows[rowIndex] // Current row data
              );
            } else {
              // If space not found in context, open in create mode with path pre-filled
              openContextCreateItemModal(
                superstate,
                space.path,
                "context",
                undefined,
                windowFromDocument(e.view.document),
                -1, // New item mode
                { File: space.path, _path: space.path } // Pre-fill with path
              );
            }
          }
        },
      });
    }
  }

  const parentSpaceCache = superstate.spacesIndex.get(parentSpace);
  if (
    parentSpaceCache &&
    (parentSpaceCache.type == "folder" || parentSpaceCache.type == "vault")
  ) {
    if (parentSpace != path.parent) {
      const spaceCache = superstate.spacesIndex.get(parentSpace);
      if (spaceCache) {
        menuOptions.push({
          name: i18n.menu.removeFromSpace.replace("${1}", spaceCache.name),
          icon: "ui//pin-off",
          onClick: (e) => {
            removePathsFromSpace(superstate, spaceCache.path, [space.path]);
          },
        });
      }
    }
  }
  if (onClose) {
    menuOptions.push({
      name: i18n.menu.closeSpace,
      icon: "ui//close",
      onClick: (e) => {
        onClose();
      },
    });
  }
  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.buttons.addToSpace,
      icon: "ui//pin",
      onClick: (e) => {
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showSpacesMenu(
          offset,
          windowFromDocument(e.view.document),
          superstate,
          (link) => {
            const spaceCache = superstate.spacesIndex.get(link);
            if (spaceCache)
              addPathToSpaceAtIndex(superstate, spaceCache, space.path, -1);
          },
          true
        );
      },
    });
  }

  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.menu.moveFile,
      icon: "ui//paper-plane",
      onClick: (e) => {
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showSpacesMenu(
          offset,
          windowFromDocument(e.view.document),
          superstate,
          (link) => {
            superstate.spaceManager.renameSpace(
              space.path,
              movePath(space.path, link)
            );
          }
        );
      },
    });
  }

  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "ui//documents",
    onClick: (e) => {
      superstate.spaceManager.copyPath(path.path, `${path.parent}`);
    },
  });
  if (
    parentSpaceCache &&
    (parentSpaceCache.type == "folder" || parentSpaceCache.type == "vault")
  ) {
    menuOptions.push({
      name: i18n.buttons.saveTemplate,
      icon: "ui//clipboard-add",
      onClick: (e) => {
        saveSpaceTemplate(superstate, space.path, parentSpace);
      },
    });
  }

  menuOptions.push(menuSeparator);
  if (!isTouchScreen(superstate.ui)) {
    menuOptions.push({
      name:
        superstate.ui.getOS() == "mac"
          ? i18n.menu.revealInDefault
          : i18n.menu.revealInExplorer,
      icon: "ui//arrow-up-right",
      onClick: (e) => {
        superstate.ui.openPath(
          (space.space as FilesystemSpaceInfo).folderPath,
          "system"
        );
      },
    });
  }
  menuOptions.push(menuSeparator);
  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.menu.hide,
      icon: "ui//eye-off",
      onClick: (e) => {
        hidePath(superstate, space.path);
      },
    });
  }

  if (space.type == "folder" || space.type == "tag")
    menuOptions.push({
      name: i18n.menu.delete,
      icon: "ui//trash",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.deleteSpace,
          <ConfirmationModal
            confirmAction={() => removeSpace(superstate, space.path)}
            confirmLabel={i18n.buttons.delete}
            message={i18n.descriptions.deleteSpace}
          ></ConfirmationModal>,
          windowFromDocument(e.view.document)
        );
      },
    });

  superstate.ui.openMenu(
    (e.target as HTMLElement).getBoundingClientRect(),
    defaultMenu(superstate.ui, menuOptions),
    windowFromDocument(e.view.document)
  );

  return false;
};
