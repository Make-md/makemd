import MakeMDPlugin from "main";
import { TFolder } from "obsidian";
import React, {
  CSSProperties,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRecoilState } from "recoil";

import { UniqueIdentifier } from "@dnd-kit/core";
import { AnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import classNames from "classnames";
import { FileSticker } from "components/FileSticker/FileSticker";
import { SectionItem } from "components/Spaces/TreeView/SectionView";
import {
  triggerFileMenu,
  triggerMultiFileMenu,
} from "components/ui/menus/fileMenu";
import "css/FolderTreeView.css";
import { default as i18n, default as t } from "i18n";
import * as recoilState from "recoil/pluginState";
import { spaceRowHeight, TreeNode } from "superstate/spacesStore/spaces";
import { eventTypes, SpaceChangeEvent } from "types/types";
import {
  getAbstractFileAtPath,
  newFileInFolder,
  openAFile,
  platformIsMobile,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { pathByString } from "utils/path";

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
  highlighted: boolean;
  onSelectRange?(id: string): void;
  indicator: Indicator;
  indentationWidth: number;
  data: TreeNode;
  plugin: MakeMDPlugin;
  style: CSSProperties;
  onCollapse?(node: TreeNode, open: boolean): void;
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
      highlighted,
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
    const [hoverTarget, setHoverTarget] = useState<EventTarget>(null);
    const [selectedFiles, setSelectedFiles] = useRecoilState(
      recoilState.selectedFiles
    );
    const [fileCache, setFileCache] = useState(data.item);
    const openFileAtTarget = (file: TreeNode, e: React.MouseEvent) => {
      if (e.shiftKey) {
        onSelectRange(file.id as string);
        return;
      }
      if (file.item.isFolder) {
        onCollapse(data, true);
      }
      if (!plugin.settings.contextEnabled) {
        if (!file.item.isFolder) {
          openAFile(
            getAbstractFileAtPath(app, file.item.path),
            plugin,
            e.ctrlKey || e.metaKey || e.button === 1
          );
          setActiveFile(pathByString(file.item.path));
          setSelectedFiles([file]);
        }
      } else {
        openAFile(
          getAbstractFileAtPath(app, file.item.path),
          plugin,
          e.ctrlKey || e.metaKey || e.button === 1
        );
        setActiveFile(pathByString(file.item.path));
        setSelectedFiles([file]);
      }
    };

    const dragStarted = (e: React.DragEvent<HTMLDivElement>) => {
      if (selectedFiles.length > 1) {
        const files = selectedFiles.map((f) => f.file).filter((f) => f);
        app.dragManager.onDragStart(e, {
          icon: "lucide-files",
          source: undefined,
          title: i18n.labels.filesCount.replace(
            "{$1}",
            files.length.toString()
          ),
          type: "files",
          files: files,
        });
        app.dragManager.dragFiles(e, files, true);
        return;
      }
      const file = getAbstractFileAtPath(app, data.item.path);
      if (file instanceof TFolder) {
        app.dragManager.onDragStart(e, {
          icon: "lucide-folder",
          source: undefined,
          title: file.name,
          type: "folder",
          file: file,
        });
        app.dragManager.dragFolder(e, file, true);
        return;
      }
      app.dragManager.onDragStart(e, {
        icon: "lucide-file",
        source: undefined,
        title: file.name,
        type: "file",
        file: file,
      });
      app.dragManager.dragFile(e, file, true);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        if (e.repeat) return;
        const el = hoverTarget;
        if (el)
          plugin.app.workspace.trigger(
            "link-hover",
            {},
            el,
            data.item.path,
            data.item.path
          );
      }
    };
    const mouseOut = (e: React.MouseEvent) => {
      setHoverTarget(null);
    };
    const updateFileCache = (evt: SpaceChangeEvent) => {
      if (evt.detail.type == "file" && evt.detail.name == data.item.path)
        setFileCache(plugin.index.filesIndex.get(data.item.path));
    };
    useEffect(() => {
      window.addEventListener(eventTypes.spacesChange, updateFileCache);
      return () => {
        window.removeEventListener(eventTypes.refreshView, updateFileCache);
      };
    }, []);
    const hoverItem = (e: React.MouseEvent) => {
      if (plugin.settings.filePreviewOnHover) {
        setHoverTarget(e.target);
        if (e.ctrlKey || e.metaKey) {
          plugin.app.workspace.trigger(
            "link-hover",
            {},
            e.target,
            data.item.path,
            data.item.path
          );
        }
      }
    };
    useEffect(() => {
      if (hoverTarget && plugin.settings.filePreviewOnHover) {
        window.addEventListener("keydown", onKeyDown);
        return () => {
          window.removeEventListener("keydown", onKeyDown);
        };
      }
    }, [hoverTarget]);
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
            className={classNames(
              data.item.isFolder ? "nav-folder" : "nav-file",
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
                "mk-tree-item",
                "tree-item-self",
                fileCache.isFolder ? "nav-folder-title" : "nav-file-title",
                fileCache.folderNote ? "mk-folder-is-folder-note" : "",
                active ? "is-active" : "",
                selected ? "is-selected" : "",
                highlighted ? "is-highlighted" : ""
              )}
              ref={ref}
              style={
                {
                  "--spacing": `${indentationWidth * depth - 28}px`,
                  "--childrenCount": `${
                    childCount * spaceRowHeight(plugin) - 13
                  }px`,
                } as React.CSSProperties
              }
              onMouseLeave={mouseOut}
              onMouseEnter={hoverItem}
              onKeyDown={onKeyDown}
              onClick={(e) => openFileAtTarget(data, e)}
              onAuxClick={(e) => openFileAtTarget(data, e)}
              data-path={fileCache.path}
              onContextMenu={(e) =>
                selectedFiles.length > 1 &&
                selectedFiles.some((f) => f.id == (data.id as string))
                  ? triggerMultiFileMenu(plugin, selectedFiles, e)
                  : triggerFileMenu(plugin, data.file, fileCache.isFolder, e)
              }
              {...innerProps}
            >
              {data.item.isFolder && (
                <button
                  aria-label={`${
                    collapsed ? t.labels.expand : t.labels.collapse
                  }`}
                  className={`mk-collapse ${collapsed ? "mk-collapsed" : ""}`}
                  onClick={(e) => {
                    onCollapse(data, false);
                    e.stopPropagation();
                  }}
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-collapse"],
                  }}
                ></button>
              )}
              {plugin.settings.spacesStickers && (
                <FileSticker plugin={plugin} fileCache={fileCache} />
              )}
              <div
                className={`mk-tree-text ${
                  fileCache.isFolder
                    ? "nav-folder-title-content"
                    : "nav-file-title-content"
                }`}
              >
                {fileCache.name}
              </div>
              {!fileCache.isFolder && fileCache.extension != "md" && (
                <span className="nav-file-tag">{fileCache.extension}</span>
              )}
              {!clone ? (
                <div className="mk-folder-buttons">
                  <button
                    aria-label={t.buttons.moreOptions}
                    onClick={(e) => {
                      triggerFileMenu(plugin, data.file, fileCache.isFolder, e);
                      e.stopPropagation();
                    }}
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-ui-options"],
                    }}
                  ></button>
                  {fileCache.isFolder && (
                    <button
                      aria-label={t.buttons.newNote}
                      onClick={(e) => {
                        newFileInFolder(plugin, data.file as TFolder);
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
