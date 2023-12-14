import { default as i18n } from "core/i18n";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { savePathColor } from "core/superstate/utils/label";
import {
  convertPathToSpace,
  hidePath,
  hidePaths,
} from "core/superstate/utils/path";
import { TreeNode, removePathsFromSpace } from "core/superstate/utils/spaces";
import { dropPathsInSpaceAtIndex } from "core/utils/dnd/dropPath";
import {
  removeIconsForPaths,
  removePathIcon,
  saveColorForPaths,
  saveIconsForPaths,
  savePathIcon,
} from "core/utils/emoji";
import React from "react";
import { colors } from "schemas/color";

import { Superstate } from "core/superstate/superstate";
import { deletePath, movePathToSpace } from "core/superstate/utils/path";
import { renamePathWithExtension } from "core/utils/uri";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import {
  SelectOption,
  defaultMenu,
  menuSeparator,
  showDisclosureMenu,
} from "../menu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";

export const triggerMultiPathMenu = (
  superstate: Superstate,
  selectedPaths: TreeNode[],
  e: React.MouseEvent | React.TouchEvent
) => {
  const paths = selectedPaths.map((s) => s.item.path);
  const menuOptions: SelectOption[] = [];

  // Open in a New Pane
  menuOptions.push({
    name: i18n.menu.openFilePane,
    icon: "lucide//go-to-file",
    onClick: (e) => {
      paths.forEach((path) => superstate.ui.openPath(path, true));
    },
  });
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.buttons.addToSpace,
    icon: "lucide//pin",
    onClick: (e) => {
      showSpacesMenu(
        e as any,
        superstate,
        (link) => {
          dropPathsInSpaceAtIndex(
            superstate,
            selectedPaths.map((f) => f.path),
            link,
            -1,
            "link"
          );
        },
        true
      );
    },
  });

  if (superstate.settings.spacesStickers) {
    menuOptions.push(menuSeparator);
    // Rename Item
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
            saveColorForPaths(superstate, paths, values[0]);
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
              saveIconsForPaths(superstate, paths, emoji)
            }
          />
        ));
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "lucide//file-minus",
      onClick: (e) => {
        removeIconsForPaths(superstate, paths);
      },
    });
  }

  menuOptions.push(menuSeparator);

  // Move Item
  menuOptions.push({
    name: i18n.menu.moveFile,
    icon: "lucide//paper-plane",
    onClick: (e) => {
      showSpacesMenu(e, superstate, (link) => {
        paths.forEach((f) => {
          movePathToSpace(superstate, f, link);
        });
      });
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.hide,
    icon: "lucide//eye-off",
    onClick: (e) => {
      hidePaths(superstate, paths);
    },
  });

  // Delete Item
  menuOptions.push({
    name: i18n.menu.delete,
    icon: "lucide//trash",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.deleteFiles,
        (_props: { hide: () => void }) => (
          <ConfirmationModal
            hide={_props.hide}
            confirmAction={() => {
              paths.forEach((f) => {
                deletePath(superstate, f);
              });
            }}
            confirmLabel={i18n.buttons.delete}
            message={i18n.descriptions.deleteFiles.replace(
              "${1}",
              paths.length.toString()
            )}
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

export const showPathContextMenu = (
  superstate: Superstate,
  path: string,
  space: string,
  e: React.MouseEvent | React.TouchEvent
) => {
  const cache = superstate.pathsIndex.get(path);
  const menuOptions: SelectOption[] = [];

  menuOptions.push({
    name: i18n.menu.openFilePane,
    icon: "lucide//go-to-file",
    onClick: (e) => {
      superstate.ui.openPath(path, true);
    },
  });
  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.buttons.addToSpace,
    icon: "lucide//pin",
    onClick: (e) => {
      showSpacesMenu(
        e as any,
        superstate,
        (link) => {
          dropPathsInSpaceAtIndex(superstate, [path], link, -1, "link");
        },
        true
      );
    },
  });

  if (cache.metadata?.file?.extension == "md")
    menuOptions.push({
      name: i18n.menu.changeToFolderNote,
      icon: "lucide//file-plus-2",
      onClick: (e) => {
        convertPathToSpace(superstate, path, false);
      },
    });

  if (space && space != cache.parent) {
    const spaceCache = superstate.spacesIndex.get(space);
    if (spaceCache) {
      menuOptions.push({
        name: i18n.menu.removeFromSpace,
        icon: "lucide//pin-off",
        onClick: (e) => {
          removePathsFromSpace(superstate, spaceCache.path, [path]);
        },
      });
    }
  }

  if (superstate.settings.spacesStickers) {
    menuOptions.push(menuSeparator);
    // Rename Item
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
            savePathColor(superstate, path, values[0]);
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
            selectedSticker={(emoji) => savePathIcon(superstate, path, emoji)}
          />
        ));
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "lucide//file-minus",
      onClick: (e) => {
        removePathIcon(superstate, path);
      },
    });
  }

  menuOptions.push(menuSeparator);
  // Rename Item
  menuOptions.push({
    name: i18n.menu.rename,
    icon: "lucide//pencil",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.rename,
        (_props: { hide: () => void }) => (
          <InputModal
            saveLabel={i18n.buttons.rename}
            value={cache.name}
            hide={_props.hide}
            saveValue={(v) =>
              superstate.spaceManager.renamePath(
                path,
                renamePathWithExtension(path, v)
              )
            }
          ></InputModal>
        )
      );
    },
  });

  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "lucide//documents",
    onClick: (e) => {
      superstate.spaceManager.copyPath(
        path,
        `${cache.parent}/${cache.name} 1.${cache.type}`
      );
    },
  });

  // Move Item
  menuOptions.push({
    name: i18n.menu.moveFile,
    icon: "lucide//paper-plane",
    onClick: (e) => {
      showSpacesMenu(e, superstate, (link) => {
        const item = superstate.pathsIndex.get(path);
        superstate.spaceManager.renamePath(path, link + "/" + item.label.name);
      });
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.revealInDefault,
    icon: "lucide//arrow-up-right",
    onClick: (e) => {
      superstate.ui.openPath(path, "system");
    },
  });
  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.hide,
    icon: "lucide//eye-off",
    onClick: (e) => {
      hidePath(superstate, path);
    },
  });

  menuOptions.push({
    name: i18n.menu.delete,
    icon: "lucide//trash",
    onClick: (e) => {
      deletePath(superstate, path);
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
