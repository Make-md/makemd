import { UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pos } from "shared/types/Pos";

import { NavigatorContext } from "core/react/context/SidebarContext";
import { TreeNode } from "core/superstate/utils/spaces";
import { DragProjection } from "core/utils/dnd/dragPath";
import { i18n, Superstate } from "makemd-core";
import React, { CSSProperties, useContext } from "react";
import { windowFromDocument } from "shared/utils/dom";
import { BlinkMode } from "../../../../../shared/types/blink";
import { TreeItem } from "./SpaceTreeItem";

export const VirtualizedList = React.memo(function VirtualizedList(props: {
  flattenedTree: TreeNode[];
  rowHeights: number[];
  projected: DragProjection;
  handleCollapse: any;
  superstate: Superstate;
  selectedPaths: TreeNode[];
  vRef: any;
  activePath: string;
  selectRange: any;
  indentationWidth: number;
  overIndex: number;
  activeIndex: number;
  dragStarted: (activeId: UniqueIdentifier) => void;
  dragOver: (
    e: React.DragEvent<HTMLElement>,
    overId: UniqueIdentifier,
    position: Pos
  ) => void;
  dragEnded: (
    e: React.DragEvent<HTMLElement>,
    overId: UniqueIdentifier
  ) => void;
}) {
  const {
    flattenedTree,
    rowHeights,
    projected,
    vRef,
    selectedPaths: selectedPaths,
    activePath: activePath,
    selectRange,
    handleCollapse,
    superstate,
    overIndex,
    activeIndex,
    indentationWidth,
  } = props;

  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: flattenedTree.length,
    paddingEnd: 24,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback((index) => rowHeights[index], [rowHeights]),
    overscan: 0,
  });
  vRef.current = rowVirtualizer;
  const { saveActiveSpace } = useContext(NavigatorContext);
  const dropIndicator = (index: number) => {
    return overIndex == index && projected && projected.insert;
  };
  const highlighted = (index: number) => {
    if (!projected || !flattenedTree[index] || !projected?.droppable)
      return false;
    return (
      (!projected.sortable &&
        !projected.insert &&
        flattenedTree[index].parentId &&
        flattenedTree[index].parentId.startsWith(projected.parentId)) ||
      flattenedTree[index].id == projected.parentId
    );
  };
  const heightBetweenIndex = (start: number, end: number) => {
    if (start > end)
      return rowHeights.slice(end, start).reduce((p, c) => p + c, 0);
    return -rowHeights.slice(start, end).reduce((p, c) => p + c, 0);
  };
  const calcYOffset = (index: number) => {
    if (!projected) return 0;
    if (projected.insert) {
      if (projected.copy && !projected.reorder) return 0;
      if (index > activeIndex) {
        return -rowHeights[index];
      } else if (index == activeIndex) {
        return heightBetweenIndex(overIndex, activeIndex);
      } else {
        return 0;
      }
    } else if (projected.sortable) {
      const targetIndex = overIndex < activeIndex ? overIndex : overIndex;
      if (projected.copy && !projected.reorder) {
        if (index == activeIndex) {
          return heightBetweenIndex(targetIndex, activeIndex);
        } else if (index >= targetIndex) {
          return rowHeights[index];
        } else {
          return 0;
        }
      }

      if (index == activeIndex) {
        return heightBetweenIndex(targetIndex, activeIndex);
      } else if (index > activeIndex && index <= targetIndex) {
        return -rowHeights[index];
      } else if (index < activeIndex && index >= targetIndex) {
        return rowHeights[index];
      } else {
        return 0;
      }
    }
  };

  return (
    <div
      ref={parentRef}
      style={
        {
          width: `100%`,
          height: `100%`,
          overflow: "auto",
        } as React.CSSProperties
      }
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={flattenedTree[virtualRow.index].id}
            data-index={virtualRow.index}
            className="mk-tree-node"
            style={
              {
                "--row-height": `${rowHeights[virtualRow.index]}px`,
                "--node-offset": `${virtualRow.start}px`,
              } as CSSProperties
            }
          >
            {flattenedTree[virtualRow.index].type == "new" ? (
              <div
                className={"mk-tree-wrapper mk-tree-section"}
                onClick={(e) => {
                  const rect = (
                    e.target as HTMLElement
                  ).getBoundingClientRect();
                  props.superstate.ui.quickOpen(
                    BlinkMode.Open,
                    rect,
                    windowFromDocument(e.view.document),
                    (link) => {
                      saveActiveSpace(link);
                    }
                  );
                }}
              >
                <div className="mk-tree-item tree-item-self nav-folder-title mk-tree-new">
                  <div
                    className={`mk-path-icon mk-path-icon-placeholder`}
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//plus"),
                    }}
                  ></div>
                  <div className="mk-tree-text nav-folder-title-content">
                    {i18n.menu.openSpace}
                  </div>
                </div>
              </div>
            ) : (
              <TreeItem
                key={flattenedTree[virtualRow.index].id}
                id={flattenedTree[virtualRow.index].id}
                data={flattenedTree[virtualRow.index]}
                disabled={false}
                depth={flattenedTree[virtualRow.index].depth}
                childCount={flattenedTree[virtualRow.index].childrenCount}
                indentationWidth={indentationWidth}
                dragStarted={props.dragStarted}
                dragOver={props.dragOver}
                dragEnded={props.dragEnded}
                dragActive={activeIndex != -1}
                indicator={dropIndicator(virtualRow.index)}
                superstate={superstate}
                ghost={
                  overIndex != -1 && activeIndex == virtualRow.index
                  // (overIndex == virtualRow.index && !projected?.droppable)
                }
                style={{
                  opacity:
                    projected &&
                    projected.insert &&
                    !projected.copy &&
                    virtualRow.index == activeIndex
                      ? 0
                      : 1,
                  transform: CSS.Translate.toString({
                    x:
                      projected &&
                      projected.sortable &&
                      virtualRow.index == activeIndex &&
                      projected
                        ? (projected.depth -
                            flattenedTree[virtualRow.index].depth) *
                          indentationWidth
                        : 0,
                    y: calcYOffset(virtualRow.index),
                    scaleX: 0,
                    scaleY: 0,
                  }),
                }}
                onSelectRange={selectRange}
                active={
                  activePath == flattenedTree[virtualRow.index].item?.path
                }
                highlighted={highlighted(virtualRow.index)}
                selected={(selectedPaths as TreeNode[]).some(
                  (g) => g.id == flattenedTree[virtualRow.index].id
                )}
                collapsed={flattenedTree[virtualRow.index].collapsed}
                onCollapse={handleCollapse}
              ></TreeItem>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
