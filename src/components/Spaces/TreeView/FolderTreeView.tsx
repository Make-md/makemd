import MakeMDPlugin from "main";
import {
  TFile,
  TFolder
} from "obsidian";
import React, {
  CSSProperties, forwardRef, useMemo
} from "react";
import { useRecoilState } from "recoil";
import * as tree from "utils/tree";

import { UniqueIdentifier } from "@dnd-kit/core";
import { AnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import classNames from "classnames";
import { FileSticker } from "components/FileSticker/FileSticker";
import { SectionItem } from "components/Spaces/TreeView/SectionView";
import {
  triggerFileMenu,
  triggerMultiFileMenu
} from "components/ui/menus/fileMenu";
import "css/FolderTreeView.css";
import t from "i18n";
import * as recoilState from "recoil/pluginState";
import {
  getAbstractFileAtPath,
  newFileInFolder,
  openAFile, platformIsMobile
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { TreeNode } from "utils/spaces/spaces";
import i18n from "i18n";

export enum IndicatorState {
  None,
  Top,
  Bottom,
  Row,
}

export type Indicator =
  | {
      state: IndicatorState;
      depth: number;
    }
  | undefined;

export interface SortableTreeItemProps extends TreeItemProps {
  id: UniqueIdentifier;
  disabled: boolean;
}

const animateLayoutChanges: AnimateLayoutChanges = ({
  isSorting,
  wasDragging,
}) => (isSorting || wasDragging ? false : true);

export const SortableTreeItem = ({
  id,
  data,
  depth,
  disabled,
  style,
  ...props
}: SortableTreeItemProps) => {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
    disabled,
    data,
  });

  const memoListeners = useMemo(() => {
    return {
      ...attributes,
      ...listeners,
    };
  }, [isSorting]);

  if (data.parentId == null) {
    return (
      <SectionItem
        ref={setDraggableNodeRef}
        wrapperRef={setDroppableNodeRef}
        data={data}
        depth={depth}
        ghost={isDragging}
        disableInteraction={isSorting}
        disabled={disabled}
        style={style}
        handleProps={memoListeners}
        {...props}
      />
    );
  } else {
    return (
      <TreeItem
        ref={setDraggableNodeRef}
        wrapperRef={setDroppableNodeRef}
        data={data}
        depth={depth}
        ghost={isDragging}
        disableInteraction={isSorting}
        disabled={disabled}
        style={style}
        handleProps={memoListeners}
        {...props}
      />
    );
  }
};

export interface TreeItemProps {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  disabled: boolean;
  active: boolean;
  ghost?: boolean;
  handleProps?: any;
  selected: boolean;
  onSelectRange?(id: string): void;
  indicator: Indicator;
  indentationWidth: number;
  data: TreeNode;
  plugin: MakeMDPlugin;
  style: CSSProperties;
  onCollapse?(node: TreeNode): void;
  wrapperRef?(node: HTMLDivElement): void;
}

export const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(
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
      active,
      indentationWidth,
      indicator,
      collapsed,
      selected,
      onCollapse,
      onSelectRange,
      wrapperRef,
      style,
      plugin,
      disabled,
    },
    ref
  ) => {
    const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
    const [selectedFiles, setSelectedFiles] = useRecoilState(
      recoilState.selectedFiles
    );

    const openFileAtTarget = (file: TreeNode, e: React.MouseEvent) => {
      if (e.shiftKey) {
        onSelectRange(file.id as string);
        return;
      }
      openAFile(
        getAbstractFileAtPath(app, file.item.path),
        plugin,
        e.ctrlKey || e.metaKey
      );
      setActiveFile(file.item.path as string);
      setSelectedFiles([file]);
    };

    const dragStarted = (e: React.DragEvent<HTMLDivElement>) => {
      if (selectedFiles.length > 1) {
        const files = selectedFiles.map((f) => f.file).filter((f) => f);
        //@ts-ignore
        app.dragManager.onDragStart(e, {
          icon: "lucide-files",
          source: undefined,
          title: i18n.labels.filesCount.replace('{$1}', files.length.toString()),
          type: "files",
          files: files,
        });
        //@ts-ignore
        app.dragManager.dragFiles(e, files, true);
        return;
      }
      const file = getAbstractFileAtPath(app, data.item.path);
      if (file instanceof TFolder) {
        //@ts-ignore
        app.dragManager.onDragStart(e, {
          icon: "lucide-folder",
          source: undefined,
          title: file.name,
          type: "folder",
          file: file,
        });
        //@ts-ignore
        app.dragManager.dragFolder(e, file, true);
        return;
      }
      //@ts-ignore
      app.dragManager.onDragStart(e, {
        icon: "lucide-file",
        source: undefined,
        title: file.name,
        type: "file",
        file: file,
      });
      //@ts-ignore
      app.dragManager.dragFile(e, file, true);
    };

    const innerProps = !platformIsMobile()
      ? {
          draggable: true,
          onDragStart: dragStarted,
        }
      : handleProps;
    return (
      <>
        <div
          className={classNames(
            "mk-tree-wrapper",
            clone && "mk-clone",
            ghost && "mk-ghost",
            disableSelection && "mk-disable-selection",
            disableInteraction && "mk-disable-interaction"
          )}
          ref={wrapperRef}
          style={style}
        >
          <div
            className={
              indicator &&
              classNames(
                "nav-file",
                indicator.state == IndicatorState.Bottom
                  ? "mk-indicator-bottom"
                  : indicator.state == IndicatorState.Top
                  ? "mk-indicator-top"
                  : indicator.state == IndicatorState.Row
                  ? "mk-indicator-row"
                  : ""
              )
            }
            style={
              indicator
                ? ({
                    "--spacing": `${indentationWidth * indicator.depth}px`,
                  } as React.CSSProperties)
                : {}
            }
            //
          >
            {!platformIsMobile() && (
              <div
                className="mk-drag-handle"
                dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-handle"] }}
                {...handleProps}
              />
            )}
            <div
              className={classNames(
                `mk-tree-item ${
                  data.item.folder == "true"
                    ? "nav-folder-title"
                    : "nav-file-title"
                } ${active && "is-active"} ${selected && "is-selected"}`
              )}
              ref={ref}
              style={
                {
                  "--spacing": `${indentationWidth * depth - 28}px`,
                } as React.CSSProperties
              }
              onClick={(e) => openFileAtTarget(data, e)}
              data-path={data.item.path}
              onContextMenu={(e) =>
                selectedFiles.length > 1 &&
                selectedFiles.some((f) => f.id == (data.id as string))
                  ? triggerMultiFileMenu(plugin, selectedFiles, e)
                  : triggerFileMenu(
                      plugin,
                      data.file,
                      data.item.folder == "true",
                      e
                    )
              }
              {...innerProps}
            >
              {data.item.folder == "true" && (
                <button
                  aria-label={`${
                    collapsed ? t.labels.expand : t.labels.collapse
                  }`}
                  className={`mk-collapse ${collapsed ? "mk-collapsed" : ""}`}
                  onClick={(e) => {
                    onCollapse(data);
                    e.stopPropagation();
                  }}
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-collapse"],
                  }}
                ></button>
              )}
              {plugin.settings.spacesStickers && (
                <FileSticker
                  plugin={plugin}
                  filePath={data.item.path}
                ></FileSticker>
              )}
              <div
                className={`mk-tree-text ${
                  data.item.folder == "true"
                    ? "nav-folder-title-content"
                    : "nav-file-title-content"
                }`}
              >
                {data.file
                  ? data.item.folder == "true"
                    ? data.file.name
                    : tree.fileNameToString(data.file.name)
                  : ""}
                {data.item.folder == "false" &&
                  data.file &&
                  (data.file as TFile).extension != "md" && (
                    <span className="nav-file-tag">
                      {(data.file as TFile)?.extension}
                    </span>
                  )}
              </div>
              {!clone ? (
                <div className="mk-folder-buttons">
                  <button
                    aria-label={t.buttons.moreOptions}
                    onClick={(e) => {
                      triggerFileMenu(
                        plugin,
                        data.file,
                        data.item.folder == "true",
                        e
                      );
                      e.stopPropagation();
                    }}
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-ui-options"],
                    }}
                  ></button>
                  {data.item.folder == "true" && (
                    <button
                      aria-label={t.buttons.newNote}
                      onClick={(e) => {
                        //@ts-ignore
                        newFileInFolder(plugin, data.file);
                        e.stopPropagation();
                      }}
                      dangerouslySetInnerHTML={{
                        __html: uiIconSet["mk-ui-plus"],
                      }}
                    ></button>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
        {/* {data.isFolder && !collapsed && data.children.length == 0 && 
        <div className='mk-tree-empty'
        style={
          {
            '--spacing': `${indentationWidth * (depth+1)}px`,
          } as React.CSSProperties
        }
        >No Notes Inside</div>} */}
      </>
    );
  }
);

TreeItem.displayName = "TreeItem";
