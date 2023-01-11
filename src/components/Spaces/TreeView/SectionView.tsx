import classNames from "classnames";
import {
  VaultChangeModal
} from "components/ui/modals/vaultChangeModals";
import "css/SectionView.css";
import { Menu } from "obsidian";
import React, { forwardRef } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { eventTypes } from "types/types";

import {
  IndicatorState,
  TreeItemProps
} from "components/Spaces/TreeView/FolderTreeView";
import { triggerSectionMenu } from "components/ui/menus/fileMenu";
import { isMouseEvent } from "hooks/useLongPress";
import t from "i18n";
import { unifiedToNative } from "utils/emoji";
import {
  createNewMarkdownFile,
  defaultNoteFolder,
  getFolderFromPath
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { addPathsToSpace } from "utils/spaces/spaces";
import i18n from "i18n";

export const SectionItem = forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      childCount,
      clone,
      data,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      style,
      onCollapse,
      wrapperRef,
      plugin,
      disabled,
    },
    ref
  ) => {
    const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
    const [spaces, setSpaces] = useRecoilState(recoilState.spaces);
    const space = spaces.find((f) => f.name == data.space);
    const newFolderInSection = () => {
      let vaultChangeModal = new VaultChangeModal(
        plugin,
        space?.def?.length > 0
          ? getFolderFromPath(app, space.def)
          : defaultNoteFolder(plugin, activeFile),
        "create folder",
        data.space
      );
      vaultChangeModal.open();
    };
    const newFileInSection = async () => {
      const newFile = await createNewMarkdownFile(
        plugin,
        space?.def?.length > 0
          ? getFolderFromPath(app, space.def)
          : defaultNoteFolder(plugin, activeFile),
        ""
      );
      if (data.space != "/")
        addPathsToSpace(plugin, data.space, [newFile.path]);
    };

    const triggerMenu = (e: React.MouseEvent | React.TouchEvent) => {
      data.space == "/"
        ? triggerVaultMenu(e)
        : triggerSectionMenu(plugin, data.space, spaces, e);
    };

    const triggerVaultMenu = (e: React.MouseEvent | React.TouchEvent) => {
      const refreshFileList = () => {
        let event = new CustomEvent(eventTypes.vaultChange);
        window.dispatchEvent(event);
      };

      const fileMenu = new Menu();

      // Rename Item
      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.collapseAll);
        menuItem.setIcon("lucide-chevrons-down-up");
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.expandedFolders = {
            ...plugin.settings.expandedFolders,
            "/": [],
          };
          plugin.saveSettings();
        });
      });
      fileMenu.addSeparator();

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.customSort);
        menuItem.setChecked(plugin.settings.vaultSort[0] == "rank");
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.vaultSort = ["rank", true];
          plugin.saveSettings();
          refreshFileList();
        });
      });
      fileMenu.addSeparator();

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.fileNameSortAlphaAsc);
        menuItem.setChecked(
          plugin.settings.vaultSort[0] == "path" &&
            plugin.settings.vaultSort[1] == true
        );
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.vaultSort = ["path", true];
          plugin.saveSettings();
          refreshFileList();
        });
      });

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.fileNameSortAlphaDesc);
        menuItem.setChecked(
          plugin.settings.vaultSort[0] == "path" &&
            plugin.settings.vaultSort[1] == false
        );
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.vaultSort = ["path", false];
          plugin.saveSettings();
          refreshFileList();
        });
      });
      fileMenu.addSeparator();

      // fileMenu.addItem((menuItem) => {
      //   menuItem.setTitle('Modified Time (new to old)');
      //   menuItem.setChecked(plugin.settings.vaultSort[0] == 'mtime' && plugin.settings.vaultSort[1] == true)
      //   menuItem.onClick((ev: MouseEvent) => {
      //     plugin.settings.vaultSort = ['mtime', true];
      //     plugin.saveSettings();
      //     refreshFileList();
      //   });
      // });

      // fileMenu.addItem((menuItem) => {
      //   menuItem.setTitle('Modified Time (old to new)');
      //   menuItem.setChecked(plugin.settings.vaultSort[0] == 'mtime' && plugin.settings.vaultSort[1] == false)
      //   menuItem.onClick((ev: MouseEvent) => {
      //     plugin.settings.vaultSort = ['mtime', false];
      //     plugin.saveSettings();
      //     refreshFileList();
      //   });
      // });

      // fileMenu.addSeparator();

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.createdTimeSortAsc);
        menuItem.setChecked(
          plugin.settings.vaultSort[0] == "created" &&
            plugin.settings.vaultSort[1] == false
        );
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.vaultSort = ["created", false];
          plugin.saveSettings();
          refreshFileList();
        });
      });

      fileMenu.addItem((menuItem) => {
        menuItem.setTitle(i18n.menu.createdTimeSortDesc);
        menuItem.setChecked(
          plugin.settings.vaultSort[0] == "created" &&
            plugin.settings.vaultSort[1] == true
        );
        menuItem.onClick((ev: MouseEvent) => {
          plugin.settings.vaultSort = ["created", true];
          plugin.saveSettings();
          refreshFileList();
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
    return (
      <>
        <div
          className={classNames(
            "mk-tree-wrapper",
            "mk-section-wrapper",
            clone && "mk-clone",
            ghost && "mk-ghost",
            disableSelection && "mk-disable-selection",
            disableInteraction && "mk-disable-interaction"
          )}
          ref={wrapperRef}
          style={
            {
              ...style,
              ...(indicator
                ? { "--spacing": `${indentationWidth * depth}px` }
                : {}),
            } as React.CSSProperties
          }
        >
          <div
            onContextMenu={(e) => triggerMenu(e)}
            className={classNames(
              "mk-section",
              indicator
                ? indicator.state == IndicatorState.Bottom
                  ? "mk-indicator-bottom"
                  : indicator.state == IndicatorState.Top
                  ? "mk-indicator-top"
                  : indicator.state == IndicatorState.Row
                  ? "mk-indicator-row"
                  : ""
                : ""
            )}
          >
            <div
              className="mk-section-title"
              //@ts-ignore
              onClick={(e) => onCollapse(data)}
              ref={ref}
              {...handleProps}
            >
              {data.spaceItem?.sticker ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: unifiedToNative(data.spaceItem?.sticker),
                  }}
                ></div>
              ) : (
                <></>
              )}
              <div className="mk-tree-text">
                {data.id == "/" ? plugin.app.vault.getName() : data.space}
              </div>
              <div
                className={`mk-collapse ${collapsed ? "mk-collapsed" : ""}`}
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["mk-ui-collapse-sm"],
                }}
              ></div>
            </div>
            <div className="mk-folder-buttons">
              <button
                aria-label={t.buttons.createFolder}
                onClick={() => {
                  newFolderInSection();
                }}
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["mk-ui-new-folder"],
                }}
              ></button>
              <button
                aria-label={t.buttons.newNote}
                onClick={() => {
                  newFileInSection();
                }}
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["mk-ui-new-note"],
                }}
              ></button>
            </div>
          </div>
          {/* {section && !collapsed && section.children.length == 0 && (
          <div
            className="mk-tree-empty"
            style={
              {
                "--spacing": `${indentationWidth}px`,
              } as React.CSSProperties
            }
          >
            No Notes Inside
          </div>
        )} */}
        </div>
      </>
    );
  }
);

SectionItem.displayName = "SectionItem";
