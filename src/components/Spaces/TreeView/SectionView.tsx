import classNames from "classnames";
import "css/SectionView.css";
import React, { forwardRef } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";

import {
  IndicatorState,
  TreeItemProps,
} from "components/Spaces/TreeView/FolderTreeView";
import { triggerSectionMenu } from "components/ui/menus/fileMenu";
import { stickerModal } from "components/ui/modals/stickerModal";
import { default as t } from "i18n";
import { newFileInSpace } from "superstate/spacesStore/spaces";
import { saveSpaceIcon } from "utils/emoji";
import { openSpace } from "utils/file";
import { uiIconSet } from "utils/icons";
import { stickerFromString } from "utils/sticker";

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
      active,
    },
    ref
  ) => {
    const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
    const space = plugin.index.spacesIndex.get(data.space)?.space;

    const triggerMenu = (e: React.MouseEvent | React.TouchEvent) => {
      triggerSectionMenu(
        plugin,
        space,
        [...plugin.index.allSpaces()],
        e,
        activeFile
      );
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
              className={`mk-collapse ${collapsed ? "mk-collapsed" : ""}`}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-collapse-sm"],
              }}
              onClick={(e) => onCollapse(data, false)}
            ></div>
            <div
              className={classNames(
                "mk-tree-item",
                "tree-item-self",
                "nav-folder-title",
                active && "is-selected"
              )}
              data-path={data.space}
              ref={ref}
              {...handleProps}
            >
              <div className="mk-file-icon">
                <button
                  dangerouslySetInnerHTML={{
                    __html: space?.sticker
                      ? stickerFromString(space?.sticker, plugin)
                      : uiIconSet["mk-ui-spaces"],
                  }}
                  onClick={() => {
                    if (!space) return;
                    const vaultChangeModal = new stickerModal(
                      plugin.app,
                      plugin,
                      (emoji) => saveSpaceIcon(plugin, space.name, emoji)
                    );
                    vaultChangeModal.open();
                  }}
                ></button>
              </div>
              <div
                className="mk-tree-text"
                onClick={
                  (e) => (space ? openSpace(space.name, plugin, false) : {})
                  // (e) => onCollapse(data)
                }
              >
                {data.space}
              </div>
              <div className="mk-folder-buttons">
                <button
                  aria-label={t.buttons.moreOptions}
                  onClick={(e) => {
                    triggerMenu(e);
                    e.stopPropagation();
                  }}
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-options"],
                  }}
                ></button>
                {space?.def?.type == "focus" ? (
                  <button
                    aria-label={t.buttons.newNote}
                    onClick={() => {
                      newFileInSpace(plugin, space, activeFile);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-ui-plus"],
                    }}
                  ></button>
                ) : (
                  <></>
                )}
              </div>
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
