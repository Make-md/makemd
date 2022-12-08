import { FileTreeView } from "components/Spaces/FileTreeView";
import React, {
  LegacyRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MakeMDPlugin from "main";
import {
  CustomVaultChangeEvent,
  eventTypes,
  FlattenedTreeNode,
  FolderTree,
  SectionTree,
  VaultChange,
} from "types/types";
import useForceUpdate from "hooks/ForceUpdate";
import { Notice, Platform, TAbstractFile, TFile, TFolder } from "obsidian";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import * as FileTreeUtils from "utils/utils";
import {
  IndicatorState,
  SortableTreeItem,
  SortableTreeItemProps,
  TreeItem,
} from "components/Spaces/TreeView/FolderTreeView";
import {
  Active,
  closestCenter,
  CollisionDetection,
  DndContext as DndKitContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  getFirstCollision,
  MeasuringStrategy,
  Modifier,
  MouseSensor,
  Over,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  UniqueIdentifier,
  useDndMonitor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { FOLDER_VIEW_TYPE } from "components/FlowView/FlowView";
import t from "i18n";
import {
  VariableSizeList as List,
  areEqual,
  ListChildComponentProps,
  VariableSizeList,
} from "react-window";
import AutoSizer from "utils/autosizer";
interface FileExplorerComponentProps {
  fileTreeView: FileTreeView;
  plugin: MakeMDPlugin;
}

const row: React.FC<ListChildComponentProps> = memo(
  ({ data, index, style }) => {
    const {
      flattenedItems,
      projected,
      handleCollapse,
      plugin,
      sections,
      openFolders,
      indentationWidth,
    } = data;
    const f = flattenedItems[index];
    return (
      <SortableTreeItem
        key={f.id}
        id={f.id}
        data={f}
        disabled={false}
        depth={f.depth}
        childCount={0}
        indentationWidth={indentationWidth}
        indicator={
          projected?.overId == f.id
            ? f.parentId == null && projected.parentId == null
              ? { state: IndicatorState.Top, depth: projected.depth }
              : { state: IndicatorState.Bottom, depth: projected.depth }
            : null
        }
        plugin={plugin}
        style={style}
        collapsed={
          f.parentId == null
            ? f.id == "/"
              ? plugin.settings.vaultCollapsed
              : sections[f.index].collapsed
            : !openFolders.find((i: string) => i == f.id)
        }
        onCollapse={handleCollapse}
      ></SortableTreeItem>
    );
  },
  areEqual
);

export const FileExplorerComponent = (props: FileExplorerComponentProps) => {
  const { plugin } = props;
  const indentationWidth = 24;
  const isMobile = FileTreeUtils.platformIsMobile();
  const [vaultCollapsed, setVaultCollapsed] = useState(
    plugin.settings.vaultCollapsed
  );
  const [openFolders, setOpenFolders] = useRecoilState(recoilState.openFolders);
  const [fileIcons, setFileIcons] = useRecoilState(recoilState.fileIcons);
  const [focusedFolder, setFocusedFolder] = useRecoilState(
    recoilState.focusedFolder
  );
  const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
  const [sections, setSections] = useRecoilState(recoilState.sections);
  const [_folderTree, setFolderTree] = useRecoilState(recoilState.folderTree);
  const [selectedFiles, setSelectedFiles] = useState<TFile[]>([]);
  // const [dropPlaceholderItem, setDropPlaceholderItem] = useState<[Record<string, string>, number] | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const listRef = useRef<VariableSizeList>();
  const forceUpdate = useForceUpdate();

  // Persistant Settings
  const loadFolderTree = async (folder: TFolder) => {
    setFolderTree(await FileTreeUtils.sortFolderTree(folder, plugin));
  };

  useEffect(() => {
    window.addEventListener(eventTypes.vaultChange, vaultChangeEvent);
    window.addEventListener(eventTypes.activeFileChange, changeActiveFile);
    window.addEventListener(eventTypes.refreshView, forceUpdate);
    window.addEventListener(eventTypes.settingsChanged, settingsChanged);
    window.addEventListener(eventTypes.revealFile, handleRevealFileEvent);
    return () => {
      window.removeEventListener(eventTypes.vaultChange, vaultChangeEvent);
      window.removeEventListener(eventTypes.activeFileChange, changeActiveFile);
      window.removeEventListener(eventTypes.refreshView, forceUpdate);
      window.removeEventListener(eventTypes.settingsChanged, settingsChanged);
      window.removeEventListener(eventTypes.revealFile, handleRevealFileEvent);
    };
  }, []);

  const handleRevealFileEvent = (evt: CustomVaultChangeEvent) => {
    if (evt.detail) {
      setSelectedFiles([evt.detail.file]);
      const folders = evt.detail.file.path.split("/");
      const openPaths = folders
        .reduce((p, c) => [...p, `${p}/${c}`], ["/"])
        .slice(0, -1);
      const newOpenFolders = [
        ...openFolders.filter((f) => !openPaths.find((g) => g == f)),
        ...openPaths,
      ];
      plugin.settings.openFolders = newOpenFolders;
      plugin.saveSettings();
    }
  };
  const vaultChangeEvent = (evt: CustomVaultChangeEvent) => {
    if (evt.detail) {
      handleVaultChanges(
        evt.detail.file,
        evt.detail.changeType,
        evt.detail.oldPath
      );
    }
    const loadFolderTree = async () => {
      setFolderTree(
        await FileTreeUtils.sortFolderTree(plugin.app.vault.getRoot(), plugin)
      );
    };
    cleanData();
    plugin.saveSettings();
    loadFolderTree();
  };

  const changeActiveFile = (evt: CustomEvent) => {
    let filePath: string = evt.detail.filePath;
    const activeLeaf = plugin.app.workspace.activeLeaf;
    if (activeLeaf.view.getViewType() == FOLDER_VIEW_TYPE) {
      setActiveFile(activeLeaf.view.getState().folder);
    } else {
      let file = plugin.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        setActiveFile(file.path);
      } else {
        setActiveFile(null);
      }
    }
  };

  function handleVaultChanges(
    file: TAbstractFile,
    changeType: VaultChange,
    oldPathBeforeRename?: string
  ) {
    // Get Current States from Setters
    if (changeType == "rename") {
      FileTreeUtils.renamePathInStringTree(oldPathBeforeRename, file, plugin);
    }
    if (changeType == "delete") {
    }

    // File Event Handlers
  }

  const settingsChanged = () => {
    setSections(plugin.settings.spaces);
    setOpenFolders(plugin.settings.openFolders);
    setFileIcons(plugin.settings.fileIcons);
    setVaultCollapsed(plugin.settings.vaultCollapsed);
  };

  useEffect(() => {
    setInitialFocusedFolder();
    settingsChanged();
  }, []);

  const cleanData = () => {
    const cleanedSections = plugin.settings.spaces.map((f) => {
      return {
        ...f,
        children: f.children.filter((f) =>
          plugin.app.vault.getAbstractFileByPath(f)
        ),
      };
    });

    const cleanedCollapse = plugin.settings.openFolders;
    const cleanedFileIcons = plugin.settings.fileIcons.filter((f) =>
      plugin.app.vault.getAbstractFileByPath(f[0])
    );
    plugin.settings.spaces = cleanedSections;
    plugin.settings.openFolders = cleanedCollapse;
    plugin.settings.fileIcons = cleanedFileIcons;
  };
  const setInitialFocusedFolder = () => {
    cleanData();
    loadFolderTree(plugin.app.vault.getRoot());
    setFocusedFolder(plugin.app.vault.getRoot());
  };
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    parentId: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);

  const flattenSectionTree = (
    sectionTrees: SectionTree[]
  ): FlattenedTreeNode[] => {
    const getChildren = (
      section: string,
      paths: string[],
      sectionIndex: number
    ) => {
      return FileTreeUtils.flattenTrees(
        paths
          .map((f) => plugin.app.vault.getAbstractFileByPath(f))
          .filter((f) => f != null),
        "/" + section + "/",
        sectionIndex,
        section,
        1
      );
    };

    return sectionTrees.reduce((p, c, i) => {
      return [
        ...p,
        {
          id: c.section,
          parentId: null,
          name: c.section,
          depth: 0,
          index: i,
          section: i,
          isFolder: true,
        },
        ...(!c.collapsed ? getChildren(c.section, c.children, i) : []),
      ];
    }, []);
  };

  const flattenedItems = useMemo(() => {
    const flattenedTree = [
      ...flattenSectionTree(sections),
      ...(_folderTree
        ? FileTreeUtils.flattenTree(_folderTree, "/", -1, vaultCollapsed)
        : []),
    ];
    return FileTreeUtils.includeChildrenOf(flattenedTree, openFolders);
  }, [_folderTree, openFolders, sections, vaultCollapsed]);
  const sortedIds = useMemo(
    () => flattenedItems.map(({ id }) => id),
    [flattenedItems]
  );

  const activeItem = activeId
    ? flattenedItems.find(({ id }) => id === activeId)
    : null;

  const overIndex = overId
    ? flattenedItems.findIndex(({ id }) => id === overId)
    : null;

  const overItem = flattenedItems[overIndex];
  const nextItem = flattenedItems[overIndex + 1];

  const dragDepth = useMemo(() => {
    return FileTreeUtils.getDragDepth(offsetLeft, indentationWidth);
  }, [offsetLeft]);

  const projected = useMemo(() => {
    return activeId && overId
      ? FileTreeUtils.getProjection(
          flattenedItems,
          activeItem,
          overIndex,
          overItem,
          nextItem,
          dragDepth
        )
      : null;
  }, [flattenedItems, activeItem, overItem, nextItem, overIndex, dragDepth]);

  function handleDragStart(event: DragStartEvent) {
    const {
      active: { id: activeId },
    } = event;
    const activeItem = flattenedItems.find(({ id }) => id === activeId);
    //Dont drag vault
    if (activeItem.parentId == null && activeItem.section == -1) return;
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
      const clonedItems: FlattenedTreeNode[] = [
        ...flattenSectionTree(sections),
        ...(_folderTree
          ? FileTreeUtils.flattenTree(_folderTree, "/", -1, false)
          : []),
      ];
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const overItem = clonedItems[overIndex];
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      const activeIsSection = activeTreeItem.parentId == null;
      const overIsSection = overItem.parentId == null;
      if (activeIsSection) {
        if (overIsSection) {
          const newSections =
            overItem.section == -1
              ? arrayMove(sections, activeTreeItem.index, sections.length - 1)
              : overItem.index > activeIndex
              ? arrayMove(sections, activeTreeItem.index, overItem.index - 1)
              : arrayMove(sections, activeTreeItem.index, overItem.index);
          plugin.settings.spaces = newSections;
          plugin.saveSettings();
          return;
        }
      }
      const { depth, overId, parentId } = projected;
      const parentItem = clonedItems.find(({ id }) => id === parentId);

      if (overItem.section != activeItem.section || overItem.section != -1) {
        if (overItem.section == -1) {
          return;
        }
        if (
          parentId != sections[overItem.section].section &&
          parentId != null
        ) {
          return;
        }

        const newSections = sections.map((s, k) => {
          if (k == overItem.section) {
            const index =
              sections[overItem.section].children.findIndex(
                (f) => f == overItem.path
              ) + 1;
            const activeIndex = s.children.findIndex(
              (g) => g == activeItem.path
            );
            const children = s.children.filter((g) => g != activeItem.path);
            const toIndex =
              activeIndex <= index && activeIndex != -1 ? index - 1 : index;
            if (activeIndex == -1) {
              new Notice(t.notice.addedToSection);
            }
            return {
              ...s,
              children: [
                ...children.slice(0, toIndex),
                activeItem.path,
                ...children.slice(toIndex),
              ],
            };
          }
          return s;
        });

        plugin.settings.spaces = newSections;
        plugin.saveSettings();
        return;
      }
      if (parentId != activeTreeItem.parentId) {
        const newPath = `${
          parentItem.isFolder ? parentItem.path : parentItem.parent.path
        }/${activeItem.name}`;
        if (plugin.app.vault.getAbstractFileByPath(newPath)) {
          new Notice(t.notice.duplicateFile);
          return;
        }
        await props.plugin.app.vault.rename(activeTreeItem, newPath);
        clonedItems[activeIndex] = {
          ...activeTreeItem,
          depth,
          parentId,
          ...plugin.app.vault.getAbstractFileByPath(newPath),
        } as FlattenedTreeNode;
      } else {
        clonedItems[activeIndex] = {
          ...activeTreeItem,
          depth,
          parentId,
        } as FlattenedTreeNode;
      }

      const sortedItems =
        overIndex > activeIndex
          ? arrayMove(clonedItems, activeIndex, overIndex)
          : overIndex < activeIndex
          ? arrayMove(clonedItems, activeIndex, overIndex + 1)
          : clonedItems;
      const newItems = FileTreeUtils.buildTree(sortedItems);
      const newFolderRank = FileTreeUtils.folderTreeToStringTree(newItems);
      plugin.settings.folderRank = newFolderRank;

      await plugin.saveSettings();
      loadFolderTree(plugin.app.vault.getRoot());
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
    (folder: FlattenedTreeNode) => {
      if (folder.parentId == null) {
        if (folder.id == "/") {
          plugin.settings.vaultCollapsed = !plugin.settings.vaultCollapsed;
          plugin.saveSettings();
          return;
        }
        const newSections = sections.map((s, i) => {
          return i == folder.index ? { ...s, collapsed: !s.collapsed } : s;
        });
        plugin.settings.spaces = newSections;
        plugin.saveSettings();
      } else {
        const folderOpen = openFolders.find((f) => f == folder.id);
        const newOpenFolders: string[] = !folderOpen
          ? ([...openFolders, folder.id] as string[])
          : (openFolders.filter(
              (openFolder) => folder.id !== openFolder
            ) as string[]);
        plugin.settings.openFolders = newOpenFolders;
        plugin.saveSettings();
      }
    },
    [plugin, openFolders, sections]
  );

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    // setDropPlaceholderItem(null);
    document.body.style.setProperty("cursor", "");
  }

  const itemData = useMemo(() => {
    if (listRef?.current) listRef.current.resetAfterIndex(0);
    return {
      flattenedItems,
      projected,
      handleCollapse,
      plugin,
      sections,
      openFolders,
      indentationWidth,
    };
  }, [
    flattenedItems,
    projected,
    handleCollapse,
    plugin,
    sections,
    openFolders,
    indentationWidth,
  ]);

  const rowHeight = (index: number) =>
    isMobile
      ? flattenedItems[index].parentId == null
        ? 60
        : 40
      : flattenedItems[index].parentId == null
      ? 44
      : 29;

  return (
    <div className="mk-file-tree">
      <DndKitContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={measuring}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={sortedIds}
          strategy={verticalListSortingStrategy}
        >
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                itemSize={rowHeight}
                itemCount={itemData.flattenedItems.length}
                itemData={itemData}
                width={width}
                overscanCount={plugin.settings.spacesPerformance ? 0 : 20}
              >
                {row}
              </List>
            )}
          </AutoSizer>
          {createPortal(
            <DragOverlay
              dropAnimation={null}
              modifiers={[adjustTranslate]}
              zIndex={1600}
            >
              {activeId ? (
                <SortableTreeItem
                  id={activeId}
                  data={flattenedItems.find((f) => f.id == activeId)}
                  indicator={null}
                  depth={0}
                  disabled={false}
                  plugin={plugin}
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
      </DndKitContext>
    </div>
  );
};
