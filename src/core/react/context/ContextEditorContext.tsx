import i18n from "core/i18n";
import { matchAny } from "core/react/components/UI/Menus/menu/concerns/matchers";
import { Superstate } from "core/superstate/superstate";
import { saveProperties } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { Predicate, Sort } from "core/types/predicate";
import { linkContextRow } from "core/utils/contexts/linkContextRow";
import { filterReturnForCol } from "core/utils/contexts/predicate/filter";
import { sortReturnForCol } from "core/utils/contexts/predicate/sort";
import _ from "lodash";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultFrameListViewSchema } from "schemas/mdb";
import {
  DBRow,
  DBRows,
  DBTable,
  SpaceProperty,
  SpaceTable,
  SpaceTableColumn,
  SpaceTableSchema,
  SpaceTables,
} from "types/mdb";
import { FrameSchema } from "types/mframe";
import { uniq, uniqueNameFromString } from "utils/array";
import { parseProperty, safelyParseJSON } from "utils/parsers";
import { parseMDBValue } from "utils/properties";
import { sanitizeColumnName } from "utils/sanitizers";
import {
  defaultPredicate,
  defaultTablePredicate,
  validatePredicate,
} from "../../utils/contexts/predicate/predicate";
import { ContextMDBContext } from "./ContextMDBContext";
import { FramesMDBContext } from "./FramesMDBContext";
import { SpaceContext } from "./SpaceContext";
type ContextEditorContextProps = {
  sortedColumns: SpaceTableColumn[];
  cols: SpaceTableColumn[];
  data: DBRows;
  schema: FrameSchema;
  views: FrameSchema[];
  setSchema: React.Dispatch<React.SetStateAction<FrameSchema>>;
  filteredData: DBRows;
  contextTable: SpaceTables;
  setContextTable: React.Dispatch<React.SetStateAction<SpaceTables>>;
  editMode: number;
  setEditMode: React.Dispatch<React.SetStateAction<number>>;
  selectedRows: string[];
  selectRows: (lastSelected: string, rows: string[]) => void;
  predicate: Predicate;
  savePredicate: (predicate: Predicate) => void;

  hideColumn: (column: SpaceTableColumn, hidden: boolean) => void;
  sortColumn: (sort: Sort) => void;
  saveColumn: (
    column: SpaceTableColumn,
    oldColumn?: SpaceTableColumn
  ) => boolean;
  newColumn: (column: SpaceTableColumn) => boolean;
  delColumn: (column: SpaceTableColumn) => void;
  searchString: string;
  setSearchString: React.Dispatch<React.SetStateAction<string>>;
  loadContextFields: (tag: string) => void;
  updateValue: (
    column: string,
    value: string,
    table: string,
    index: number,
    path: string
  ) => void;
  updateFieldValue: (
    column: string,
    fieldValue: string,
    value: string,
    table: string,
    index: number,
    path: string
  ) => void;
};

export const ContextEditorContext = createContext<ContextEditorContextProps>({
  cols: [],
  data: [],
  schema: null,
  views: [],
  setSchema: () => null,
  sortedColumns: [],
  filteredData: [],
  contextTable: {},
  editMode: 0,
  setEditMode: () => null,
  selectedRows: [],
  selectRows: () => null,
  setContextTable: () => null,
  predicate: defaultPredicate,
  savePredicate: () => null,

  hideColumn: () => null,
  saveColumn: () => false,
  newColumn: () => false,
  sortColumn: () => null,
  delColumn: () => null,
  searchString: "",
  setSearchString: () => null,
  loadContextFields: () => null,
  updateValue: () => null,
  updateFieldValue: () => null,
});

export const ContextEditorProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    schema?: string;
  }>
> = (props) => {
  const { spaceInfo, spaceState: spaceCache } = useContext(SpaceContext);
  const contexts = spaceCache?.contexts ?? [];
  const { dbSchema, saveDB, saveContextDB, tableData } =
    useContext(ContextMDBContext);
  const { frameSchemas, saveSchema } = useContext(FramesMDBContext);
  const [schema, setSchema] = useState<FrameSchema>(defaultFrameListViewSchema);
  const [searchString, setSearchString] = useState<string>(null);
  const [contextTable, setContextTable] = useState<SpaceTables>({});
  const [predicate, setPredicate] = useState<Predicate>(defaultPredicate);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<number>(0);
  const views = useMemo(() => {
    const _views = frameSchemas.filter(
      (f) => f.type == "view" && f.def.db == dbSchema?.id
    );
    return _views.length > 0 ? _views : schema ? [schema] : [];
  }, [frameSchemas, schema]);

  const getSchema = (
    _schemaTable: FrameSchema[],
    _dbSchema: SpaceTableSchema,
    _currentSchema?: FrameSchema
  ): FrameSchema => {
    let _schema;
    if (props.schema) {
      _schema = _schemaTable.find((f) => f.id == props.schema);
    } else {
      _schema =
        _currentSchema?.def?.db == _dbSchema.id
          ? _schemaTable.find((f) => f.id == _currentSchema.id)
          : _schemaTable.find((f) => f.def?.db == _dbSchema.id) ??
            ({
              ..._dbSchema,
              id: uniqueNameFromString(
                _dbSchema.id + "View",
                _schemaTable.map((f) => f.id)
              ),
              type: "view",
              def: { db: _dbSchema.id },
              predicate: JSON.stringify(
                _dbSchema.primary == "true"
                  ? defaultPredicate
                  : defaultTablePredicate
              ),
            } as FrameSchema);
    }
    return _schema;
  };

  useEffect(() => {
    if (!dbSchema) return;
    const _schema = getSchema(frameSchemas, dbSchema, schema);

    if (_schema) {
      setSchema(_schema);
    }
  }, [dbSchema, frameSchemas, props.schema]);

  const cols: SpaceTableColumn[] = useMemo(
    () =>
      tableData
        ? [
            ...(tableData.cols.map((f) => ({ ...f, table: "" })) ?? []),
            ...(dbSchema?.primary == "true"
              ? contexts.reduce(
                  (p, c) => [
                    ...p,
                    ...(contextTable[c]?.cols
                      .filter(
                        (f) =>
                          f.name != PathPropertyName && f.type != "fileprop"
                      )
                      .map((f) => ({ ...f, table: c })) ?? []),
                  ],
                  []
                )
              : []),
          ]
        : [],
    [tableData, contextTable, contexts]
  );
  const data: DBRows = useMemo(
    () =>
      tableData?.rows.map((r, index) =>
        linkContextRow(
          props.superstate,
          {
            _index: index.toString(),
            ...r,
            ...contexts.reduce((p, c) => {
              const contextRowIndexByPath: number =
                contextTable[c]?.rows.findIndex(
                  (f) => f[PathPropertyName] == r[PathPropertyName]
                ) ?? -1;
              const contextRowsByPath: DBRow =
                contextTable[c]?.rows[contextRowIndexByPath] ?? {};
              const contextRowsWithKeysAppended: DBRow = Object.keys(
                contextRowsByPath
              ).reduce(
                (pa, ca) => ({ ...pa, [ca + c]: contextRowsByPath[ca] }),
                {
                  ["_index" + c]: contextRowIndexByPath.toString(),
                }
              );
              return { ...p, ...contextRowsWithKeysAppended };
            }, {}),
          },
          cols
        )
      ) ?? [],
    [tableData, schema, contextTable]
  );
  const sortedColumns = useMemo(() => {
    return cols
      .filter(
        (f) =>
          f.hidden != "true" &&
          !predicate.colsHidden.some((c) => c == f.name + f.table)
      )
      .sort(
        (a, b) =>
          predicate.colsOrder.findIndex((x) => x == a.name + a.table) -
          predicate.colsOrder.findIndex((x) => x == b.name + b.table)
      );
  }, [cols, predicate]);
  const filteredData = useMemo(
    () =>
      data
        .filter((f) => {
          return predicate.filters.reduce((p, c) => {
            return p
              ? filterReturnForCol(
                  cols.find((col) => col.name + col.table == c.field),
                  c,
                  f
                )
              : p;
          }, true);
        })
        .filter((f) =>
          searchString?.length > 0
            ? matchAny(searchString).test(
                Object.keys(f)
                  .filter((g) => g.charAt(0) != "_")
                  .map((g) => f[g])
                  .join("|")
              )
            : true
        )
        .sort((a, b) => {
          return predicate.sort.reduce((p, c) => {
            return p == 0
              ? sortReturnForCol(
                  cols.find((col) => col.name + col.table == c.field),
                  c,
                  a,
                  b
                )
              : p;
          }, 0);
        }),
    [predicate, data, cols, searchString]
  );

  const updateValue = (
    column: string,
    value: string,
    table: string,
    index: number,
    path: string
  ) => {
    const col = (table == "" ? tableData : contextTable[table])?.cols.find(
      (f) => f.name == column
    );
    if (col)
      saveProperties(
        props.superstate,
        path ?? tableData.rows[index]?.[PathPropertyName],
        { [column]: parseMDBValue(col.type, value) }
      );

    if (table == "") {
      saveDB({
        ...tableData,
        rows: tableData.rows.map((r, i) =>
          i == index
            ? {
                ...r,
                [column]: value,
              }
            : r
        ),
      });
    } else if (contextTable[table]) {
      saveContextDB(
        {
          ...contextTable[table],
          rows: contextTable[table].rows.map((r, i) =>
            i == index
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        table
      );
    }
  };
  const sortColumn = (sort: Sort) => {
    savePredicate({
      ...predicate,
      sort: [sort],
    });
  };

  const hideColumn = (col: SpaceTableColumn, hidden: true) => {
    savePredicate({
      ...predicate,
      colsHidden: hidden
        ? [
            ...predicate.colsHidden.filter((s) => s != col.name + col.table),
            col.name + col.table,
          ]
        : predicate.colsHidden.filter((s) => s != col.name + col.table),
    });
  };
  const updateFieldValue = (
    column: string,
    fieldValue: string,
    value: string,
    table: string,
    index: number,
    path: string
  ) => {
    const col = tableData.cols.find((f) => f.name == column);
    saveProperties(
      props.superstate,
      path ?? tableData.rows[index]?.[PathPropertyName],
      { [column]: parseMDBValue(col.type, value) }
    );

    if (table == "") {
      const newTable = {
        ...tableData,
        cols: tableData.cols.map((m) =>
          m.name == column
            ? {
                ...m,
                value: fieldValue,
              }
            : m
        ),
        rows: tableData.rows.map((r, i) =>
          i == index
            ? {
                ...r,
                [column]: value,
              }
            : r
        ),
      };
      saveDB(newTable);
    } else if (contextTable[table]) {
      saveContextDB(
        {
          ...contextTable[table],
          cols: contextTable[table].cols.map((m) =>
            m.name == column
              ? {
                  ...m,
                  value: fieldValue,
                }
              : m
          ),
          rows: contextTable[table].rows.map((r, i) =>
            i == index
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        table
      );
    }
  };
  const syncAllProperties = async (f: SpaceTable) => {
    const paths = f.rows.map((f) => f[PathPropertyName]);

    const getPathProperties = async (
      paths: string[],
      fmKeys: string[]
    ): Promise<DBTable> => {
      let rows: DBTable = { uniques: [], cols: fmKeys, rows: [] };

      for (const c of paths) {
        const properties = await props.superstate.spaceManager.readProperties(
          c
        );
        rows = {
          uniques: [],
          cols: fmKeys,
          rows: [
            ...rows.rows,
            {
              [PathPropertyName]: c,
              ...(properties
                ? fmKeys.reduce((p, c) => {
                    const value = parseProperty(c, properties[c]);
                    if (value?.length > 0) return { ...p, [c]: value };
                    return p;
                  }, {})
                : {}),
            },
          ],
        };
      }

      return rows;
    };

    const pathPropertiesTable = await getPathProperties(
      paths,
      f.cols.filter((f) => !f.type.includes("file")).map((f) => f.name)
    );
    const newRows = f.rows.map((r) => {
      const fmRow = pathPropertiesTable.rows.find(
        (f) => f[PathPropertyName] == r[PathPropertyName]
      );
      if (fmRow) {
        return {
          ...r,
          ...fmRow,
        };
      }
      return r;
    });

    const rowsChanged = !_.isEqual(newRows, tableData?.rows);
    const colsChanged = !_.isEqual(tableData?.cols, f.cols);
    if (rowsChanged || colsChanged) {
      saveDB({
        ...f,
        rows: newRows,
      });
    }
  };

  const refreshMDB = async (payload: { path: string }) => {
    if (dbSchema?.primary != "true") {
      return;
    }

    const tag = Object.keys(contextTable).find(
      (t) =>
        props.superstate.spaceManager.spaceInfoForPath(t).path == payload.path
    );
    if (tag) loadContextFields(tag);
  };

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      refreshMDB
    );
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshMDB
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        refreshMDB
      );
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshMDB
      );
    };
  }, []);

  useEffect(() => {
    if (schema) {
      parsePredicate(schema.predicate);
    }
  }, [schema]);

  useEffect(() => {
    if (tableData) getContextTags(tableData);
  }, [tableData]);

  const selectRows = (lastSelected: string, rows: string[]) => {
    setSelectedRows(rows);
    if (!(dbSchema?.primary == "true")) return;
    if (lastSelected) {
      const path = tableData.rows[parseInt(lastSelected)][PathPropertyName];
      props.superstate.ui.setActivePath(path);
    } else {
      props.superstate.ui.setActivePath(spaceInfo.path);
    }
  };

  const getContextTags = async (_tableData: SpaceTable) => {
    //load contextfields
    const contextFields = _tableData.cols
      .filter((f) => f.type.contains("context"))
      .map((f) => f.value)
      .filter((f) => !contexts.some((g) => g == f));
    for (const c of contextFields) {
      loadContextFields(c);
    }
  };

  useEffect(() => {
    if (tableData) {
      for (const c of contexts) {
        loadTagContext(c);
      }
    }
  }, [tableData]);

  const loadTagContext = async (tag: string) => {
    props.superstate.spaceManager
      .contextForSpace(props.superstate.spaceManager.spaceInfoForPath(tag).path)
      .then((f: SpaceTable) => {
        if (f) {
          const contextFields = f.cols
            .filter((g) => g.type.contains("context"))
            .map((g) => g.value)
            .filter((g) => !contexts.some((h) => h == g));
          for (const c of contextFields) {
            loadContextFields(c);
          }
          setContextTable((t) => ({
            ...t,
            [tag]: f,
          }));
        }
      });
  };
  const loadContextFields = async (tag: string) => {
    props.superstate.spaceManager
      .contextForSpace(props.superstate.spaceManager.spaceInfoForPath(tag).path)
      .then((f) => {
        setContextTable((t) => ({
          ...t,
          [tag]: f,
        }));
      });
  };

  const savePredicate = (newPredicate: Predicate) => {
    const cleanedPredicate = validatePredicate(newPredicate);

    saveSchema({
      ...schema,
      predicate: JSON.stringify(cleanedPredicate),
    });
    setPredicate(cleanedPredicate);
  };
  useEffect(() => {
    setPredicate((p) => ({
      ...p,
      colsOrder: uniq([
        ...p.colsOrder,
        ...cols.filter((f) => f.hidden != "true").map((c) => c.name + c.table),
      ]),
    }));
  }, [cols]);

  const parsePredicate = (predicateStr: string) => {
    const newPredicate = safelyParseJSON(predicateStr);

    setPredicate(validatePredicate(newPredicate));
  };

  const delColumn = (column: SpaceTableColumn) => {
    let mdbtable: SpaceTable;
    const table = column.table;
    if (table == "") {
      mdbtable = tableData;
    } else if (contextTable[table]) {
      mdbtable = contextTable[table];
    }
    const newFields: SpaceProperty[] = mdbtable.cols.filter(
      (f, i) => f.name != column.name
    );
    const newTable = {
      ...mdbtable,
      cols: newFields,
      rows: mdbtable.rows.map((r) => {
        const { [column.name]: val, ...rest } = r;
        return rest;
      }),
    };
    if (table == "") {
      saveDB(newTable);
    } else if (contextTable[table]) {
      saveContextDB(newTable, table);
    }
  };
  const newColumn = (col: SpaceTableColumn): boolean => {
    return saveColumn(col);
  };
  const saveColumn = (
    newColumn: SpaceTableColumn,
    oldColumn?: SpaceTableColumn
  ): boolean => {
    let mdbtable: SpaceTable;
    const column = {
      ...newColumn,
      name: sanitizeColumnName(newColumn.name),
    };
    const table = column.table;
    if (table == "") {
      mdbtable = tableData;
    } else if (contextTable[table]) {
      mdbtable = contextTable[table];
    }

    if (column.name == "") {
      props.superstate.ui.notify(i18n.notice.noPropertyName);
      return false;
    }
    if (
      (!oldColumn &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        )) ||
      (oldColumn &&
        oldColumn.name != column.name &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        ))
    ) {
      props.superstate.ui.notify(i18n.notice.duplicatePropertyName);
      return false;
    }
    const oldFieldIndex = oldColumn
      ? mdbtable.cols.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: SpaceProperty[] =
      oldFieldIndex == -1
        ? [...mdbtable.cols, column]
        : mdbtable.cols.map((f, i) => (i == oldFieldIndex ? column : f));
    const newTable = {
      ...mdbtable,
      cols: newFields,
      rows: mdbtable.rows.map((f) =>
        oldColumn
          ? {
              ...f,
              [column.name]: f[oldColumn.name],
              oldColumn: undefined,
            }
          : f
      ),
    };
    if (oldColumn)
      savePredicate({
        view: predicate.view,
        frame: predicate.frame,
        frameProps: predicate.frameProps,
        frameGroup: predicate.frameGroup,
        filters: predicate.filters.map((f) =>
          f.field == oldColumn.name + oldColumn.table
            ? { ...f, field: column.name + column.table }
            : f
        ),
        sort: predicate.sort.map((f) =>
          f.field == oldColumn.name + oldColumn.table
            ? { ...f, field: column.name + column.table }
            : f
        ),
        groupBy: predicate.groupBy.map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsHidden: predicate.colsHidden.map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsOrder: predicate.colsOrder.map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsSize: {
          ...predicate.colsSize,
          [column.name + column.table]:
            predicate.colsSize[oldColumn.name + oldColumn.table],
          [oldColumn.name + oldColumn.table]: undefined,
        },
      });
    if (table == "") {
      syncAllProperties(newTable);
    } else if (contextTable[table]) {
      saveContextDB(newTable, table);
    }

    return true;
  };

  return (
    <ContextEditorContext.Provider
      value={{
        cols,
        data,
        views,
        schema,
        setSchema,
        filteredData,
        loadContextFields,
        selectedRows,
        selectRows,
        sortedColumns,
        contextTable,
        setContextTable,
        predicate,
        savePredicate,
        saveColumn,
        hideColumn,
        sortColumn,
        delColumn,
        newColumn,
        searchString,
        setSearchString,
        updateValue,
        updateFieldValue,
        editMode,
        setEditMode,
      }}
    >
      {props.children}
    </ContextEditorContext.Provider>
  );
};
