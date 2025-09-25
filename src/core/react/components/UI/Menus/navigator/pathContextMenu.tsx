import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { openContextCreateItemModal } from "core/react/components/UI/Modals/ContextCreateItemModal";
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
  removePathIcon,
  saveColorForPaths,
  saveIconsForPaths,
  savePathIcon,
} from "core/utils/emoji";
import React from "react";
import StickerModal from "shared/components/StickerModal";
import { default as i18n } from "shared/i18n";
import { removeIconsForPaths } from "shared/utils/sticker";

import { deletePath, movePathToSpace } from "core/superstate/utils/path";
import { isTouchScreen } from "core/utils/ui/screen";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import { Anchors, Rect } from "shared/types/Pos";
import { windowFromDocument } from "shared/utils/dom";
import { movePath } from "shared/utils/uri";
import { ConfirmationModal } from "../../Modals/ConfirmationModal";
import { defaultMenu, menuSeparator } from "../menu/SelectionMenu";
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
          (value) => saveColorForPaths(superstate, paths, value),
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
              saveIconsForPaths(superstate, paths, emoji)
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
        <ConfirmationModal
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

export const showPathContextMenu = (
  superstate: Superstate,
  path: string,
  space: string,
  rect: Rect,
  win: Window,
  anchor?: Anchors,
  onClose?: () => void
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

  if (onClose) {
    menuOptions.push({
      name: i18n.menu.closeSpace,
      icon: "ui//close",
      onClick: (e) => {
        onClose();
      },
    });
    menuOptions.push(menuSeparator);
  }

  if (space && space != cache.parent) {
    const spaceCache = superstate.spacesIndex.get(space);
    if (spaceCache) {
      menuOptions.push({
        name: i18n.menu.removeFromSpace.replace("${1}", spaceCache.name),
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
        return showColorPickerMenu(
          superstate,
          offset,
          win,
          "",
          (value) => savePathColor(superstate, path, value),
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
            selectedSticker={(emoji) => savePathIcon(superstate, path, emoji)}
          />,
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
  if (superstate.ui.hasNativePathMenu(path)) {
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: i18n.menu.openNativeMenu,
      icon: "ui//options",
      onClick: (e) => {
        superstate.ui.nativePathMenu(e, path);
      },
    });
  }

  menuOptions.push(menuSeparator);

  if (cache.type == "file" && cache.subtype == "md")
    menuOptions.push({
      name: i18n.menu.changeToFolderNote,
      icon: "ui//file-plus-2",
      onClick: (e) => {
        convertPathToSpace(superstate, path, false);
      },
    });

  menuOptions.push({
    name: i18n.menu.rename,
    icon: "ui//edit",
    onClick: (e) => {
      superstate.ui.openModal(
        i18n.labels.rename,
        <InputModal
          saveLabel={i18n.buttons.rename}
          value={cache.name}
          saveValue={(v) => renamePathByName(superstate, path, v)}
        ></InputModal>,
        windowFromDocument(e.view.document)
      );
    },
  });

  // Edit Properties option - only show when a context space is provided
  if (space) {
    // Get context from contextsIndex through spaceManager
    const contextInfo = superstate.contextsIndex.get(space);
    
    // Only show if the space has context data
    if (contextInfo && contextInfo.contextTable) {
      menuOptions.push({
        name: i18n.menu.editProperties || "Edit Properties",
        icon: "ui//list",
        onClick: async (e) => {
          // Get the context table from spaceManager
          const contextTable = await superstate.spaceManager.readTable(space, "context");
          
          if (contextTable && contextTable.rows) {
            // Find the row index for this path
            const rowIndex = contextTable.rows.findIndex(
              row => row["File"] === path || row["_path"] === path
            );
            
            if (rowIndex >= 0) {
              // Open the modal in edit mode
              openContextCreateItemModal(
                superstate,
                space,
                "context", // context schema
                undefined, // frameSchema
                windowFromDocument(e.view.document),
                rowIndex, // Row index for edit mode
                contextTable.rows[rowIndex] // Current row data
              );
            } else {
              // If path not found in context, open in create mode with path pre-filled
              openContextCreateItemModal(
                superstate,
                space,
                "context",
                undefined,
                windowFromDocument(e.view.document),
                -1, // New item mode
                { File: path, _path: path } // Pre-fill with path
              );
            }
          }
        },
      });
    }
  }

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

  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "ui//documents",
    onClick: (e) => {
      superstate.spaceManager.copyPath(
        path,
        `${cache.parent}`,
        `${cache.name}`
      );
    },
  });

  menuOptions.push({
    name: i18n.buttons.saveTemplate,
    icon: "ui//clipboard-add",
    onClick: (e) => {
      saveSpaceTemplate(superstate, path, space);
    },
  });

  // Move Item

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
