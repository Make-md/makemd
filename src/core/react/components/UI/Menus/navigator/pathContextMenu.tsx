import { default as i18n } from "core/i18n";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { savePathColor } from "core/superstate/utils/label";
import {
  convertPathToSpace,
  hidePath,
  hidePaths,
  renamePathByName,
} from "core/superstate/utils/path";
import {
  TreeNode,
  removePathsFromSpace,
  saveSpaceTemplate,
} from "core/superstate/utils/spaces";
import { dropPathsInSpaceAtIndex } from "core/utils/dnd/dropPath";
import {
  removeIconsForPaths,
  removePathIcon,
  saveColorForPaths,
  saveIconsForPaths,
  savePathIcon,
} from "core/utils/emoji";
import React from "react";

import { Superstate } from "core/superstate/superstate";
import { deletePath, movePathToSpace } from "core/superstate/utils/path";
import { isTouchScreen } from "core/utils/ui/screen";
import { movePath } from "core/utils/uri";
import { Anchors, Rect } from "types/Pos";
import { windowFromDocument } from "utils/dom";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import {
  SelectOption,
  SelectOptionType,
  defaultMenu,
  menuSeparator,
} from "../menu/SelectionMenu";
import { showColorPickerMenu } from "../properties/colorPickerMenu";
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
    icon: "ui//go-to-file",
    onClick: (e) => {
      paths.forEach((path) => superstate.ui.openPath(path, true));
    },
  });
  menuOptions.push(menuSeparator);
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
      icon: "ui//palette",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset) => {
        return showColorPickerMenu(
          superstate,
          offset,
          windowFromDocument(e.view.document),
          "",
          (value) => saveColorForPaths(superstate, paths, value)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.changeIcon,
      icon: "ui//sticker",
      onClick: (e) => {
        superstate.ui.openPalette(
          (_props: { hide: () => void }) => (
            <StickerModal
              ui={superstate.ui}
              hide={_props.hide}
              selectedSticker={(emoji) =>
                saveIconsForPaths(superstate, paths, emoji)
              }
            />
          ),
          windowFromDocument(e.view.document)
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "ui//file-minus",
      onClick: (e) => {
        removeIconsForPaths(superstate, paths);
      },
    });
  }

  menuOptions.push(menuSeparator);

  // Move Item
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
          paths.forEach((f) => {
            movePathToSpace(superstate, f, link);
          });
        }
      );
    },
  });

  menuOptions.push(menuSeparator);

  menuOptions.push({
    name: i18n.menu.hide,
    icon: "ui//eye-off",
    onClick: (e) => {
      hidePaths(superstate, paths);
    },
  });

  // Delete Item
  menuOptions.push({
    name: i18n.menu.delete,
    icon: "ui//trash",
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
        ),
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

export const showPathContextMenu = (
  superstate: Superstate,
  path: string,
  space: string,
  rect: Rect,
  win: Window,
  anchor?: Anchors,
  triggerRename?: () => void
) => {
  const cache = superstate.pathsIndex.get(path);
  if (!cache) return;
  const menuOptions: SelectOption[] = [];

  menuOptions.push({
    name: i18n.menu.openFilePane,
    icon: "ui//go-to-file",
    onClick: (e) => {
      superstate.ui.openPath(path, true);
    },
  });
  menuOptions.push(menuSeparator);

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
          dropPathsInSpaceAtIndex(superstate, [path], link, -1, "link");
        },
        true
      );
    },
  });

  if (cache.type == "file" && cache.subtype == "md")
    menuOptions.push({
      name: i18n.menu.changeToFolderNote,
      icon: "ui//file-plus-2",
      onClick: (e) => {
        convertPathToSpace(superstate, path, false);
      },
    });

  menuOptions.push({
    name: "Save as Template",
    icon: "ui//clipboard-add",
    onClick: (e) => {
      saveSpaceTemplate(superstate, path, space);
    },
  });

  if (space && space != cache.parent) {
    const spaceCache = superstate.spacesIndex.get(space);
    if (spaceCache) {
      menuOptions.push({
        name: i18n.menu.removeFromSpace,
        icon: "ui//pin-off",
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
      icon: "ui//palette",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset) => {
        return showColorPickerMenu(superstate, offset, win, "", (value) =>
          savePathColor(superstate, path, value)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.changeIcon,
      icon: "ui//sticker",
      onClick: (e) => {
        superstate.ui.openPalette(
          (_props: { hide: () => void }) => (
            <StickerModal
              ui={superstate.ui}
              hide={_props.hide}
              selectedSticker={(emoji) => savePathIcon(superstate, path, emoji)}
            />
          ),
          windowFromDocument(e.view.document)
        );
      },
    });
    menuOptions.push({
      name: i18n.buttons.removeIcon,
      icon: "ui//file-minus",
      onClick: (e) => {
        removePathIcon(superstate, path);
      },
    });
  }

  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.rename,
    icon: "ui//edit",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.rename,
        (_props: { hide: () => void }) => (
          <InputModal
            saveLabel={i18n.buttons.rename}
            value={cache.name}
            hide={_props.hide}
            saveValue={(v) => renamePathByName(superstate, path, v)}
          ></InputModal>
        ),
        windowFromDocument(e.view.document)
      );
    },
  });

  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "ui//documents",
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
    icon: "ui//paper-plane",
    onClick: (e) => {
      const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
      showSpacesMenu(
        offset,
        windowFromDocument(e.view.document),
        superstate,
        (link) => {
          const item = superstate.pathsIndex.get(path);
          superstate.spaceManager.renamePath(path, movePath(path, link));
        }
      );
    },
  });

  menuOptions.push(menuSeparator);
  if (!isTouchScreen(superstate.ui)) {
    menuOptions.push({
      name:
        superstate.ui.getOS() == "mac"
          ? i18n.menu.revealInDefault
          : i18n.menu.revealInExplorer,
      icon: "ui//arrow-up-right",
      onClick: (e) => {
        superstate.ui.openPath(path, "system");
      },
    });
    menuOptions.push(menuSeparator);
  }

  menuOptions.push({
    name: i18n.menu.hide,
    icon: "ui//eye-off",
    onClick: (e) => {
      hidePath(superstate, path);
    },
  });

  menuOptions.push({
    name: i18n.menu.delete,
    icon: "ui//trash",
    onClick: (e) => {
      deletePath(superstate, path);
    },
  });

  superstate.ui.openMenu(
    rect,
    defaultMenu(superstate.ui, menuOptions),
    win,
    anchor
  );

  return false;
};
