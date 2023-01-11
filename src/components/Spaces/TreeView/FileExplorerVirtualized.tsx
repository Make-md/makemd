import {
  Active, DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent, Modifier, Over, UniqueIdentifier,
  useDndMonitor
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useVirtual } from "@tanstack/react-virtual";
import {
  IndicatorState,
  SortableTreeItem
} from "components/Spaces/TreeView/FolderTreeView";
import useForceUpdate from "hooks/ForceUpdate";
import t from "i18n";
import { debounce } from "lodash";
import MakeMDPlugin from "main";
import { Notice, TAbstractFile } from "obsidian";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { Space, VaultItem } from "schemas/spaces";
import {
  CustomVaultChangeEvent,
  eventTypes, SpaceChangeEvent
} from "types/types";
import {
  getAbstractFileAtPath, platformIsMobile
} from "utils/file";
import {
  flattenedTreeFromVaultItems,
  folderSortFn,
  insertSpaceAtIndex,
  insertSpaceItemAtIndex,
  moveAFileToNewParentAtIndex,
  retrieveFolders,
  retrieveSpaceItems,
  retrieveSpaces,
  spaceItemToTreeNode,
  TreeNode,
  updateFileRank,
  vaulItemToTreeNode,
  vaultItemForPath
} from "utils/spaces/spaces";
import { safelyParseJSON, uniq } from "utils/tree";
import { getDragDepth, getProjection } from "utils/ui/dnd";

interface FileExplorerComponentProps {
  plugin: MakeMDPlugin;
  activeSpace?: string;
}

const VirtualizedList = React.memo(
  (props: {
    flattenedTree: TreeNode[];
    projected: any;
    handleCollapse: any;
    plugin: MakeMDPlugin;
    selectedFiles: TreeNode[];
    vRef: any;
    activeFile: string;
    selectRange: any;
    indentationWidth: any;
  }) => {
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
      platformIsMobile()
        ? flattenedTree[index].parentId == null
          ? 52
          : 40
        : flattenedTree[index].parentId == null
        ? 40
        : 29;
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
        style={{
          width: `100%`,
          height: `100%`,
          overflow: "auto",
        }}
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
                childCount={0}
                indentationWidth={indentationWidth}
                indicator={
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
                  activeFile == flattenedTree[virtualRow.index].item?.path
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
  }
);

export const FileExplorerComponent = (props: FileExplorerComponentProps) => {
  const { plugin } = props;
  const indentationWidth = 24;
  const isMobile = platformIsMobile();
  const [vaultItems, setVaultItems] = useState<Record<string, VaultItem[]>>({});
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, string[]>
  >(plugin.settings.expandedFolders);
  const [expandedSpaces, setExpandedSpaces] = useState<string[]>(
    plugin.settings.expandedSpaces
  );
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const [spaces, setSpaces] = useRecoilState(recoilState.spaces);
  const [vaultSort, setVaultSort] = useState<[string, boolean]>(
    plugin.settings.vaultSort.length == 2
      ? plugin.settings.vaultSort
      : ["rank", true]
  );
  const [selectedFiles, setSelectedFiles] = useRecoilState(
    recoilState.selectedFiles
  );
  const nextTreeScrollPath = useRef(null);

  const activeSpaces = useMemo(
    () =>
      props.activeSpace
        ? spaces.filter((f) => f.name == props.activeSpace)
        : spaces.filter((f) => f.pinned != "true"),
    [spaces, props.activeSpace]
  );

  // const [dropPlaceholderItem, setDropPlaceholderItem] = useState<[Record<string, string>, number] | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const listRef = useRef<{ scrollToIndex: (index: number) => void }>(null);
  const forceUpdate = useForceUpdate();
  const treeForSpace = (space: Space) => {
    let tree: TreeNode[] = [];
    const spaceCollapsed = !expandedSpaces.includes(space.name);
    const spaceSort = safelyParseJSON(space.sort) ?? ["rank", true];
    tree.push(spaceItemToTreeNode(space, spaceCollapsed, spaceSort));
    if (!spaceCollapsed)
      (vaultItems[space.name + "/"] ?? [])
        .sort(folderSortFn(spaceSort[0], spaceSort[1]))
        .forEach((item) => {
          const itemCollapsed = !expandedFolders[space.name]?.includes(
            item.path
          );
          tree.push(
            vaulItemToTreeNode(
              item,
              space.name,
              "",
              1,
              0,
              itemCollapsed,
              spaceSort[0] == "rank" || spaceSort[0] == ""
            )
          );
          if (!itemCollapsed)
            tree.push(
              ...flattenedTreeFromVaultItems(
                item.path,
                space.name,
                vaultItems,
                expandedFolders[space.name] ?? [],
                2,
                spaceSort[0],
                spaceSort[1]
              )
            );
        });
    return tree;
  };
  const flattenedTree = useMemo(() => {
    let tree: TreeNode[] = [];

    activeSpaces.forEach((space) => {
      tree.push(...treeForSpace(space));
    });
    if (!props.activeSpace) {
      const vaultCollapsed = !expandedSpaces.includes("/");
      tree.push({
        id: "/",
        parentId: null,
        depth: 0,
        index: 0,
        space: "/",
        item: null,
        collapsed: vaultCollapsed,
        sortable: vaultSort[0] == "rank",
      });
      if (!vaultCollapsed)
        tree.push(
          ...flattenedTreeFromVaultItems(
            "/",
            "/",
            vaultItems,
            expandedFolders["/"] ?? [],
            1,
            vaultSort[0],
            vaultSort[1]
          )
        );
    }
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
    vaultSort,
    props.activeSpace,
  ]);

  useEffect(() => {
    if (selectedFiles.length <= 1) {
      if (!selectedFiles[0] || selectedFiles[0].item.path != activeFile)
        setSelectedFiles([]);
      if (plugin.settings.revealActiveFile)
        revealFile(getAbstractFileAtPath(app, activeFile));
    }
    window.addEventListener(eventTypes.activeFileChange, changeActiveFile);
    return () => {
      window.removeEventListener(eventTypes.activeFileChange, changeActiveFile);
    };
  }, [activeFile]);
  // Persistant Settings

  

  useEffect(() => {
    window.addEventListener(eventTypes.refreshView, forceUpdate);
    window.addEventListener(eventTypes.settingsChanged, settingsChanged);
    window.addEventListener(eventTypes.revealFile, handleRevealFileEvent);
    return () => {
      window.removeEventListener(eventTypes.refreshView, forceUpdate);
      window.removeEventListener(eventTypes.settingsChanged, settingsChanged);
      window.removeEventListener(eventTypes.revealFile, handleRevealFileEvent);
    };
  }, []);

  const revealFile = (file: TAbstractFile) => {
    if (!file) return;
    const folders = file.path.split("/");
    const openPaths = folders
      .reduce(
        (p, c, index) => [...p, index == 0 ? c : `${p[index]}/${c}`],
        ["/"]
      )
      .slice(0, -1);
    const newOpenFolders = [
      ...(expandedFolders["/"]?.filter((f) => !openPaths.find((g) => g == f)) ??
        []),
      ...openPaths,
    ];
    plugin.settings.expandedFolders = {
      ...expandedFolders,
      "/": newOpenFolders,
    };
    nextTreeScrollPath.current = file.path;
    plugin.saveSettings();
  };
  const handleRevealFileEvent = (evt: CustomVaultChangeEvent) => {
    if (evt.detail) revealFile(evt.detail.file);
  };

  useEffect(() => {
    const spaceItems = retrieveSpaceItems(plugin, spaces);
    setVaultItems((g) => ({
      ...g,
      ...Object.keys(spaceItems).reduce(
        (p, c) => ({
          ...p,
          [c + "/"]: spaceItems[c].map((f) => ({
            ...(vaultItemForPath(plugin, f.path) ?? {}),
            ...f,
          })),
        }),
        {}
      ),
    }));
  }, [spaces]);
  const retrieveData = async (folders: string[]) => {
    setSpaces(retrieveSpaces(plugin));
    retrieveFolders(plugin, folders).then((f) =>
      setVaultItems((g) => ({ ...g, ...f }))
    );
  };

  const flatFolders = useMemo(() => {
    let allFolders = [];
    if (expandedSpaces.includes("/")) allFolders.push("/");
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
    }
  }, [flatFolders]);

  const spaceChangeEvent = (evt: SpaceChangeEvent) => {
    if (evt.detail.changeType == "vault" || evt.detail.changeType == "space") {
      retrieveData(flatFolders)
    }
  };

  const changeActiveFile = (evt: CustomEvent) => {
    let filePath: string = evt.detail.filePath;
    setActiveFile(filePath);
  };

  const settingsChanged = () => {
    setVaultSort(plugin.settings.vaultSort);
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
    if (activeItem.parentId == null && activeItem.space == "/") return;
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
    moveFile(active, over);
  }
  const moveFile = async (active: Active, over: Over) => {
    if (projected) {
      const clonedItems: TreeNode[] = flattenedTree;
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const overItem = clonedItems[overIndex];
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      const activeIsSection = activeTreeItem.parentId == null;
      const overIsSection = overItem.parentId == null;
      const overSpace: Space = activeSpaces.find(
        (f) => f.name == overItem.space
      );
      if (activeIsSection) {
        if (overIsSection) {
          insertSpaceAtIndex(
            plugin,
            activeTreeItem.space,
            false,
            overSpace ? parseInt(overSpace.rank) : spaces.length
          );
          return;
        }
      }
      const { depth, overId, parentId } = projected;
      const parentItem = clonedItems.find(({ id }) => id === parentId);

      if (overItem.space != activeItem.space || overItem.space != "/") {
        //item moved to or within a space
        if (overItem.space == "/") {
          return;
        }
        if (parentId != overItem.space + "//" && parentId != null) {
          return;
        }
        if (activeItem.space != overItem.space && overSpace?.def?.length > 0) {
          moveAFileToNewParentAtIndex(
            plugin,
            activeTreeItem.item,
            overSpace.def,
            vaultItems,
            parseInt(overItem.item.rank)
          );
        } else {
          insertSpaceItemAtIndex(
            plugin,
            overItem.space,
            activeItem.item.path,
            parseInt(overItem.item?.rank)
          );
        }
        return;
      }

      //movement within vault
      if (parentId != activeTreeItem.parentId) {
        //directory move, assume projection already took care of ancestry check
        const newParent = parentItem
          ? parentItem.item.folder == "true"
            ? parentItem.item.path
            : parentItem.item.parent
          : "/";
        const newPath =
          newParent == "/"
            ? activeItem.file.name
            : `${newParent}/${activeItem.file.name}`;
        if (plugin.app.vault.getAbstractFileByPath(newPath)) {
          new Notice(t.notice.duplicateFile);
          return;
        }
        moveAFileToNewParentAtIndex(
          plugin,
          activeTreeItem.item,
          newParent,
          vaultItems,
          parseInt(overItem.item.rank)
        );
      } else {
        updateFileRank(
          plugin,
          activeTreeItem.item,
          vaultItems,
          parseInt(overItem.item.rank)
        );
      }
    }
  };
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
    (folder: TreeNode) => {
      if (folder.parentId == null) {
        if (plugin.settings.expandedSpaces.includes(folder.space))
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
        const newOpenFolders: string[] = !folderOpen
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
