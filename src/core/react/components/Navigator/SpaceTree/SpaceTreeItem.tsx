import classNames from "classnames";
import { default as i18n, default as t } from "shared/i18n";
import { Pos } from "shared/types/Pos";

import {
  showPathContextMenu,
  triggerMultiPathMenu,
} from "core/react/components/UI/Menus/navigator/pathContextMenu";
import { showSpaceContextMenu } from "core/react/components/UI/Menus/navigator/spaceContextMenu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { NavigatorContext } from "core/react/context/SidebarContext";
import {
  TreeNode,
  pinPathToSpaceAtIndex,
  spaceRowHeight,
} from "core/superstate/utils/spaces";
import { isTouchScreen } from "core/utils/ui/screen";
import { isString } from "lodash";
import { Superstate } from "makemd-core";
import React, {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import { PathStickerView } from "shared/components/PathSticker";
import { PathState } from "shared/types/PathState";
import { windowFromDocument } from "shared/utils/dom";
import { defaultAddAction } from "../../UI/Menus/navigator/showSpaceAddMenu";
import { CollapseToggle } from "../../UI/Toggles/CollapseToggle";
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

enum PinType {
  Default,
  Linked,
  Live,
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
    closeActiveSpace,
  } = useContext(NavigatorContext);
  const [hoverTarget, setHoverTarget] = useState<EventTarget>(null);

  const innerRef = useRef(null);
  const [dropHighlighted, setDropHighlighted] = useState(false);
  const [pathState, setPathState] = useState<PathState>(
    superstate.pathsIndex.get(data.item.path)
  );
  const pinType = pathState?.linkedSpaces?.some((f) => f == data.space)
    ? PinType.Linked
    : pathState?.liveSpaces?.some((f) => f == data.space)
    ? PinType.Live
    : PinType.Default;

  useEffect(
    () => setPathState(superstate.pathsIndex.get(data.item.path)),
    [data.item.path]
  );
  const openAuxClick = (e: React.MouseEvent) => {
    if (e.button == 1) {
      superstate.ui.openPath(pathState.path, "tab");
      setActivePath(pathState.path);
      setSelectedPaths([data]);
    }
  };
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
        if (collapsed) {
          onCollapse(data, true);
        } else if (active || selected) {
          onCollapse(data, false);
        }
      }
    }
    const targetEver =
      superstate.spacesIndex.has(path.item.path) &&
      superstate.ui.isEverViewOpen();

    superstate.ui.openPath(
      path.item.path,
      e.ctrlKey || e.metaKey || e.button == 1
        ? e.altKey
          ? "split"
          : "tab"
        : targetEver
        ? "overview"
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
  const onDrop = useCallback((files: File[]) => {
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
      const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
      showLinkMenu(
        offset,
        windowFromDocument(e.view.document),
        superstate,
        (link) => {
          if (isString(link)) {
            pinPathToSpaceAtIndex(superstate, space, link);
          }
        },
        { placeholder: i18n.labels.pinNotePlaceholder }
      );
      e.stopPropagation();
      return;
    }

    defaultAddAction(superstate, space, windowFromDocument(e.view.document));
  };
  const handleRightClick = (e: React.MouseEvent) => {
    selectedPaths.length > 1 &&
    selectedPaths.some((f) => f.id == (data.id as string))
      ? triggerMultiPathMenu(superstate, selectedPaths, e)
      : contextMenu(e);
  };
  const color = pathState?.label?.color;
  const contextMenu = (e: React.MouseEvent) => {
    if (superstate.settings.overrideNativeMenu) {
      return superstate.ui.nativePathMenu(e, pathState.path);
    }
    if (superstate.spacesIndex.has(pathState.path)) {
      showSpaceContextMenu(
        superstate,
        pathState,
        e,
        activePath,
        data.type == "group" ? null : data.space,
        data.type == "group" ? () => closeActiveSpace(data.path) : null
      );

      return;
    }
    showPathContextMenu(
      superstate,
      data.path,
      data.space,
      (e.target as HTMLElement).getBoundingClientRect(),
      windowFromDocument(e.view.document),
      "right",
      data.type == "group" ? () => closeActiveSpace(data.path) : null
    );
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
  const spacing =
    data.type == "group"
      ? 0
      : indentationWidth * (depth - 1) +
        (data.type == "space"
          ? 0
          : isTouchScreen(props.superstate.ui)
          ? 30
          : 20);
  return (
    <>
      <div
        className={classNames(
          "mk-tree-wrapper",
          data.type == "group" ? "mk-tree-section" : "",
          clone && "mk-clone",
          ghost && "mk-ghost",
          highlighted ? "is-highlighted" : ""
        )}
        style={
          color?.length > 0
            ? ({
                "--label-color": `${color}`,
                "--icon-color": `#ffffff`,
                position: "relative",
              } as React.CSSProperties)
            : ({
                "--icon-color": `var(--mk-ui-text-secondary)`,
                position: "relative",
              } as React.CSSProperties)
        }
        ref={innerRef}
        onMouseLeave={mouseOut}
        onMouseEnter={hoverItem}
        onKeyDown={onKeyDown}
        onAuxClick={openAuxClick}
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
          {...(!isTouchScreen(props.superstate.ui)
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
                "--spacing": `${spacing}px`,
                "--childrenCount": `${
                  data.type == "space" && !collapsed
                    ? childCount *
                        spaceRowHeight(
                          superstate,
                          superstate.settings.spaceRowHeight,
                          false
                        ) -
                      13
                    : 0
                }px`,
              } as React.CSSProperties
            }
            data-path={pathState?.path}
          >
            {data.type == "space" && (
              <CollapseToggle
                superstate={props.superstate}
                collapsed={collapsed}
                onToggle={(c, e) => {
                  e.preventDefault();
                  onCollapse(data, false);
                  e.stopPropagation();
                }}
              ></CollapseToggle>
            )}

            {superstate.settings.spacesStickers && pathState && (
              <PathStickerView
                superstate={superstate}
                pathState={pathState}
                editable={superstate.settings.editStickerInSidebar}
              />
            )}
            <div
              className={`mk-tree-text ${
                isFolder ? "nav-folder-title-content" : "nav-file-title-content"
              }`}
            >
              {pathState?.label.name ?? pathState?.name ?? data.path}
            </div>
            {data.type == "group" && data.childrenCount > 0 && (
              <CollapseToggle
                superstate={props.superstate}
                collapsed={collapsed}
                onToggle={(c, e) => {
                  e.preventDefault();
                  onCollapse(data, false);
                  e.stopPropagation();
                }}
              ></CollapseToggle>
            )}
            <div className="mk-tree-span"></div>
            {!isSpace && extension != "md" && (
              <span className="nav-file-tag">{extension}</span>
            )}

            {!clone && !pathState?.readOnly ? (
              <div className="mk-folder-buttons">
                {pinType != PinType.Default && (
                  <div
                    aria-label={
                      pinType == PinType.Linked
                        ? t.labels.pinned
                        : t.labels.joined
                    }
                    dangerouslySetInnerHTML={{
                      __html: superstate.ui.getSticker(
                        pinType == PinType.Linked ? "ui//pin" : "ui//merge"
                      ),
                    }}
                  ></div>
                )}
                <button
                  aria-label={t.buttons.moreOptions}
                  onClick={(e) => {
                    contextMenu(e);
                    e.stopPropagation();
                  }}
                  dangerouslySetInnerHTML={{
                    __html: superstate.ui.getSticker("ui//options"),
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
                      __html: superstate.ui.getSticker("ui//plus"),
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
