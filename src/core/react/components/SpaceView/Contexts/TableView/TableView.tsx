import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  OnChangeFn,
  RowData,
  useReactTable,
} from "@tanstack/react-table";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DBRow } from "types/mdb";
import { uniq } from "utils/array";
import { ContextMDBContext } from "../../../../context/ContextMDBContext";
import { BooleanCell } from "../DataTypeView/BooleanCell";
import { ContextCell } from "../DataTypeView/ContextCell";
import { DateCell } from "../DataTypeView/DateCell";
import { LookUpCell } from "../DataTypeView/LookUpCell";
import { NumberCell } from "../DataTypeView/NumberCell";
import { OptionCell } from "../DataTypeView/OptionCell";
import { PathCell } from "../DataTypeView/PathCell";
import { TextCell } from "../DataTypeView/TextCell";
import { ColumnHeader } from "./ColumnHeader";

import i18n from "core/i18n";
import { defaultMenu, SelectOption } from "core/react/components/UI/Menus/menu";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { deletePath } from "core/superstate/utils/path";
import { newPathInSpace } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { Filter } from "core/types/predicate";
import { createNewRow } from "core/utils/contexts/optionValuesForColumn";
import {
  selectNextIndex,
  selectPrevIndex,
  selectRange,
} from "core/utils/ui/selection";
import { debounce } from "lodash";
import { defaultContextSchemaID, fieldTypeForType } from "schemas/mdb";
import { ImageCell } from "../DataTypeView/ImageCell";
import { LinkCell } from "../DataTypeView/LinkCell";
import { ObjectCell } from "../DataTypeView/ObjectCell";
import { SuperCell } from "../DataTypeView/SuperCell";
import { TagCell } from "../DataTypeView/TagCell";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    table: string;
    editable: boolean;
    schemaId: string;
  }
}

export enum CellEditMode {
  EditModeReadOnly = -1,
  EditModeNone = 0, //No Edit for Most Types except bool
  EditModeView = 1, //View mode, toggleable to edit mode
  EditModeActive = 2, //Active Edit mode, toggelable to view mode
  EditModeAlways = 3, //Always Edit
}

export type TableCellProp = {
  initialValue: string;
  saveValue: (value: string) => void;
  editMode?: CellEditMode;
  setEditMode?: (editMode: [string, string]) => void;
  superstate: Superstate;
  propertyValue?: string;
};

export type TableCellMultiProp = TableCellProp & {
  multi: boolean;
};

export const TableView = (props: { superstate: Superstate }) => {
  const {
    spaceInfo,
    readMode,
    spaceState: spaceCache,
  } = useContext(SpaceContext);
  const {
    tableData,

    dbSchema,
    contextTable,
    saveDB,
  } = useContext(ContextMDBContext);
  const {
    selectedRows,
    selectRows,
    sortedColumns: cols,
    filteredData: data,
    predicate,
    savePredicate,

    updateFieldValue,
    updateValue,
  } = useContext(ContextEditorContext);
  const [activeId, setActiveId] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<string>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>(null);
  const [currentEdit, setCurrentEdit] = useState<[string, string]>(null);
  const [overId, setOverId] = useState(null);
  const [openFlows, setOpenFlows] = useState([]);
  const [colsSize, setColsSize] = useState<ColumnSizingState>({});
  const ref = useRef(null);
  useEffect(() => {
    setColsSize({ ...predicate.colsSize, "+": 30 });
  }, [predicate]);

  useEffect(() => {
    setCurrentEdit(null);
  }, [selectedColumn, lastSelectedIndex]);

  useEffect(() => {
    if (currentEdit == null) {
      ref.current.focus();
    }
  }, [currentEdit]);

  const saveColsSize: OnChangeFn<ColumnSizingState> = (
    colSize: (old: ColumnSizingState) => ColumnSizingState
  ) => {
    const newColSize = colSize(colsSize);
    setColsSize(newColSize);
    debouncedSavePredicate(newColSize);
  };

  const debouncedSavePredicate = useCallback(
    debounce(
      (nextValue) =>
        savePredicate({
          ...predicate,
          colsSize: nextValue,
        }),
      1000
    ),
    [predicate] // will be created only once initially
  );
  const newRow = (index?: number, data?: DBRow) => {
    if (dbSchema?.id == defaultContextSchemaID) {
      newPathInSpace(props.superstate, spaceCache, "md", null, true);
    } else {
      saveDB(
        createNewRow(
          tableData,
          { [PathPropertyName]: "", ...(data ?? {}) },
          index
        )
      );
    }
  };

  const deleteRow = (rowIndex: number) => {
    const row = tableData.rows.find((f, i) => i == rowIndex);
    deletePath(props.superstate, row[PathPropertyName]);

    if (row) {
      saveDB({
        ...tableData,
        rows: tableData.rows.filter((f, i) => i != rowIndex),
      });
    }
  };

  const toggleFlow = (path: string) => {
    setOpenFlows((f) =>
      f.find((p) => p == path) ? f.filter((p) => p != path) : uniq([...f, path])
    );
  };

  const selectItem = (modifier: number, index: string) => {
    if (modifier == 3) {
      props.superstate.ui.openPath(
        tableData.rows[parseInt(index)][PathPropertyName],
        false
      );
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
            data.map((f) => f._index)
          ),
        ])
      );
    } else {
      selectRows(index, [index]);
    }
    setLastSelectedIndex(index);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const setCellValue = (value: string) => {
      const columnTuple = selectedColumn.split("#");
      updateValue(
        columnTuple[0],
        value,
        columnTuple[1] ?? "",
        parseInt(lastSelectedIndex),
        ""
      );
    };
    const clearCell = () => {
      setCellValue("");
    };
    const copyCell = () => {
      navigator.clipboard.writeText(
        tableData.rows[parseInt(lastSelectedIndex)][selectedColumn]
      );
    };
    const nextRow = () => {
      const newIndex = selectNextIndex(
        lastSelectedIndex,
        data.map((f) => f._index)
      );
      selectRows(newIndex, [newIndex]);
      setLastSelectedIndex(newIndex);
    };
    const lastRow = () => {
      const newIndex = selectPrevIndex(
        lastSelectedIndex,
        data.map((f) => f._index)
      );
      selectRows(newIndex, [newIndex]);
      setLastSelectedIndex(newIndex);
    };
    if (e.key == "c" && e.metaKey) {
      copyCell();
    }
    if (e.key == "x" && e.metaKey) {
      copyCell();
      clearCell();
    }
    if (e.key == "v" && e.metaKey) {
      navigator.clipboard.readText().then((f) => setCellValue(f));
    }
    if (e.key == "Escape") {
      selectRows(null, []);
      setLastSelectedIndex(null);
    }
    if (e.key == "Backspace" || e.key == "Delete") {
      clearCell();
    }
    if (e.key == "Enter") {
      if (selectedColumn && lastSelectedIndex) {
        if (e.shiftKey) {
          newRow(parseInt(lastSelectedIndex) + 1);
          nextRow();
        } else {
          setCurrentEdit([selectedColumn, lastSelectedIndex]);
        }
      }

      return;
    }
    if (e.key == "ArrowDown") {
      nextRow();
      e.preventDefault();
    }
    if (e.key == "ArrowUp") {
      lastRow();
      e.preventDefault();
    }
    if (e.key == "ArrowLeft") {
      const newIndex = selectPrevIndex(
        selectedColumn,
        columns.map((f) => f.accessorKey).filter((f) => f != "+")
      );
      setSelectedColumn(newIndex);
    }
    if (e.key == "ArrowRight") {
      const newIndex = selectNextIndex(
        selectedColumn,
        columns.map((f) => f.accessorKey).filter((f) => f != "+")
      );
      setSelectedColumn(newIndex);
    }
  };
  const columns: any[] = useMemo(
    () => [
      ...(cols.map((f) => {
        return {
          header: f.name,
          accessorKey: f.name + f.table,
          // enableResizing: true,
          meta: {
            table: f.table,
            editable: f.name != PathPropertyName,
            schemaId: dbSchema?.id,
          },
          cell: ({
            // @ts-ignore
            getValue,
            // @ts-ignore
            row: { index },
            // @ts-ignore
            column: { colId },
            // @ts-ignore
            cell,
            // @ts-ignore
            table,
          }) => {
            const initialValue = getValue();
            // We need to keep and update the state of the cell normally
            const rowIndex = parseInt(
              (data[index] as DBRow)["_index" + f.table]
            );
            const tableIndex = parseInt((data[index] as DBRow)["_index"]);
            const saveValue = (value: string) => {
              setCurrentEdit(null);
              if (initialValue != value)
                table.options.meta?.updateData(
                  f.name,
                  value,
                  f.table,
                  rowIndex
                );
            };
            const saveFieldValue = (fieldValue: string, value: string) => {
              table.options.meta?.updateFieldValue(
                f.name,
                fieldValue,
                value,
                f.table,
                rowIndex
              );
            };
            const editMode = readMode
              ? CellEditMode.EditModeReadOnly
              : !cell.getIsGrouped()
              ? props.superstate.ui.getScreenType() == "mobile"
                ? CellEditMode.EditModeAlways
                : currentEdit &&
                  currentEdit[0] == f.name + f.table &&
                  currentEdit[1] == tableIndex.toString()
                ? CellEditMode.EditModeActive
                : CellEditMode.EditModeView
              : CellEditMode.EditModeReadOnly;
            const cellProps = {
              initialValue: initialValue as string,
              saveValue: saveValue,
              superstate: props.superstate,
              setEditMode: setCurrentEdit,
              editMode,
              propertyValue: f.value,
            };
            const value = parseFieldValue(f.value, f.type);
            const fieldType = fieldTypeForType(f.type, f.name);
            if (!fieldType) {
              return <>{initialValue}</>;
            }
            if (fieldType.type == "file") {
              return (
                <PathCell
                  {...cellProps}
                  multi={fieldType.multiType == f.type}
                  folder={spaceInfo.path}
                  openFlow={() => toggleFlow(initialValue)}
                  deleteRow={() => deleteRow(index)}
                ></PathCell>
              );
            } else if (fieldType.type == "boolean") {
              return <BooleanCell {...cellProps} column={f}></BooleanCell>;
            } else if (fieldType.type == "option") {
              return (
                <OptionCell
                  {...cellProps}
                  options={f.value}
                  multi={fieldType.multiType == f.type}
                  saveOptions={saveFieldValue}
                ></OptionCell>
              );
            } else if (fieldType.type == "date") {
              return <DateCell {...cellProps}></DateCell>;
            } else if (fieldType.type == "context") {
              return (
                <ContextCell
                  {...cellProps}
                  multi={fieldType.multiType == f.type}
                  space={value.space}
                  spaceField={value.field}
                  path={data[index][PathPropertyName]}
                ></ContextCell>
              );
            } else if (fieldType.type == "fileprop") {
              return (
                <LookUpCell
                  {...cellProps}
                  path={data[index][PathPropertyName]}
                ></LookUpCell>
              );
            } else if (fieldType.type == "tags") {
              return <TagCell {...cellProps} row={data[index]}></TagCell>;
            } else if (fieldType.type == "number") {
              return <NumberCell {...cellProps}></NumberCell>;
            } else if (fieldType.type == "link") {
              return (
                <LinkCell
                  {...cellProps}
                  multi={fieldType.multiType == f.type}
                  path={data[index][PathPropertyName]}
                ></LinkCell>
              );
            } else if (fieldType.type == "image") {
              return <ImageCell {...cellProps}></ImageCell>;
            } else if (fieldType.type == "object") {
              return (
                <ObjectCell
                  {...cellProps}
                  multi={fieldType.multiType == f.type}
                  savePropValue={saveFieldValue}
                ></ObjectCell>
              );
            } else if (fieldType.type == "super") {
              return <SuperCell {...cellProps} row={data[index]}></SuperCell>;
            } else {
              return <TextCell {...cellProps}></TextCell>;
            }
          },
        };
      }) ?? []),
      ...(readMode
        ? []
        : [
            {
              header: "+",
              meta: { schemaId: dbSchema?.id },
              accessorKey: "+",
              size: 20,
              cell: () => <></>,
            },
          ]),
    ],
    [cols, currentEdit, predicate, contextTable, toggleFlow, openFlows]
  );

  const groupBy = useMemo(
    () =>
      predicate.groupBy?.length > 0 &&
      cols.find((f) => f.name + f.table == predicate.groupBy[0])
        ? predicate.groupBy
        : [],
    [predicate, cols]
  );
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    state: {
      columnVisibility: predicate.colsHidden.reduce(
        (p, c) => ({ ...p, [c]: false }),
        {}
      ),
      columnOrder: predicate.colsOrder,
      columnSizing: {
        ...columns.reduce((p, c) => ({ ...p, [c.accessorKey]: 150 }), {}),
        ...colsSize,
      },
      grouping: groupBy,
      expanded: true,
    },
    onColumnSizingChange: saveColsSize,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    meta: {
      updateData: updateValue,
      updateFieldValue: updateFieldValue,
    },
  });

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

  function handleDragStart(event: DragStartEvent) {
    const {
      active: { id: activeId },
    } = event;
    setActiveId(activeId);
    setOverId(overId);

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overId = over?.id;
    if (overId) {
      setOverId(over?.id ?? null);
    }
  }

  const saveFilter = (filter: Filter) => {
    savePredicate({
      ...predicate,
      filters: [
        ...predicate.filters.filter((s) => s.field != filter.field),
        filter,
      ],
    });
  };

  const selectCell = (e: React.MouseEvent, index: number, column: string) => {
    if (props.superstate.ui.getScreenType() == "mobile" || column == "+")
      return;
    selectItem(0, (data[index] as DBRow)["_index"]);
    setSelectedColumn(column);
    if (e.detail === 1) {
    } else if (e.detail === 2) {
      setCurrentEdit([column, (data[index] as DBRow)["_index"]]);
    }
  };
  const showContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    e.preventDefault();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.deleteRow,
      icon: "lucide//trash",
      onClick: (e) => {
        deleteRow(index);
      },
    });
    props.superstate.ui.openMenu(
      isMouseEvent(e)
        ? { x: e.pageX, y: e.pageY }
        : {
            // @ts-ignore
            x: e.nativeEvent.locationX,
            // @ts-ignore
            y: e.nativeEvent.locationY,
          },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();
    savePredicate({
      ...predicate,
      colsOrder: arrayMove(
        predicate.colsOrder,
        predicate.colsOrder.findIndex((f) => f == activeId),
        predicate.colsOrder.findIndex((f) => f == overId)
      ),
    });
  }

  function handleDragCancel() {
    resetState();
  }
  function resetState() {
    setOverId(null);
    setActiveId(null);
    // setDropPlaceholderItem(null);
    document.body.style.setProperty("cursor", "");
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mk-table" ref={ref} tabIndex={1} onKeyDown={onKeyDown}>
        <table
          {
            ...{
              // style: {
              //   width: table.getTotalSize(),
              // },
            }
          }
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th></th>
                {headerGroup.headers.map((header) => (
                  <th
                    className="mk-th"
                    key={header.id}
                    style={{
                      minWidth: header.column.getIsGrouped()
                        ? "0px"
                        : // @ts-ignore
                          colsSize[header.column.columnDef.accessorKey] ??
                          "150px",
                      maxWidth: header.column.getIsGrouped()
                        ? "0px"
                        : // @ts-ignore
                          colsSize[header.column.columnDef.accessorKey] ??
                          "150px",
                    }}
                  >
                    {header.isPlaceholder ? null : header.column.columnDef
                        .header != "+" ? (
                      header.column.getIsGrouped() ? (
                        <></>
                      ) : (
                        <ColumnHeader
                          superstate={props.superstate}
                          editable={header.column.columnDef.meta.editable}
                          column={cols.find(
                            (f) =>
                              f.name == header.column.columnDef.header &&
                              f.table == header.column.columnDef.meta.table
                          )}
                        ></ColumnHeader>
                      )
                    ) : (
                      <ColumnHeader
                        superstate={props.superstate}
                        isNew={true}
                        editable={true}
                        column={{
                          name: "",
                          schemaId: header.column.columnDef.meta.schemaId,
                          type: "text",
                          table: "",
                        }}
                      ></ColumnHeader>
                    )}
                    <div
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: `mk-resizer ${
                          header.column.getIsResizing() ? "isResizing" : ""
                        }`,
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <>
                <tr
                  className={
                    selectedRows?.some(
                      (f) => f == (data[row.index] as DBRow)["_index"]
                    ) && "mk-is-active"
                  }
                  onContextMenu={(e) => {
                    const rowIndex = parseInt(
                      (data[row.index] as DBRow)["_index"]
                    );
                    showContextMenu(e, rowIndex);
                  }}
                  key={row.id}
                >
                  <td></td>
                  {row.getVisibleCells().map((cell, i) =>
                    cell.getIsGrouped() ? (
                      // If it's a grouped cell, add an expander and row count
                      <td
                        key={i}
                        className="mk-td-group"
                        colSpan={cols.length + (readMode ? 0 : 1)}
                      >
                        <div
                          {...{
                            onClick: row.getToggleExpandedHandler(),
                            style: {
                              display: "flex",
                              alignItems: "center",
                              cursor: "normal",
                            },
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}{" "}
                          ({row.subRows.length})
                        </div>
                      </td>
                    ) : cell.getIsAggregated() ? (
                      // If the cell is aggregated, use the Aggregated
                      // renderer for cell
                      flexRender(
                        cell.column.columnDef.aggregatedCell ??
                          cell.column.columnDef.cell,
                        cell.getContext()
                      )
                    ) : (
                      <td
                        onClick={(e) =>
                          selectCell(
                            e,
                            cell.row.index,
                            // @ts-ignore
                            cell.column.columnDef.accessorKey
                          )
                        }
                        className={`${
                          // @ts-ignore
                          cell.column.columnDef.accessorKey == selectedColumn
                            ? "mk-selected-cell  "
                            : ""
                        } mk-td ${
                          cell.getIsPlaceholder() ? "mk-td-empty" : ""
                        }`}
                        key={cell.id}
                        style={{
                          minWidth: cell.getIsPlaceholder()
                            ? "0px"
                            : // @ts-ignore
                              colsSize[cell.column.columnDef.accessorKey] ??
                              "50px",
                        }}
                      >
                        {cell.getIsPlaceholder()
                          ? null
                          : flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                      </td>
                    )
                  )}
                </tr>
              </>
            ))}
          </tbody>
          <tfoot>
            {!readMode ? (
              <tr>
                <th
                  className="mk-row-new"
                  colSpan={cols.length + (readMode ? 1 : 2)}
                  onClick={() => {
                    newRow();
                  }}
                >
                  + New
                </th>
              </tr>
            ) : (
              <></>
            )}
          </tfoot>
        </table>
        {createPortal(
          <DragOverlay dropAnimation={null} zIndex={1600}>
            {activeId ? (
              <ColumnHeader
                superstate={props.superstate}
                editable={false}
                column={{
                  name: activeId,
                  schemaId: tableData.schema.id,
                  type: "text",
                  table: "",
                }}
              ></ColumnHeader>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </DndContext>
  );
};
