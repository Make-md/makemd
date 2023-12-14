import classNames from "classnames";
import { default as i18n, default as t } from "core/i18n";
import { Pos } from "types/Pos";

import {
  showPathContextMenu,
  triggerMultiPathMenu,
} from "core/react/components/UI/Menus/navigator/pathContextMenu";
import { triggerSpaceMenu } from "core/react/components/UI/Menus/navigator/spaceContextMenu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { PathStickerView } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import {
  TreeNode,
  newPathInSpace,
  pinPathToSpaceAtIndex,
  spaceRowHeight,
} from "core/superstate/utils/spaces";
import { PathState } from "core/types/superstate";
import React, {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
export type DropModifiers = "copy" | "link" | "move";

export const eventToModifier = (e: React.DragEvent, isDefaultSpace?: boolean) =>
  e.altKey ? "copy" : e.shiftKey || isDefaultSpace ? "link" : "move";
export interface TreeItemProps {
  id: string;
  disabled: boolean;
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  ghost: boolean;
  active: boolean;
  selected: boolean;
  highlighted: boolean;
  onSelectRange?(id: string): void;
  indicator: boolean;
  indentationWidth: number;
  data: TreeNode;
  superstate: Superstate;
  style: CSSProperties;
  onCollapse?(node: TreeNode, open: boolean): void;
  dragStarted: (activeId: string) => void;
  dragOver: (
    e: React.DragEvent<HTMLElement>,
    overId: string,
    position: Pos
  ) => void;
  dragEnded: (e: React.DragEvent<HTMLDivElement>, overId: string) => void;
  dragActive: boolean;
}

export const TreeItem = (props: TreeItemProps) => {
  const {
    id,
    childCount,
    clone,
    data,
    depth,
    dragActive,
    ghost,
    active,
    indentationWidth,
    indicator,
    collapsed,
    selected,
    highlighted,
    onCollapse,
    onSelectRange,
    style,
    superstate,
    disabled,
    dragStarted,
    dragOver,
    dragEnded,
  } = props;
  const {
    activePath: activePath,
    setActivePath: setActivePath,
    selectedPaths: selectedPaths,
    setSelectedPaths: setSelectedPaths,
    setDragPaths,
  } = useContext(NavigatorContext);
  const [hoverTarget, setHoverTarget] = useState<EventTarget>(null);

  const innerRef = useRef(null);
  const [dropHighlighted, setDropHighlighted] = useState(false);
  const [pathState, setPathState] = useState<PathState>(
    superstate.pathsIndex.get(data.item.path)
  );
  useEffect(
    () => setPathState(superstate.pathsIndex.get(data.item.path)),
    [data.item.path]
  );
  const openPathAtTarget = (path: TreeNode, e: React.MouseEvent) => {
    if (e.shiftKey) {
      onSelectRange(path.id as string);
      return;
    } else if (e.altKey) {
      setSelectedPaths((s) => [...s.filter((f) => f.id != path.id), path]);
      return;
    }
    if (isFolder) {
      if (superstate.settings.expandFolderOnClick) {
        onCollapse(data, true);
      }
    }
    superstate.ui.openPath(
      path.item.path,
      e.ctrlKey || e.metaKey || e.button == 1
        ? e.altKey
          ? "split"
          : "tab"
        : false
    );
    setActivePath(path.item.path);
    setSelectedPaths([path]);
  };

  const onDragStarted = (e: React.DragEvent<HTMLDivElement>) => {
    if (selectedPaths.length > 1) {
      setDragPaths(selectedPaths.map((f) => f.path));
      superstate.ui.dragStarted(
        e,
        selectedPaths.map((f) => f.path)
      );

      return;
    }
    dragStarted(data.id);
    setDragPaths([data.path]);
    superstate.ui.dragStarted(e, [data.path]);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.

    dragOver(e, data.id, { x, y });
  };
  const onKeyDown = (e: KeyboardEvent | React.KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta") {
      if (e.repeat) return;
      const el = hoverTarget;
      if (el) superstate.ui.openPath(pathState.path, "hover", el);
    }
  };
  const onDrop = useCallback((files: File[], g, h) => {
    if (isFolder) {
      // Do something with the files
      files.map(async (file) => {
        file.arrayBuffer().then((arrayBuffer) => {
          superstate.spaceManager.writeToPath(
            pathState.path + "/" + file.name,
            arrayBuffer,
            true
          );
        });
      });
    }
  }, []);
  const onDragEnter = useCallback(() => {
    if (isFolder) setDropHighlighted(true);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave: () => setDropHighlighted(false),
    onDropAccepted: () => setDropHighlighted(false),
    onDropRejected: () => setDropHighlighted(false),
    noClick: true,
  });
  const onDragEnded = (e: React.DragEvent<HTMLDivElement>) => {
    dragEnded(e, data.id);
  };
  const mouseOut = (e: React.MouseEvent) => {
    setHoverTarget(null);
  };
  const newAction = (e: React.MouseEvent) => {
    const space = superstate.spacesIndex.get(pathState.path);
    if (e.shiftKey) {
      showLinkMenu(
        e as any,
        superstate,
        (link) => {
          pinPathToSpaceAtIndex(superstate, space, link);
        },
        i18n.labels.pinNotePlaceholder
      );
      return;
    }

    newPathInSpace(superstate, space, "md", null);
  };
  const handleRightClick = (e: React.MouseEvent) => {
    selectedPaths.length > 1 &&
    selectedPaths.some((f) => f.id == (data.id as string))
      ? triggerMultiPathMenu(superstate, selectedPaths, e)
      : contextMenu(e);
  };
  const contextMenu = (e: React.MouseEvent) => {
    if (superstate.spacesIndex.has(pathState.path)) {
      triggerSpaceMenu(superstate, pathState, e, activePath, data.space);
      return;
    }
    showPathContextMenu(superstate, data.path, data.space, e);
  };
  const pathStateUpdated = (payload: { path: string }) => {
    if (payload.path == pathState?.path) {
      const _pathState = superstate.pathsIndex.get(pathState.path);
      if (_pathState) setPathState(_pathState);
    }
  };
  useEffect(() => {
    superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      pathStateUpdated
    );
    return () => {
      superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        pathStateUpdated
      );
    };
  }, []);
  const hoverItem = (e: React.MouseEvent) => {
    if (superstate.settings.filePreviewOnHover) {
      setHoverTarget(e.target);
      if (e.ctrlKey || e.metaKey) {
        superstate.ui.openPath(pathState.path, "hover", e.target);
      }
    }
  };
  useEffect(() => {
    if (hoverTarget && superstate.settings.filePreviewOnHover) {
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [hoverTarget]);
  const dropProps = {
    onDragOver: onDragOver,
  };
  const innerProps = {
    draggable: true,
    onDragStart: onDragStarted,
    onDrop: onDragEnded,
  };
  const isSpace = pathState?.type == "space";
  const isFolder = pathState?.metadata?.isFolder || isSpace;

  const extension = pathState?.metadata?.file?.extension;
  const isLink = pathState?.parent != data.space;
  return (
    <>
      <div
        className={classNames(
          "mk-tree-wrapper",
          clone && "mk-clone",
          ghost && "mk-ghost",
          highlighted ? "is-highlighted" : ""
        )}
        style={{ position: "relative" }}
        ref={innerRef}
        onMouseLeave={mouseOut}
        onMouseEnter={hoverItem}
        onKeyDown={onKeyDown}
        onClick={(e) => openPathAtTarget(data, e)}
        onContextMenu={(e) => handleRightClick(e)}
        {...dropProps}
        {...innerProps}
      >
        <div
          className={classNames(isFolder ? "nav-folder" : "nav-file")}
          style={{
            ...style,
            ...(dragActive ? { pointerEvents: "none" } : {}),
          }}
          {...(superstate.ui.getScreenType() != "mobile"
            ? getRootProps({ className: "dropzone" })
            : {})}
        >
          <input {...getInputProps()} />
          <div
            className={classNames(
              "mk-tree-item",
              "tree-item-self",
              isFolder ? "nav-folder-title" : "nav-file-title",
              active ? "is-active" : "",
              selected ? "is-selected" : "",

              indicator || dropHighlighted ? "mk-indicator-row" : ""
            )}
            style={
              {
                "--spacing": `${indentationWidth * depth}px`,
                "--childrenCount": `${
                  childCount * spaceRowHeight(superstate) - 13
                }px`,
              } as React.CSSProperties
            }
            data-path={pathState?.path}
          >
            {data.item?.type == "space" ? (
              <button
                aria-label={`${
                  collapsed ? t.labels.expand : t.labels.collapse
                }`}
                className={`mk-collapse mk-icon-xsmall ${
                  collapsed ? "mk-collapsed" : ""
                }`}
                onClick={(e) => {
                  onCollapse(data, false);
                  e.stopPropagation();
                }}
                dangerouslySetInnerHTML={{
                  __html: superstate.ui.getSticker("ui//mk-ui-collapse"),
                }}
              ></button>
            ) : (
              <div
                className={`mk-collapse mk-icon-xsmall ${
                  collapsed ? "mk-collapsed" : ""
                }`}
              ></div>
            )}

            {superstate.settings.spacesStickers && pathState && (
              <PathStickerView superstate={superstate} pathState={pathState} />
            )}
            <div
              className={`mk-tree-text ${
                isFolder ? "nav-folder-title-content" : "nav-file-title-content"
              }`}
            >
              {pathState?.displayName ?? pathState?.name ?? data.path}
              {isLink && superstate.settings.showSpacePinIcon && (
                <span
                  className="mk-path-link"
                  dangerouslySetInnerHTML={{
                    __html: superstate.ui.getSticker("lucide//pin"),
                  }}
                ></span>
              )}
            </div>
            {!isSpace && extension != "md" && (
              <span className="nav-file-tag">{extension}</span>
            )}

            {!clone ? (
              <div className="mk-folder-buttons">
                <button
                  aria-label={t.buttons.moreOptions}
                  onClick={(e) => {
                    contextMenu(e);
                    e.stopPropagation();
                  }}
                  dangerouslySetInnerHTML={{
                    __html: superstate.ui.getSticker("ui//mk-ui-options"),
                  }}
                ></button>
                {isSpace && (
                  <button
                    aria-label={t.buttons.newNote}
                    onClick={(e) => {
                      newAction(e);
                      e.stopPropagation();
                    }}
                    dangerouslySetInnerHTML={{
                      __html: superstate.ui.getSticker("ui//mk-ui-plus"),
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
};
TreeItem.displayName = "TreeItem";
