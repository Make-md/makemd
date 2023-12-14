import i18n from "core/i18n";
import { isEqual } from "lodash";

import { NavigatorContext } from "core/react/context/SidebarContext";
import { PathStateWithRank, Superstate } from "core/superstate/superstate";
import {
  TreeNode,
  pathStateToTreeNode,
  spaceSortFn,
  spaceToTreeNode,
} from "core/superstate/utils/spaces";
import { PathState, SpaceState } from "core/types/superstate";
import { CustomVaultChangeEvent, eventTypes } from "core/types/types";
import {
  DragProjection,
  getDragDepth,
  getProjection,
} from "core/utils/dnd/dragPath";
import { dropPathsInTree } from "core/utils/dnd/dropPath";
import { normalizedAltName } from "core/utils/keyboard";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pos } from "types/Pos";
import { eventToModifier } from "./SpaceTreeItem";
import { VirtualizedList } from "./SpaceTreeVirtualized";

interface SpaceTreeComponentProps {
  superstate: Superstate;
}

export const SpaceTreeComponent = (props: SpaceTreeComponentProps) => {
  const { superstate } = props;
  const indentationWidth = 16;

  const [expandedSpaces, setExpandedSpaces] = useState<string[]>(
    superstate.settings.expandedSpaces
  );

  const {
    activePath: activePath,
    activeViewSpace,
    setActivePath: setActivePath,
    selectedPaths: selectedPaths,
    setSelectedPaths: setSelectedPaths,
    dragPaths,
    setDragPaths,
    queryResults,

    queryMode,
    modifier,
    setModifier,
  } = useContext(NavigatorContext);

  const [activeId, setActiveId] = useState<string>(null);
  const [overId, setOverId] = useState<string>(null);
  const nextTreeScrollPath = useRef(null);

  // const [dropPlaceholderItem, setDropPlaceholderItem] = useState<[Record<string, string>, number] | null>(null);
  const [offset, setOffset] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const listRef = useRef<{ scrollToIndex: (index: number) => void }>(null);

  const treeForPaths = (paths: string[]) => {
    const tree: TreeNode[] = [];
    paths
      .map((f) => {
        const pathState = props.superstate.pathsIndex.get(f);
        return {
          ...pathState,
        } as PathState;
      })
      .filter((f) => f)
      .forEach((item) => {
        if (!superstate.spacesIndex.has(item.path)) {
          item = item as PathState;

          tree.push(
            pathStateToTreeNode(
              superstate,
              item,
              item.parent,
              item.path,
              0,
              0,
              false,
              false,
              0,
              null
            )
          );
        } else {
          tree.push(
            ...treeForSpace(
              superstate.spacesIndex.get(item.path),
              item,
              0,
              null,
              activeId,
              false,
              false,
              null
            )
          );
        }
      });
    return tree;
  };
  const treeForRoot = (space: SpaceState, activeId: string) => {
    const tree: TreeNode[] = [];

    const spaceSort = space.metadata?.sort ?? {
      field: "rank",
      asc: true,
      group: true,
    };

    const children = superstate.getSpaceItems(space.path) ?? [];
    children.sort(spaceSortFn(spaceSort)).forEach((item) => {
      const _parentId = space.path;
      if (item.type != "space") {
        const id = _parentId + "/" + item.path;
        const itemCollapsed = !expandedSpaces.includes(id);
        tree.push(
          pathStateToTreeNode(
            superstate,
            item,
            space.path,
            item.path,
            0,
            0,
            itemCollapsed,
            space.sortable,
            0,
            _parentId
          )
        );
      } else {
        if (superstate.spacesIndex.has(item.path))
          tree.push(
            ...treeForSpace(
              superstate.spacesIndex.get(item.path),
              item,
              0,
              _parentId,
              activeId,
              space.sortable,
              false,
              space.path
            )
          );
      }
    });
    return tree;
  };

  const treeForSpace = (
    space: SpaceState,
    path: PathStateWithRank,
    depth: number,
    parentId: string,
    activeId: string,
    sortable: boolean,
    root: boolean,
    parentPath: string
  ) => {
    const tree: TreeNode[] = [];
    const id = parentId ? parentId + "/" + space.path : space.path;
    const spaceCollapsed = !expandedSpaces.includes(id) || activeId == id;
    const spaceSort = space.metadata?.sort ?? {
      field: "rank",
      asc: true,
      group: true,
    };

    const children = superstate.getSpaceItems(space.path) ?? [];

    if (!spaceCollapsed || root) {
      children.sort(spaceSortFn(spaceSort)).forEach((item) => {
        const _parentId = parentId ? parentId + "/" + space.path : space.path;
        if (item.type != "space") {
          tree.push(
            pathStateToTreeNode(
              superstate,
              item,
              space.path,
              item.path,
              depth + 1,
              0,
              true,
              space.sortable,
              0,
              _parentId
            )
          );
        } else {
          if (superstate.spacesIndex.has(item.path)) {
            tree.push(
              ...treeForSpace(
                superstate.spacesIndex.get(item.path),
                item,
                depth + 1,
                _parentId,
                activeId,
                space.sortable,
                false,
                space.path
              )
            );
          }
        }
      });
    }
    if (!root)
      tree.splice(
        0,
        0,
        spaceToTreeNode(
          path,
          spaceCollapsed,
          sortable,
          depth,
          parentId,
          parentPath,
          tree.length
        )
      );
    return tree;
  };
  const [flattenedTree, setFlattenedTree] = useState<TreeNode[]>([]);
  const refreshableSpaces = useMemo(
    () =>
      [
        activeViewSpace?.path,
        ...flattenedTree.filter((f) => f.type == "space").map((f) => f.path),
      ].filter((f) => f),
    [activeViewSpace, flattenedTree]
  );
  const retrieveData = () => {
    if (queryMode) {
      setFlattenedTree(treeForPaths(queryResults));
      return;
    }
    if (!activeViewSpace) return setFlattenedTree([]);
    const tree: TreeNode[] = [];

    tree.push(...treeForRoot(activeViewSpace, activeId));

    if (nextTreeScrollPath.current) {
      const index = tree.findIndex(
        (f) => f.item?.path == nextTreeScrollPath.current
      );
      if (index != -1) {
        listRef.current.scrollToIndex(index);
        nextTreeScrollPath.current = null;
      }
    }
    setFlattenedTree(tree);
  };

  useEffect(() => {
    if (selectedPaths.length <= 1) {
      if (!selectedPaths[0] || selectedPaths[0].item.path != activePath)
        setSelectedPaths([]);
      if (superstate.settings.revealActiveFile) revealPath(activePath);
    }
    props.superstate.ui.eventsDispatch.addListener(
      "activePathChanged",
      changeActivePath
    );
    return () => {
      props.superstate.ui.eventsDispatch.removeListener(
        "activePathChanged",
        changeActivePath
      );
    };
  }, [activePath]);

  useEffect(() => {
    window.addEventListener("dragend", resetState);
    return () => {
      window.removeEventListener("dragend", resetState);
    };
  });
  // Persistant Settings

  useEffect(() => {
    superstate.eventsDispatcher.addListener("settingsChanged", settingsChanged);

    return () => {
      superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        settingsChanged
      );
    };
  }, [activeViewSpace]);

  useEffect(() => {
    window.addEventListener(eventTypes.revealPath, handleRevealPathEvent);
    return () => {
      window.removeEventListener(eventTypes.revealPath, handleRevealPathEvent);
    };
  }, [activeViewSpace]);

  const revealPath = (path: string) => {
    if (!path || activeViewSpace.path != "/") return;

    const folders = path.split("/");
    const openPaths = folders
      .reduce(
        (p, c, index) => [...p, index == 0 ? c : `/${p[index]}/${c}`],
        ["/"]
      )
      .slice(0, -1);
    const newOpenFolders = [
      ...(expandedSpaces.filter((f) => !openPaths.find((g) => g == f)) ?? []),
      ...openPaths,
    ];
    superstate.settings.expandedSpaces = newOpenFolders;
    nextTreeScrollPath.current = "/" + path;
    superstate.saveSettings();
  };
  const handleRevealPathEvent = (evt: CustomVaultChangeEvent) => {
    if (evt.detail) revealPath(evt.detail.path);
  };

  useEffect(() => {
    retrieveData();

    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      retrieveData
    );

    return () => {
      props.superstate.eventsDispatcher.addListener(
        "superstateUpdated",
        retrieveData
      );
    };
  }, [expandedSpaces, activeViewSpace, activeId, queryResults, queryMode]);

  useEffect(() => {
    const spaceUpdated = (payload: { path: string }) => {
      if (refreshableSpaces.some((f) => f == payload.path)) {
        retrieveData();
      }
    };

    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      spaceUpdated
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        spaceUpdated
      );
    };
  }, [refreshableSpaces]);

  const changeActivePath = (path: string) => {
    setActivePath(path);
  };

  const settingsChanged = () => {
    setExpandedSpaces(superstate.settings.expandedSpaces);
  };

  const overIndex = useMemo(
    () => flattenedTree.findIndex((f) => f.id == overId),
    [overId, flattenedTree]
  );
  const activeIndex = useMemo(
    () => flattenedTree.findIndex((f) => f.id == activeId),
    [activeId, flattenedTree]
  );

  const sortedIds = useMemo(
    () => flattenedTree.map(({ id }) => id),
    [flattenedTree]
  );

  const selectRange = useCallback(
    (fromId: string) => {
      const startIndex = sortedIds.findIndex((f) => f == fromId);
      const selectedPathsStartIndex = sortedIds.findIndex(
        (f) => f == selectedPaths[0]?.id
      );
      const selectedPathsEndIndex = sortedIds.findIndex(
        (f) => f == selectedPaths[selectedPaths.length - 1]?.id
      );

      if (startIndex < selectedPathsStartIndex) {
        setSelectedPaths(
          flattenedTree
            .slice(startIndex, selectedPathsEndIndex + 1)
            .filter((f) => f.item)
        );
      } else {
        setSelectedPaths(
          flattenedTree
            .slice(selectedPathsStartIndex, startIndex + 1)
            .filter((f) => f.item)
        );
      }
    },
    [sortedIds, selectedPaths, setSelectedPaths, flattenedTree]
  );

  const [projected, setProjected] = useState<DragProjection>(null);
  useEffect(() => {
    const dragDepth = getDragDepth(offset.x, indentationWidth);
    const activeItem = flattenedTree.find(({ id }) => id === activeId);
    const _projected = overId
      ? getProjection(
          activeItem,
          flattenedTree,
          dragPaths,
          overIndex,
          dragDepth,
          offset.y,
          activeIndex < overIndex,
          modifier
        )
      : null;
    setProjected((p) => (!isEqual(p, _projected) ? _projected : p));
  }, [
    activeId,
    flattenedTree,
    overId,
    overIndex,
    dragPaths,
    offset,
    activeIndex,
    modifier,
    activeViewSpace,
  ]);

  const dragStarted = (activeId: string) => {
    const activeItem = flattenedTree.find(({ id }) => id === activeId);
    //Dont drag vault
    setActiveId(activeId);
    setOverId(activeId);

    if (activeItem) {
      if (selectedPaths.length > 1) {
        setDragPaths(selectedPaths.map((f) => f.path));
      } else {
        setDragPaths([activeItem.path]);
      }
    }

    document.body.style.setProperty("cursor", "grabbing");
  };

  const parentName = useMemo(
    () =>
      projected
        ? flattenedTree.find((f) => f.id == projected.parentId)?.item?.name ??
          activeViewSpace?.name
        : null,
    [flattenedTree, projected, activeViewSpace]
  );
  const overName = useMemo(
    () =>
      projected &&
      flattenedTree.find((f) => f.id == projected.overId)?.item?.name,
    [flattenedTree, projected]
  );

  const dragOver = (
    e: React.DragEvent<HTMLElement>,
    _overId: string,
    position: Pos
  ) => {
    const modifier = eventToModifier(e);
    setModifier(modifier);
    e.dataTransfer.dropEffect = modifier;
    if (projected) {
      superstate.ui.setDragLabel(
        `${
          projected.reorder && !projected.insert
            ? i18n.labels.reorderIn
            : modifier == "move" || !modifier
            ? i18n.labels.moveTo
            : modifier == "link"
            ? i18n.labels.addTo
            : i18n.labels.copyTo
        } ${projected.insert ? overName : parentName}`
      );
    }
    if (dragPaths.length > 1) {
      if (_overId && _overId != overId) setOverId(_overId);
      return;
    }
    if (_overId && _overId != overId) setOverId(_overId);
    const x = offset.x;
    const y = offset.y;
    const newX =
      2 * Math.round(Math.max(1, position.x - indentationWidth - 20));
    const newY = 2 * Math.round(position.y / 2);
    if (x != newX || y != newY) {
      setOffset({
        x: newX,
        y: newY,
      });
    }
  };
  useEffect(() => {
    if (dragPaths.length == 0) {
      setOverId(null);
      setActiveId(null);
      setOffset({ x: 0, y: 0 });
      setModifier(null);
      setProjected(null);
      dragCounter.current = 0;
      // setDropPlaceholderItem(null);
      document.body.style.setProperty("cursor", "");
    }
  }, [dragPaths]);

  const dragEnded = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    const modifiers = eventToModifier(e);
    dropPathsInTree(
      superstate,
      dragPaths,
      activeId,
      overId,
      projected,
      flattenedTree,
      activeViewSpace,
      modifiers
    );
    resetState();
  };

  const handleCollapse = useCallback(
    (folder: TreeNode, open: boolean) => {
      const folderOpen = expandedSpaces?.includes(folder.id);
      const newOpenFolders: string[] =
        !folderOpen || open
          ? ([...expandedSpaces, folder.id] as string[])
          : (expandedSpaces.filter(
              (openFolder) => folder.id !== openFolder
            ) as string[]);
      superstate.settings.expandedSpaces = newOpenFolders;
      superstate.saveSettings();
    },
    [superstate, expandedSpaces]
  );

  function resetState() {
    setDragPaths([]);
    setOverId(null);
    setActiveId(null);
    setOffset({ x: 0, y: 0 });
    setModifier(null);
    setProjected(null);
    dragCounter.current = 0;
    // setDropPlaceholderItem(null);
    document.body.style.setProperty("cursor", "");
  }

  const dragCounter = useRef(0);

  const dragEnter = () => {
    dragCounter.current++;
  };
  const dragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current == 0) {
      setOverId(null);
      setOffset({ x: 0, y: 0 });
      setProjected(null);
      dragCounter.current = 0;
    }
  };
  return (
    <div
      className="mk-path-tree"
      onDragEnter={() => dragEnter()}
      onDragLeave={() => dragLeave()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (overId) {
          dragEnded(e, overId);
        } else {
          resetState();
        }
      }}
    >
      <VirtualizedList
        vRef={listRef}
        flattenedTree={flattenedTree}
        projected={projected}
        handleCollapse={handleCollapse}
        activePath={activePath}
        superstate={superstate}
        selectedPaths={selectedPaths}
        selectRange={selectRange}
        indentationWidth={indentationWidth}
        dragStarted={dragStarted}
        dragOver={dragOver}
        dragEnded={dragEnded}
        overIndex={overIndex}
        activeIndex={activeIndex}
      ></VirtualizedList>

      {modifier && (
        <div
          className="mk-hint-dnd"
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            background: "var(--interactive-accent)",
            boxShadow: "var(--background-modifier-box-shadow)",
            padding: "4px 8px",
            borderRadius: "4px",
            color: "var(--text-on-accent)",
            fontSize: "var(--font-ui-smaller)",
          }}
        >
          <div>
            {i18n.hintText.dragDropModifierKeys
              .replace("${1}", "shift")
              .replace("${2}", normalizedAltName())}
          </div>
        </div>
      )}
    </div>
  );
};
