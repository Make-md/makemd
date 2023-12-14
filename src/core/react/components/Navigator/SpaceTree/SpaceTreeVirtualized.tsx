import { UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useVirtual } from "@tanstack/react-virtual";
import { Pos } from "types/Pos";

import { Superstate } from "core/superstate/superstate";
import { TreeNode, spaceRowHeight } from "core/superstate/utils/spaces";
import { DragProjection } from "core/utils/dnd/dragPath";
import React from "react";
import { TreeItem } from "./SpaceTreeItem";

export const VirtualizedList = React.memo(function VirtualizedList(props: {
  flattenedTree: TreeNode[];
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
  const rowHeight = (index: number) =>
    flattenedTree[index].parentId == null
      ? spaceRowHeight(superstate)
      : spaceRowHeight(superstate);
  const rowVirtualizer = useVirtual({
    size: flattenedTree.length,
    paddingEnd: 24,
    parentRef,
    estimateSize: React.useCallback(
      (index) => rowHeight(index),
      [flattenedTree]
    ),
    overscan: 0,
  });
  vRef.current = rowVirtualizer;
  rowVirtualizer.scrollToIndex;
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
  const calcYOffset = (index: number) => {
    if (!projected) return 0;
    if (projected.insert) {
      if (projected.copy && !projected.reorder) return 0;
      if (index > activeIndex) {
        return -spaceRowHeight(superstate);
      } else if (index == activeIndex) {
        return spaceRowHeight(superstate) * (overIndex - activeIndex);
      } else {
        return 0;
      }
    } else if (projected.sortable) {
      const targetIndex = overIndex < activeIndex ? overIndex : overIndex;
      if (projected.copy && !projected.reorder) {
        if (index == activeIndex) {
          return spaceRowHeight(superstate) * (targetIndex - activeIndex);
        } else if (index >= targetIndex) {
          return spaceRowHeight(superstate);
        } else {
          return 0;
        }
      }

      if (index == activeIndex) {
        return spaceRowHeight(superstate) * (targetIndex - activeIndex);
      } else if (index > activeIndex && index <= targetIndex) {
        return -spaceRowHeight(superstate);
      } else if (index < activeIndex && index >= targetIndex) {
        return spaceRowHeight(superstate);
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
          "--spaceRowHeight": spaceRowHeight(superstate) + "px",
        } as React.CSSProperties
      }
    >
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.index}
            ref={virtualRow.measureRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${rowHeight(virtualRow.index)}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
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
              active={activePath == flattenedTree[virtualRow.index].item?.path}
              highlighted={highlighted(virtualRow.index)}
              selected={(selectedPaths as TreeNode[]).some(
                (g) => g.id == flattenedTree[virtualRow.index].id
              )}
              collapsed={flattenedTree[virtualRow.index].collapsed}
              onCollapse={handleCollapse}
            ></TreeItem>
          </div>
        ))}
      </div>
    </div>
  );
});
