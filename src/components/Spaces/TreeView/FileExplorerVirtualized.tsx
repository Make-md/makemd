import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  UniqueIdentifier,
  useDndMonitor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtual } from "@tanstack/react-virtual";
import {
  IndicatorState,
  SortableTreeItem,
} from "components/Spaces/TreeView/FolderTreeView";
import useForceUpdate from "hooks/ForceUpdate";
import MakeMDPlugin from "main";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { Space } from "schemas/spaces";
import {
  TreeNode,
  flattenedTreeFromVaultItems,
  folderSortFn,
  retrieveFolders,
  spaceRowHeight,
  spaceToTreeNode,
  vaulItemToTreeNode,
} from "superstate/spacesStore/spaces";
import { FileMetadataCache } from "types/cache";
import {
  ActivePathEvent,
  CustomVaultChangeEvent,
  Path,
  SpaceChangeEvent,
  eventTypes,
} from "types/types";
import { uniq } from "utils/array";
import { getDragDepth, getProjection } from "utils/dnd/dragFile";
import { dropFileInTree } from "utils/dnd/dropFile";
import { getAbstractFileAtPath } from "utils/file";
import { safelyParseJSON } from "utils/json";
import { parseSortStrat } from "utils/parser";
import { pathByString } from "utils/path";

interface FileExplorerComponentProps {
  plugin: MakeMDPlugin;
  viewType: "root" | "space" | "all";
  activeSpace?: string;
}

const VirtualizedList = React.memo(function VirtualizedList(props: {
  flattenedTree: TreeNode[];
  projected: any;
  handleCollapse: any;
  plugin: MakeMDPlugin;
  selectedFiles: TreeNode[];
  vRef: any;
  activeFile: Path;
  selectRange: any;
  indentationWidth: number;
}) {
  const {
    flattenedTree,
    projected,
    vRef,
    selectedFiles,
    activeFile,
    selectRange,
    handleCollapse,
    plugin,
    indentationWidth,
  } = props;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = (index: number) =>
    flattenedTree[index].parentId == null
      ? spaceRowHeight(plugin) + 8
      : spaceRowHeight(plugin);
  const rowVirtualizer = useVirtual({
    size: flattenedTree.length,
    paddingEnd: 24,
    parentRef,
    estimateSize: React.useCallback(
      (index) => rowHeight(index),
      [flattenedTree]
    ), // This is just a best guess
    overscan: plugin.settings.spacesPerformance ? 0 : 20,
  });
  vRef.current = rowVirtualizer;
  rowVirtualizer.scrollToIndex;
  return (
    <div
      ref={parentRef}
      style={
        {
          width: `100%`,
          height: `100%`,
          overflow: "auto",
          "--spaceRowHeight": spaceRowHeight(plugin),
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
            <SortableTreeItem
              key={flattenedTree[virtualRow.index].id}
              id={flattenedTree[virtualRow.index].id}
              data={flattenedTree[virtualRow.index]}
              disabled={false}
              depth={flattenedTree[virtualRow.index].depth}
              childCount={flattenedTree[virtualRow.index].childrenCount}
              indentationWidth={indentationWidth}
              indicator={
                projected?.sortable &&
                projected?.overId == flattenedTree[virtualRow.index].id
                  ? flattenedTree[virtualRow.index].parentId == null &&
                    projected.parentId == null
                    ? { state: IndicatorState.Top, depth: projected.depth }
                    : { state: IndicatorState.Bottom, depth: projected.depth }
                  : null
              }
              plugin={plugin}
              style={{}}
              onSelectRange={selectRange}
              active={
                activeFile?.path ==
                (flattenedTree[virtualRow.index].item
                  ? flattenedTree[virtualRow.index].item.path
                  : flattenedTree[virtualRow.index].space + "//")
              }
              highlighted={
                projected &&
                !projected.sortable &&
                (projected.parentId ==
                  flattenedTree[virtualRow.index].parentId ||
                  projected.parentId == flattenedTree[virtualRow.index].id)
              }
              selected={(selectedFiles as TreeNode[]).some(
                (g) => g.id == flattenedTree[virtualRow.index].id
              )}
              collapsed={flattenedTree[virtualRow.index].collapsed}
              onCollapse={handleCollapse}
            ></SortableTreeItem>
          </div>
        ))}
      </div>
    </div>
  );
});

export const FileExplorerComponent = (props: FileExplorerComponentProps) => {
  const { plugin } = props;
  const indentationWidth = 24;
  const [vaultItems, setVaultItems] = useState<
    Record<string, FileMetadataCache[]>
  >({});
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, string[]>
  >(plugin.settings.expandedFolders);
  const [expandedSpaces, setExpandedSpaces] = useState<string[]>(
    plugin.settings.expandedSpaces
  );
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedFiles, setSelectedFiles] = useRecoilState(
    recoilState.selectedFiles
  );
  const nextTreeScrollPath = useRef(null);

  const activeSpaces = useMemo(
    () =>
      props.viewType == "root"
        ? spaces.filter((f) => f.pinned == "false" || f.pinned == "home")
        : props.viewType == "space"
        ? spaces.filter((f) => f.name == props.activeSpace)
        : spaces.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [spaces, props.activeSpace, props.viewType]
  );
  // const [dropPlaceholderItem, setDropPlaceholderItem] = useState<[Record<string, string>, number] | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const listRef = useRef<{ scrollToIndex: (index: number) => void }>(null);
  const forceUpdate = useForceUpdate();
  const treeForSpace = (space: Space) => {
    const tree: TreeNode[] = [];
    const spaceCollapsed = !expandedSpaces.includes(space.name);
    const spaceSort = safelyParseJSON(space.sort) ?? ["rank", true];
    tree.push(spaceToTreeNode(space, spaceCollapsed, true));
    if (!spaceCollapsed)
      (vaultItems[space.name + "/"] ?? [])
        .sort(folderSortFn(spaceSort[0], spaceSort[1]))
        .forEach((item) => {
          const itemCollapsed = !expandedFolders[space.name]?.includes(
            item.path
          );
          const items = [];
          if (!itemCollapsed) {
            const [sortStrat, dir] =
              item.folderSort?.length > 0
                ? parseSortStrat(item.folderSort)
                : spaceSort;
            items.push(
              ...flattenedTreeFromVaultItems(
                item.path,
                space.name,
                vaultItems,
                expandedFolders[space.name] ?? [],
                2,
                sortStrat,
                dir
              )
            );
          }
          items.splice(
            0,
            0,
            vaulItemToTreeNode(
              item,
              space.name,
              "",
              1,
              0,
              itemCollapsed,
              space.def.type == "focus" &&
                (spaceSort[0] == "rank" || spaceSort[0] == ""),
              items.length
            )
          );
          tree.push(...items);
        });
    return tree;
  };
  const flattenedTree = useMemo(() => {
    const tree: TreeNode[] = [];
    activeSpaces.forEach((space) => {
      tree.push(...treeForSpace(space));
    });

    if (nextTreeScrollPath.current) {
      const index = tree.findIndex(
        (f) => f.item?.path == nextTreeScrollPath.current
      );
      if (index != -1) {
        listRef.current.scrollToIndex(index);
        nextTreeScrollPath.current = null;
      }
    }
    return tree;
  }, [
    vaultItems,
    activeSpaces,
    expandedSpaces,
    expandedFolders,
    props.activeSpace,
  ]);

  useEffect(() => {
    if (selectedFiles.length <= 1) {
      if (!selectedFiles[0] || selectedFiles[0].item.path != activeFile?.path)
        setSelectedFiles([]);
      if (plugin.settings.revealActiveFile) revealFile(activeFile);
    }
    window.addEventListener(eventTypes.activePathChange, changeActiveFile);
    return () => {
      window.removeEventListener(eventTypes.activePathChange, changeActiveFile);
    };
  }, [activeFile]);
  // Persistant Settings

  useEffect(() => {
    window.addEventListener(eventTypes.refreshView, forceUpdate);
    window.addEventListener(eventTypes.settingsChanged, settingsChanged);

    return () => {
      window.removeEventListener(eventTypes.refreshView, forceUpdate);
      window.removeEventListener(eventTypes.settingsChanged, settingsChanged);
    };
  }, []);

  useEffect(() => {
    window.addEventListener(eventTypes.revealFile, handleRevealFileEvent);
    return () => {
      window.removeEventListener(eventTypes.revealFile, handleRevealFileEvent);
    };
  }, [activeSpaces]);

  const revealFile = (path: Path) => {
    const space = activeSpaces.find((f) => f.def.folder == "/");
    if (!space || !path || (path.type != "file" && path.type != "folder"))
      return;

    const file = getAbstractFileAtPath(app, path.path);
    const folders = file.path.split("/");
    const openPaths = folders
      .reduce(
        (p, c, index) => [...p, index == 0 ? c : `${p[index]}/${c}`],
        ["/"]
      )
      .slice(0, -1);
    const newOpenFolders = [
      ...(expandedFolders[space.name]?.filter(
        (f) => !openPaths.find((g) => g == f)
      ) ?? []),
      ...openPaths,
    ];
    plugin.settings.expandedFolders = {
      ...expandedFolders,
      [space.name]: newOpenFolders,
    };
    nextTreeScrollPath.current = file.path;
    plugin.saveSettings();
  };
  const handleRevealFileEvent = (evt: CustomVaultChangeEvent) => {
    if (evt.detail) revealFile(pathByString(evt.detail.file.path));
  };
  const retrieveData = async (folders: string[]) => {
    setSpaces(plugin.index.allSpaces());
    const spaceItems = plugin.index.spacesMap;
    setVaultItems((g) => ({
      ...g,
      ...[...plugin.index.spacesIndex.keys()].reduce(
        (p, c) => ({
          ...p,
          [c + "/"]: [...(spaceItems.getInverse(c) ?? [])]
            .map((f) => {
              const fileCache = plugin.index.filesIndex.get(f);
              return { ...fileCache, rank: fileCache?.spaceRanks?.[c] };
            })
            .filter((f) => f),
        }),
        {}
      ),
    }));
    retrieveFolders(plugin, folders).then((f) =>
      setVaultItems((g) => ({ ...g, ...f }))
    );
  };
  const flatFolders = useMemo(() => {
    const allFolders: string[] = [];
    expandedSpaces.forEach((space) => {
      allFolders.push(...(expandedFolders[space] ?? []));
    });
    return allFolders;
  }, [expandedSpaces, expandedFolders]);

  useEffect(() => {
    const newFolders = flatFolders;
    retrieveData(newFolders);
    window.addEventListener(eventTypes.spacesChange, spaceChangeEvent);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, spaceChangeEvent);
    };
  }, [flatFolders]);

  const spaceChangeEvent = (evt: SpaceChangeEvent) => {
    if (
      evt.detail.type == "vault" ||
      evt.detail.type == "space" ||
      evt.detail.type == "sync"
    ) {
      retrieveData(flatFolders);
    }
  };

  const changeActiveFile = (evt: CustomEvent<ActivePathEvent>) => {
    const path: Path = evt.detail.path;
    setActiveFile(path);
  };

  const settingsChanged = () => {
    setExpandedFolders(plugin.settings.expandedFolders);
    setExpandedSpaces(plugin.settings.expandedSpaces);
  };

  useEffect(() => {
    settingsChanged();
  }, []);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    parentId: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);

  useEffect(() => {
    if (!expandedSpaces.includes(props.activeSpace)) {
      plugin.settings.expandedSpaces = uniq([
        ...plugin.settings.expandedSpaces,
        props.activeSpace,
      ]);
      plugin.saveSettings();
    }
  }, [props.activeSpace]);

  const sortedIds = useMemo(
    () => flattenedTree.map(({ id }) => id),
    [flattenedTree]
  );

  const selectRange = (fromId: string) => {
    const startIndex = sortedIds.findIndex((f) => f == fromId);
    const selectedFilesStartIndex = sortedIds.findIndex(
      (f) => f == selectedFiles[0]?.id
    );
    const selectedFilesEndIndex = sortedIds.findIndex(
      (f) => f == selectedFiles[selectedFiles.length - 1]?.id
    );
    if (startIndex < selectedFilesStartIndex) {
      setSelectedFiles(
        flattenedTree
          .slice(startIndex, selectedFilesEndIndex + 1)
          .filter((f) => f.item)
      );
    } else {
      setSelectedFiles(
        flattenedTree
          .slice(selectedFilesStartIndex, startIndex + 1)
          .filter((f) => f.item)
      );
    }
  };

  const activeItem = activeId
    ? flattenedTree.find(({ id }) => id === activeId)
    : null;

  const overIndex = overId
    ? flattenedTree.findIndex(({ id }) => id === overId)
    : null;

  const overItem = flattenedTree[overIndex];
  const nextItem = flattenedTree[overIndex + 1];

  const dragDepth = useMemo(() => {
    return getDragDepth(offsetLeft, indentationWidth);
  }, [offsetLeft]);

  const projected = useMemo(() => {
    return activeId && overId
      ? getProjection(
          flattenedTree,
          activeItem,
          overIndex,
          overItem,
          nextItem,
          dragDepth
        )
      : null;
  }, [flattenedTree, activeItem, overItem, nextItem, overIndex, dragDepth]);

  function handleDragStart(event: DragStartEvent) {
    const {
      active: { id: activeId },
    } = event;
    const activeItem = flattenedTree.find(({ id }) => id === activeId);
    //Dont drag vault
    setActiveId(activeId);
    setOverId(activeId);

    if (activeItem) {
      setCurrentPosition({
        parentId: activeItem.parentId,
        overId: activeId,
      });
    }

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(Math.max(1, delta.x));
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overId = over?.id;
    if (overId) {
      // if (!FileTreeUtils.nodeIsAncestorOfTarget(activeItem, flattenedItems.find(f => f.id == overId))) {
      setOverId(over?.id ?? null);
      // }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();
    dropFileInTree(
      plugin,
      active,
      over,
      projected,
      flattenedTree,
      activeSpaces
    );
  }

  const adjustTranslate: Modifier = ({ transform }) => {
    return {
      ...transform,
      x: transform.x,
      y: transform.y - 10,
    };
  };

  function handleDragCancel() {
    resetState();
  }

  const handleCollapse = useCallback(
    (folder: TreeNode, open: boolean) => {
      if (folder.parentId == null) {
        if (plugin.settings.expandedSpaces.includes(folder.space) && !open)
          plugin.settings.expandedSpaces =
            plugin.settings.expandedSpaces.filter((f) => f != folder.space);
        else
          plugin.settings.expandedSpaces = [
            ...plugin.settings.expandedSpaces,
            folder.space,
          ];
        plugin.saveSettings();
      } else {
        const openFolders = expandedFolders[folder.space] ?? [];
        const folderOpen = openFolders?.includes(folder.item.path);
        const newOpenFolders: string[] =
          !folderOpen || open
            ? ([...openFolders, folder.item.path] as string[])
            : (openFolders.filter(
                (openFolder) => folder.item.path !== openFolder
              ) as string[]);
        plugin.settings.expandedFolders = {
          ...expandedFolders,
          [folder.space]: newOpenFolders,
        };
        plugin.saveSettings();
      }
    },
    [plugin, expandedFolders, expandedSpaces]
  );

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    // setDropPlaceholderItem(null);
    document.body.style.setProperty("cursor", "");
  }
  useDndMonitor({
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  });

  return (
    <div className="mk-file-tree">
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <VirtualizedList
          vRef={listRef}
          flattenedTree={flattenedTree}
          projected={projected}
          handleCollapse={handleCollapse}
          activeFile={activeFile}
          plugin={plugin}
          selectedFiles={selectedFiles}
          selectRange={selectRange}
          indentationWidth={indentationWidth}
        ></VirtualizedList>
        {createPortal(
          <DragOverlay
            dropAnimation={null}
            modifiers={[adjustTranslate]}
            zIndex={1600}
          >
            {activeId ? (
              <SortableTreeItem
                id={activeId}
                data={flattenedTree.find((f) => f.id == activeId)}
                indicator={null}
                depth={0}
                disabled={false}
                plugin={plugin}
                selected={false}
                highlighted={false}
                active={false}
                clone
                childCount={0}
                style={{}}
                indentationWidth={indentationWidth}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </div>
  );
};
