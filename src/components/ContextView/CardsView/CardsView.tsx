import {
  CancelDrop,
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  Modifiers,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  SortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import "css/CardsView.css";
import MakeMDPlugin from "main";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DBRow, MDBColumn } from "types/mdb";
import { uniq } from "utils/array";
import { getAbstractFileAtPath, openAFile, platformIsMobile } from "utils/file";
import { parseMultiString } from "utils/parser";
import {
  selectNextIndex,
  selectPrevIndex,
  selectRange,
} from "utils/ui/selection";
import { MDBContext } from "../MDBContext";
import { CardColumnProps, CardColumnView } from "./CardColumnView";
import { CardView } from "./CardView";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  args.isSorting || args.wasDragging ? defaultAnimateLayoutChanges(args) : true;

function DroppableContainer({
  children,
  columns = 1,
  disabled,
  id,
  items,
  style,
  ...props
}: CardColumnProps & {
  disabled?: boolean;
  id: string;
  items: UniqueIdentifier[];
  style?: React.CSSProperties;
}) {
  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id,
    data: {
      type: "container",
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== "container") ||
      items.includes(over.id)
    : false;

  return (
    <CardColumnView
      id={id}
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      columns={columns}
      {...props}
    >
      {children}
    </CardColumnView>
  );
}

type Items = Record<string, string[]>;

interface Props {
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;
  plugin: MakeMDPlugin;
  containerStyle?: React.CSSProperties;
  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;
  wrapperStyle?(args: { index: number }): React.CSSProperties;
  itemCount?: number;
  items?: Items;
  handle?: boolean;
  renderItem?: any;
  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
}

const PLACEHOLDER_ID = "placeholder";
const empty: UniqueIdentifier[] = [];

export const CardsView = ({
  adjustScale = false,
  itemCount = 3,
  cancelDrop,
  columns,
  handle = false,
  items: initialItems,
  containerStyle,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  strategy = verticalListSortingStrategy,
  vertical = false,
  scrollable,
  plugin,
}: Props) => {
  const {
    tableData,
    filteredData,
    selectedRows,
    selectRows,
    sortedColumns: cols,
    predicate,
    updateValue,
    contextTable,
    schema,
    saveDB,
    saveContextDB,
  } = useContext(MDBContext);

  const groupBy =
    predicate.groupBy?.length > 0
      ? cols.find((f) => f.name + f.table == predicate.groupBy[0])
      : null;
  const displayCols =
    cols?.filter(
      (f) => !(f.name == groupBy?.name && f.table == groupBy.table)
    ) ?? [];
  const viewType = schema.type;
  const items: Items = useMemo(() => {
    if (groupBy) {
      const options: string[] = uniq([
        "",
        ...(parseMultiString(groupBy.value) ?? []),
        ...filteredData.reduce(
          (p, c) => [...p, c[groupBy.name + groupBy.table] ?? ""],
          []
        ),
      ]) as string[];
      return options.reduce(
        (p, c) => {
          return {
            ...p,
            [c]: filteredData
              .filter((r) => r[groupBy.name + groupBy.table] == c)
              .map((r) => r._index),
          };
        },
        { "": [] }
      );
    }
    return {
      "": filteredData?.map((r) => r._index) ?? [],
    };
  }, [filteredData, predicate]);

  const containers = useMemo(
    () => Object.keys(items).map((f, i) => "-" + i.toString()) as string[],
    [items]
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;
  const [lastSelectedIndex, setLastSelectedIndex] = useState<string>(null);
  // Custom collision detection strategy optimized for multiple containers

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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const findContainer = (id: string) => {
    if (id.charAt(0) == "-") {
      return id;
    }

    return (
      "-" +
      Object.keys(items)
        .findIndex((key) => items[key].includes(id))
        .toString()
    );
  };

  const getIndex = (id: string) => {
    const container = findContainer(id);

    if (!container) {
      return -1;
    }
    const index =
      items[Object.keys(items)[parseInt(container) * -1]].indexOf(id);

    return index;
  };

  const resetState = () => {
    setActiveId(null);
    setOverId(null);
  };
  const onDragCancel = () => {
    resetState();
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  const selectItem = (modifier: number, index: string) => {
    if (platformIsMobile()) {
      const file = getAbstractFileAtPath(
        app,
        tableData.rows[parseInt(index)].File
      );
      if (file) openAFile(file, plugin, false);
      return;
    }
    if (modifier == 3) {
      const file = getAbstractFileAtPath(
        app,
        tableData.rows[parseInt(index)].File
      );
      if (file) openAFile(file, plugin, false);
      return;
    }
    if (modifier == 2) {
      selectedRows.some((f) => f == index)
        ? selectRows(
            null,
            selectedRows.filter((f) => f != index)
          )
        : selectRows(index, uniq([...selectedRows, index]));
    } else if (modifier == 1) {
      selectRows(
        index,
        uniq([
          ...selectedRows,
          ...selectRange(
            lastSelectedIndex,
            index,
            filteredData.map((f) => f._index)
          ),
        ])
      );
    } else {
      selectRows(index, [index]);
    }
    setLastSelectedIndex(index);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key == "Escape") {
      selectRows(null, []);
      setLastSelectedIndex(null);
    }
    if (e.key == "Enter") {
      const file = getAbstractFileAtPath(
        app,
        tableData.rows[parseInt(lastSelectedIndex)].File
      );
      if (file) openAFile(file, plugin, false);
      return;
    }
    if (e.key == "ArrowDown") {
      const newIndex = selectNextIndex(
        lastSelectedIndex,
        filteredData.map((f) => f._index)
      );
      selectRows(newIndex, [newIndex]);
      setLastSelectedIndex(newIndex);
    }
    if (e.key == "ArrowUp") {
      const newIndex = selectPrevIndex(
        lastSelectedIndex,
        filteredData.map((f) => f._index)
      );
      selectRows(newIndex, [newIndex]);
      setLastSelectedIndex(newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId(active.id as string);
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.id;
        if (overId) setOverId(overId as string);
      }}
      onDragEnd={({ active, over }) => {
        if (active.id in items && over?.id) {
          //change options order
          // saveFieldValue(groupBy.table, )
          return;
        }

        const activeContainer = findContainer(active.id as string);

        if (!activeContainer) {
          resetState();
          return;
        }

        const overId = over?.id;

        if (!overId) {
          resetState();
          return;
        }

        if (overId === PLACEHOLDER_ID) {
          return;
        }

        const overContainer = findContainer(overId as string);

        if (overContainer) {
          const activeIndex = items[
            Object.keys(items)[parseInt(activeContainer) * -1]
          ].indexOf(active.id as string);
          const overIndex = items[
            Object.keys(items)[parseInt(overContainer) * -1]
          ].indexOf(overId as string);
          if (activeContainer != overContainer) {
            updateValue(
              groupBy.name,
              Object.keys(items)[parseInt(overContainer) * -1],
              groupBy.table,
              groupBy.table == ""
                ? parseInt(activeId)
                : parseInt(
                    (filteredData.find((f) => f._index == activeId) as DBRow)[
                      "_index" + groupBy.table
                    ]
                  ),
              ""
            );
          }
        }

        resetState();
      }}
      cancelDrop={cancelDrop}
      onDragCancel={onDragCancel}
      modifiers={modifiers}
    >
      <div
        className={classNames(
          viewType == "card" ? "mk-cards-container" : "mk-list-container",
          viewType == "card" && containers.length == 1 && "mk-cards-grid"
        )}
        onKeyDown={onKeyDown}
      >
        <div className="mk-list-view">
          <SortableContext
            items={[...containers, PLACEHOLDER_ID]}
            strategy={
              vertical
                ? verticalListSortingStrategy
                : horizontalListSortingStrategy
            }
          >
            {containers.map((containerId) => (
              <DroppableContainer
                key={containerId}
                id={containerId}
                plugin={plugin}
                label={
                  minimal
                    ? undefined
                    : `${Object.keys(items)[parseInt(containerId) * -1]}`
                }
                field={groupBy}
                columns={columns}
                items={items[Object.keys(items)[parseInt(containerId) * -1]]}
                scrollable={scrollable}
                style={containerStyle}
                unstyled={minimal}
              >
                <SortableContext
                  items={items[Object.keys(items)[parseInt(containerId) * -1]]}
                  strategy={strategy}
                >
                  {items[Object.keys(items)[parseInt(containerId) * -1]].map(
                    (value, index) => {
                      return (
                        <SortableItem
                          disabled={isSortingContainer}
                          key={value}
                          id={value}
                          plugin={plugin}
                          value={filteredData.find((f) => f._index == value)}
                          cols={displayCols}
                          index={index}
                          handle={handle}
                          style={getItemStyles}
                          wrapperStyle={wrapperStyle}
                          renderItem={renderItem}
                          onSelect={selectItem}
                          selected={selectedRows?.some((f) => f == value)}
                          containerId={containerId}
                          getIndex={getIndex}
                        />
                      );
                    }
                  )}
                </SortableContext>
              </DroppableContainer>
            ))}
          </SortableContext>
        </div>
      </div>
      {createPortal(
        <DragOverlay adjustScale={adjustScale}>
          {activeId
            ? containers.includes(activeId)
              ? renderContainerDragOverlay(activeId)
              : renderSortableItemDragOverlay(activeId)
            : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );

  function renderSortableItemDragOverlay(id: string) {
    return (
      <div
        className={
          viewType == "card" ? "mk-cards-container" : "mk-list-container"
        }
      >
        <CardView
          plugin={plugin}
          value={filteredData.find((f) => f._index == id)}
          handle={handle}
          id={id}
          cols={displayCols}
          style={getItemStyles({
            containerId: findContainer(id) as string,
            overIndex: -1,
            index: getIndex(id),
            value: id,
            isSorting: true,
            isDragging: true,
            isDragOverlay: true,
          })}
          color={getColor(id)}
          wrapperStyle={wrapperStyle({ index: 0 })}
          renderItem={renderItem}
          dragOverlay
        />
      </div>
    );
  }

  function renderContainerDragOverlay(containerId: string) {
    return (
      <CardColumnView
        id={containerId}
        plugin={plugin}
        label={`Column ${containerId}`}
        field={groupBy}
        columns={columns}
        style={{
          height: "100%",
        }}
        shadow
        unstyled={false}
      >
        {items[Object.keys(items)[parseInt(containerId) * -1]].map(
          (item, index) => (
            <CardView
              key={item}
              id={item}
              plugin={plugin}
              value={filteredData.find((f) => f._index == item)}
              cols={displayCols}
              handle={handle}
              style={getItemStyles({
                containerId,
                overIndex: -1,
                index: getIndex(item),
                value: item,
                isDragging: false,
                isSorting: false,
                isDragOverlay: false,
              })}
              color={getColor(item)}
              selected={selectedRows.some((f) => f == item)}
              onSelect={selectItem}
              wrapperStyle={wrapperStyle({ index })}
              renderItem={renderItem}
            />
          )
        )}
      </CardColumnView>
    );
  }

  function getNextContainerId() {
    const containeIds = Object.keys(items);
    const lastContaineId = containeIds[containeIds.length - 1];

    return String.fromCharCode(lastContaineId.charCodeAt(0) + 1);
  }
};

function getColor(id: string) {
  switch (id[0]) {
    case "A":
      return "#7193f1";
    case "B":
      return "#ffda6c";
    case "C":
      return "#00bcd4";
    case "D":
      return "#ef769f";
  }

  return undefined;
}

interface SortableItemProps {
  containerId: string;
  id: UniqueIdentifier;
  index: number;
  handle: boolean;
  plugin: MakeMDPlugin;
  disabled?: boolean;
  cols: MDBColumn[];
  value: DBRow;
  style(args: any): React.CSSProperties;
  onSelect(modifier: number, index: string): void;
  selected: boolean;
  getIndex(id: string): number;
  renderItem(): React.ReactElement;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
}

function SortableItem({
  disabled,
  id,
  plugin,
  index,
  handle,
  renderItem,
  style,
  containerId,
  onSelect,
  selected,
  getIndex,
  cols,
  value,
  wrapperStyle,
}: SortableItemProps) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    isSorting,
    over,
    overIndex,
    transform,
    transition,
  } = useSortable({
    id,
  });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <CardView
      ref={disabled ? undefined : setNodeRef}
      value={value}
      plugin={plugin}
      id={id as string}
      cols={cols}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id as string) : overIndex,
        containerId,
      })}
      onSelect={onSelect}
      selected={selected}
      color={getColor(id as string)}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
    />
  );
}

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
