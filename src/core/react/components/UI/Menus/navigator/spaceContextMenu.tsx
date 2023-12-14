import { default as i18n } from "core/i18n";
import SpaceEditor from "core/react/components/Navigator/SpaceEditor";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import { savePathColor, savePathSticker } from "core/superstate/utils/label";
import { hidePath } from "core/superstate/utils/path";
import {
  addPathToSpaceAtIndex,
  newPathInSpace,
  pinPathToSpaceAtIndex,
  removePathsFromSpace,
  removeSpace,
  toggleWaypoint,
  updateSpaceSort,
} from "core/superstate/utils/spaces";
import { SpaceSort } from "core/types/space";
import { PathState } from "core/types/superstate";
import { removePathIcon } from "core/utils/emoji";
import React from "react";
import { colors } from "schemas/color";
import { renameTag } from "utils/tags";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import {
  SelectOption,
  SelectOptionType,
  defaultMenu,
  menuSeparator,
  showDisclosureMenu,
} from "../menu";
import { showLinkMenu } from "../properties/linkMenu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";

export const triggerSpaceMenu = (
  superstate: Superstate,
  path: PathState,
  e: React.MouseEvent | React.TouchEvent,
  activePath: string,
  parentSpace: string
) => {
  const space = superstate.spacesIndex.get(path.path);
  if (!space) return;
  const menuOptions: SelectOption[] = [];
  menuOptions.push({
    name: i18n.buttons.createNote,
    icon: "lucide//edit",
    onClick: (e) => {
      newPathInSpace(superstate, space, "md", null);
    },
  });
  menuOptions.push({
    name: i18n.buttons.createCanvas,
    icon: "lucide//layout-dashboard",
    onClick: (e) => {
      newPathInSpace(superstate, space, "canvas", null);
    },
  });
  menuOptions.push({
    name: i18n.buttons.createFolder,
    icon: "lucide//folder-plus",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.createSection,
        (props: { hide: () => void }) => (
          <SpaceEditor
            superstate={superstate}
            space={null}
            parent={space}
            metadata={null}
            close={props.hide}
          ></SpaceEditor>
        )
      );
    },
  });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.buttons.addIntoSpace,
    icon: "lucide//pin",
    onClick: (e) => {
      showLinkMenu(e, superstate, (link) => {
        pinPathToSpaceAtIndex(superstate, space, link);
      });
    },
  });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.revealInDefault,
    icon: "lucide//arrow-up-right",
    onClick: (e) => {
      superstate.ui.openPath(
        space.type == "folder"
          ? space.path
          : `${superstate.settings.spacesFolder}/${space.name}`,
        "system"
      );
    },
  });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.buttons.addToSpace,
    icon: "lucide//pin",
    onClick: (e) => {
      showSpacesMenu(
        e,
        superstate,
        (link) => {
          addPathToSpaceAtIndex(superstate, space, link, -1);
        },
        true
      );
    },
  });
  if (parentSpace && parentSpace != path.parent) {
    const spaceCache = superstate.spacesIndex.get(parentSpace);
    if (spaceCache) {
      menuOptions.push({
        name: i18n.menu.removeFromSpace,
        icon: "lucide//pin-off",
        onClick: (e) => {
          removePathsFromSpace(superstate, spaceCache.path, [space.path]);
        },
      });
    }
  }
  if (parentSpace == "spaces://$waypoints") {
    menuOptions.push({
      name: i18n.menu.removeFromWaypoints,
      icon: "lucide//pin-off",
      onClick: (e) => {
        toggleWaypoint(superstate, space.path, true);
      },
    });
  }
  menuOptions.push(menuSeparator);
  if (superstate.settings.spacesStickers) {
    menuOptions.push({
      name: i18n.menu.changeColor,
      icon: "lucide//palette",
      onClick: (e) => {
        showDisclosureMenu(
          superstate.ui,
          e,
          false,
          false,
          "",
          [
            { name: i18n.labels.none, value: "" },
            ...colors.map((f) => ({ name: f[0], value: f[1] })),
          ],
          (_, values) => {
            savePathColor(superstate, space.path, values[0]);
          }
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.changeIcon,
      icon: "lucide//sticker",
      onClick: (e) => {
        superstate.ui.openPalette((_props: { hide: () => void }) => (
          <StickerModal
            ui={superstate.ui}
            hide={_props.hide}
            selectedSticker={(emoji) =>
              savePathSticker(superstate, space.path, emoji)
            }
          />
        ));
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "lucide//file-minus",
      onClick: (e) => {
        removePathIcon(superstate, space.path);
      },
    });
  }
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.sortBy,
    icon: "lucide//sort-desc",
    onClick: (e) => {
      const sortOptions: SelectOption[] = [];
      sortOptions.push({
        name: i18n.menu.groupSpaces,
        icon: "lucide//arrow-up-down",
        value: space.metadata.sort.group == true,
        type: SelectOptionType.Radio,
        onClick: (e) => {
          updateSpaceSort(superstate, space.path, {
            field: space.metadata.sort.field,
            asc: space.metadata.sort.asc,
            group: !space.metadata.sort.group,
          });
        },
      });
      sortOptions.push(menuSeparator);
      const rankSortOption: SpaceSort = {
        field: "rank",
        asc: true,
        group: space.metadata.sort.group,
      };
      sortOptions.push({
        name: i18n.menu.customSort,
        icon: "lucide//arrow-up-down",
        value:
          space.metadata.sort.field == rankSortOption.field &&
          space.metadata.sort.asc == rankSortOption.asc,
        type: SelectOptionType.Radio,
        onClick: (e) => {
          updateSpaceSort(superstate, space.path, rankSortOption);
        },
      });
      const nameSortOption: SpaceSort = {
        field: "name",
        asc: true,
        group: space.metadata.sort.group,
      };
      sortOptions.push({
        name: i18n.menu.fileNameSortAlphaAsc,
        icon: "lucide//arrow-up-down",
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
      };
      sortOptions.push({
        name: i18n.menu.fileNameSortAlphaDesc,
        icon: "lucide//arrow-up-down",
        value:
          space.metadata.sort.field == nameSortOptionDesc.field &&
          space.metadata.sort.asc == nameSortOptionDesc.asc,
        type: SelectOptionType.Radio,
        onClick: (e) => {
          updateSpaceSort(superstate, space.path, nameSortOptionDesc);
        },
      });
      sortOptions.push(menuSeparator);
      const createdTimeSortOption: SpaceSort = {
        field: "ctime",
        asc: false,
        group: space.metadata.sort.group,
      };
      sortOptions.push({
        name: i18n.menu.createdTimeSortAsc,
        icon: "lucide//arrow-up-down",
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
      };
      sortOptions.push({
        name: i18n.menu.createdTimeSortDesc,
        icon: "lucide//arrow-up-down",
        value:
          space.metadata.sort.field == createdTimeSortOptionDesc.field &&
          space.metadata.sort.asc == createdTimeSortOptionDesc.asc,
        type: SelectOptionType.Radio,
        onClick: (e) => {
          updateSpaceSort(superstate, space.path, createdTimeSortOptionDesc);
        },
      });
      const offset = (e.target as HTMLElement).getBoundingClientRect();
      superstate.ui.openMenu(
        { x: offset.left, y: offset.top + 30 },
        defaultMenu(superstate.ui, sortOptions)
      );
    },
  });

  menuOptions.push(menuSeparator);
  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.menu.edit,
      icon: "lucide//pencil",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.renameSection,
          (props: { hide: () => void }) => (
            <SpaceEditor
              superstate={superstate}
              space={space}
              metadata={space.metadata}
              close={props.hide}
            ></SpaceEditor>
          )
        );
      },
    });
  } else if (space.type == "tag") {
    menuOptions.push({
      name: i18n.menu.rename,
      icon: "lucide//pencil",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.rename,
          (_props: { hide: () => void }) => (
            <InputModal
              saveLabel={i18n.buttons.rename}
              value={space.name}
              hide={_props.hide}
              saveValue={(v) => renameTag(superstate, space.name, v)}
            ></InputModal>
          )
        );
      },
    });
  }
  if (space.type == "folder") {
    menuOptions.push({
      name: i18n.menu.hide,
      icon: "lucide//eye-off",
      onClick: (e) => {
        hidePath(superstate, space.path);
      },
    });
  }

  if (parentSpace && parentSpace != path.parent) {
  }

  // Delete Item
  else if (space.type == "folder" || space.type == "tag")
    menuOptions.push({
      name: i18n.menu.delete,
      icon: "lucide//trash",
      onClick: (e) => {
        superstate.ui.openModal(
          i18n.labels.deleteSpace,
          (_props: { hide: () => void }) => (
            <ConfirmationModal
              hide={_props.hide}
              confirmAction={() => removeSpace(superstate, space.path)}
              confirmLabel={i18n.buttons.delete}
              message={i18n.descriptions.deleteSpace}
            ></ConfirmationModal>
          )
        );
      },
    });

  superstate.ui.openMenu(
    isMouseEvent(e)
      ? { x: e.pageX, y: e.pageY }
      : {
          // @ts-ignore
          x: e.nativeEvent.locationX,
          // @ts-ignore
          y: e.nativeEvent.locationY,
        },
    defaultMenu(superstate.ui, menuOptions)
  );

  return false;
};
