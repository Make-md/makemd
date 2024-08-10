import { default as i18n } from "core/i18n";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { Superstate } from "core/superstate/superstate";
import { savePathColor, savePathSticker } from "core/superstate/utils/label";
import { hidePath, renamePathByName } from "core/superstate/utils/path";
import {
  addPathToSpaceAtIndex,
  pinPathToSpaceAtIndex,
  removePathsFromSpace,
  removeSpace,
  saveSpaceTemplate,
  updateSpaceSort,
} from "core/superstate/utils/spaces";
import { SpaceSort } from "core/types/space";
import { PathState } from "core/types/superstate";
import { removePathIcon } from "core/utils/emoji";
import { isTouchScreen } from "core/utils/ui/screen";
import { movePath } from "core/utils/uri";
import React from "react";
import { windowFromDocument } from "utils/dom";
import { stringFromTag } from "utils/tags";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import { InputModal } from "../../Modals/InputModal";
import {
  SelectOption,
  SelectOptionType,
  defaultMenu,
  menuSeparator,
} from "../menu/SelectionMenu";
import { showColorPickerMenu } from "../properties/colorPickerMenu";
import { showLinkMenu } from "../properties/linkMenu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";
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

  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.buttons.addIntoSpace,
      icon: "ui//pin",
      onClick: (e) => {
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showLinkMenu(
          offset,
          windowFromDocument(e.view.document),
          superstate,
          (link) => {
            pinPathToSpaceAtIndex(superstate, space, link);
          }
        );
        e.stopPropagation();
      },
    });
  }
  menuOptions.push(menuSeparator);

  if (onClose) {
    menuOptions.push({
      name: i18n.menu.closeSpace,
      icon: "ui//close",
      onClick: (e) => {
        onClose();
      },
    });
  }
  menuOptions.push(menuSeparator);

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
    menuOptions.push(menuSeparator);
  }

  const parentSpaceCache = superstate.spacesIndex.get(parentSpace);
  if (
    parentSpaceCache &&
    (parentSpaceCache.type == "folder" || parentSpaceCache.type == "vault")
  ) {
    menuOptions.push({
      name: "Save as Template",
      icon: "ui//clipboard-add",
      onClick: (e) => {
        saveSpaceTemplate(superstate, space.path, parentSpace);
      },
    });

    if (parentSpace != path.parent) {
      const spaceCache = superstate.spacesIndex.get(parentSpace);
      if (spaceCache) {
        menuOptions.push({
          name: i18n.menu.removeFromSpace,
          icon: "ui//pin-off",
          onClick: (e) => {
            removePathsFromSpace(superstate, spaceCache.path, [space.path]);
          },
        });
      }
    }
  }

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
          name: i18n.menu.recurisveSort,
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
  }
  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "ui//documents",
    onClick: (e) => {
      superstate.spaceManager.copyPath(path.path, `${path.parent}`);
    },
  });
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
          space.type == "folder"
            ? space.path
            : `${superstate.settings.spacesFolder}/${space.name}`,
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
