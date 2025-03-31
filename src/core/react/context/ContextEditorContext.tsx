import { matchAny } from "core/react/components/UI/Menus/menu/concerns/matchers";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import {
  createSpace,
  pinPathToSpaceAtIndex,
  saveProperties,
} from "core/superstate/utils/spaces";
import { createNewRow } from "core/utils/contexts/optionValuesForColumn";
import { filterReturnForCol } from "core/utils/contexts/predicate/filter";
import { sortReturnForCol } from "core/utils/contexts/predicate/sort";
import { serializeOptionValue } from "core/utils/serializer";
import { tagSpacePathFromTag } from "core/utils/strings";
import _, { isEqual } from "lodash";
import { Superstate } from "makemd-core";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultContextTable, fieldTypeForField } from "schemas/mdb";
import i18n from "shared/i18n";
import {
  defaultContextDBSchema,
  defaultContextSchemaID,
} from "shared/schemas/context";
import { PathPropertyName } from "shared/types/context";
import {
  DBRow,
  DBRows,
  DBTable,
  SpaceProperty,
  SpaceTable,
  SpaceTableColumn,
  SpaceTableSchema,
  SpaceTables,
} from "shared/types/mdb";
import { FrameSchema } from "shared/types/mframe";
import { Predicate, Sort } from "shared/types/predicate";
import { uniq, uniqueNameFromString } from "shared/utils/array";
import { safelyParseJSON } from "shared/utils/json";
import { removeTrailingSlashFromFolder } from "shared/utils/paths";
import { sanitizeColumnName } from "shared/utils/sanitizers";
import { parseMultiString, parseProperty } from "utils/parsers";
import { parseMDBStringValue } from "utils/properties";
import {
  defaultPredicateForSchema,
  validatePredicate,
} from "../../utils/contexts/predicate/predicate";
import { FramesMDBContext } from "./FramesMDBContext";
import { SpaceContext } from "./SpaceContext";
type ContextEditorContextProps = {
  dbSchema: SpaceTableSchema;
  sortedColumns: SpaceTableColumn[];
  views: FrameSchema[];
  filteredData: DBRows;
  contextTable: SpaceTables;
  setContextTable: React.Dispatch<React.SetStateAction<SpaceTables>>;
  editMode: number;
  setEditMode: React.Dispatch<React.SetStateAction<number>>;
  selectedRows: string[];
  selectRows: (lastSelected: string, rows: string[]) => void;
  predicate: Predicate;
  savePredicate: (predicate: Partial<Predicate>) => void;
  source: string;
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
  tableData: SpaceTable;
  cols: SpaceTableColumn[];
  saveDB: (table: SpaceTable) => void;
  data: DBRows;
  updateRow: (row: DBRow, index: number) => Promise<void>;
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
  dbSchema: null,
  views: [],
  source: "",
  sortedColumns: [],
  filteredData: [],
  contextTable: {},
  editMode: 0,
  setEditMode: () => null,
  selectedRows: [],
  selectRows: () => null,
  setContextTable: () => null,
  predicate: null,
  savePredicate: () => null,
  saveDB: () => null,
  hideColumn: () => null,
  saveColumn: () => false,
  newColumn: () => false,
  sortColumn: () => null,
  delColumn: () => null,
  searchString: "",
  setSearchString: () => null,
  data: [],
  updateValue: () => null,
  updateFieldValue: () => null,
  updateRow: () => null,
  tableData: null,
  cols: [],
});

export const ContextEditorProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    source?: string;
  }>
> = (props) => {
  const { frameSchemas, saveSchema, frameSchema } =
    useContext(FramesMDBContext);

  const {
    spaceInfo,
    readMode,
    spaceState: spaceCache,
  } = useContext(SpaceContext);

  const [schemaTable, setSchemaTable] = useState<DBTable>(null);
  const [contextTable, setContextTable] = useState<SpaceTables>({});
  const [tableData, setTableData] = useState<SpaceTable>(null);

  const [searchString, setSearchString] = useState<string>(null);
  const [predicate, setPredicate] = useState<Predicate>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<number>(0);
  const contextPath =
    props.source ?? frameSchema?.def?.context ?? spaceInfo?.path;

  const dbSchema: SpaceTableSchema = useMemo(() => {
    if (frameSchema && frameSchema.def?.db) {
      if (schemaTable)
        return schemaTable?.rows.find(
          (f) => f.id == frameSchema.def.db
        ) as SpaceTableSchema;
      return {
        id: frameSchema.def.db,
        ...defaultContextDBSchema,
      };
    }
    return null;
  }, [frameSchema, schemaTable]);
  const views = useMemo(() => {
    const _views = frameSchemas.filter(
      (f) => f.type == "view" && f.def.db == dbSchema?.id
    );
    return _views.length > 0 ? _views : frameSchema ? [frameSchema] : [];
  }, [frameSchemas, frameSchema, dbSchema]);

  const defaultSchema = defaultContextTable;

  const contexts = spaceCache?.contexts ?? [];
  const loadTables = async () => {
    let schemas = props.superstate.contextsIndex.get(contextPath)?.schemas;
    if (!schemas)
      schemas = await props.superstate.spaceManager.tablesForSpace(contextPath);
    if (schemas && !isEqual(schemaTable?.rows, schemas)) {
      setSchemaTable(() => ({
        ...defaultSchema,
        rows: schemas,
      }));
    } else {
      if (dbSchema) retrieveCachedTable(dbSchema);
    }
  };

  useEffect(() => {
    if (dbSchema) retrieveCachedTable(dbSchema);
  }, [dbSchema]);

  const loadContextFields = useCallback(async (space: string) => {
    props.superstate.spaceManager.contextForSpace(space).then((f) => {
      setContextTable((t) => ({
        ...t,
        [space]: f,
      }));
    });
  }, []);
  const retrieveCachedTable = (newSchema: SpaceTableSchema) => {
    props.superstate.spaceManager
      .readTable(contextPath, newSchema.id)
      .then((f) => {
        if (f) {
          if (newSchema.primary) {
            for (const c of contexts) {
              loadContextFields(tagSpacePathFromTag(c));
            }
          }
          for (const c of f.cols) {
            if (c.type.startsWith("context")) {
              const value = parseFieldValue(c.value, c.type, props.superstate);
              loadContextFields(value.space);
            }
          }
          updateTable(f);
        }
      });
  };
  const updateTable = (newTable: SpaceTable) => {
    setTableData(newTable);
    setContextTable((t) => ({
      ...t,
      [contextPath]: newTable,
    }));
    // calculateTableData(newTable);
  };
  useEffect(() => {
    const refreshMDB = (payload: { path: string }) => {
      if (payload.path == contextPath) {
        loadTables();
      } else {
        const tag = Object.keys(contextTable).find(
          (t) =>
            props.superstate.spaceManager.spaceInfoForPath(t)?.path ==
            payload.path
        );
        if (tag) loadContextFields(tag);
      }
    };
    const refreshPath = (payload: { path: string }) => {
      if (payload.path == contextPath) {
        loadTables();
      } else if (
        dbSchema?.primary == "true" &&
        tableData?.rows.some((f) => f[PathPropertyName] == payload.path)
      ) {
        retrieveCachedTable(dbSchema);
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      refreshMDB
    );
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshMDB
    );

    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      refreshPath
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

      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        refreshPath
      );
    };
  }, [contextTable, dbSchema, retrieveCachedTable, spaceInfo, tableData]);

  useEffect(() => {
    loadTables();
  }, [spaceInfo, frameSchema, props.source]);
  const saveDB = async (newTable: SpaceTable) => {
    if (spaceInfo.readOnly) return;
    updateTable(newTable);
    await props.superstate.spaceManager
      .saveTable(contextPath, newTable, true)
      .then((f) =>
        props.superstate.reloadContext(spaceInfo, {
          force: true,
          calculate: true,
        })
      );
  };

  const cols: SpaceTableColumn[] = useMemo(
    () =>
      tableData
        ? [
            ...(tableData.cols.map((f) => ({ ...f, table: "" })) ?? []),
            ...(dbSchema?.primary == "true"
              ? contexts.reduce(
                  (p, c) => [
                    ...p,
                    ...(contextTable[tagSpacePathFromTag(c)]?.cols
                      .filter((f) => f.primary != "true")
                      .map((f) => ({ ...f, table: c })) ?? []),
                  ],
                  []
                )
              : []),
          ].filter((f) => f)
        : [],
    [tableData, contextTable, contexts, dbSchema]
  );

  const data: DBRows = useMemo(
    () =>
      tableData?.rows.map((r, index) => ({
        _index: index.toString(),
        ...r,
        ...(r[PathPropertyName]
          ? {
              [PathPropertyName]: props.superstate.spaceManager.resolvePath(
                r[PathPropertyName],
                spaceCache?.path
              ),
            }
          : {}),
        ...contexts.reduce((p, c) => {
          const contextRowIndexByPath: number =
            contextTable[tagSpacePathFromTag(c)]?.rows.findIndex(
              (f) => f[PathPropertyName] == r[PathPropertyName]
            ) ?? -1;
          const contextRowsByPath: DBRow =
            contextTable[tagSpacePathFromTag(c)]?.rows[contextRowIndexByPath] ??
            {};
          const contextRowsWithKeysAppended: DBRow = Object.keys(
            contextRowsByPath
          ).reduce((pa, ca) => ({ ...pa, [ca + c]: contextRowsByPath[ca] }), {
            ["_index" + c]: contextRowIndexByPath.toString(),
          });
          return { ...p, ...contextRowsWithKeysAppended };
        }, {}),
      })) ?? [],
    [tableData, contextTable, cols, dbSchema, spaceCache]
  );

  useEffect(() => {
    if (tableData) {
      for (const c of contexts) {
        loadContextFields(c);
      }
    }
  }, [tableData]);

  const saveContextDB = async (newTable: SpaceTable, space: string) => {
    await props.superstate.spaceManager
      .saveTable(space, newTable, true)
      .then((f) =>
        props.superstate.reloadContextByPath(space, {
          force: true,
          calculate: true,
        })
      );
  };
  // const getSchema = (
  //   _schemaTable: FrameSchema[],
  //   _dbSchema: SpaceTableSchema,
  //   _currentSchema?: FrameSchema
  // ): FrameSchema => {
  //   let _schema;
  //   if (props.schema) {
  //     _schema = _schemaTable.find((f) => f.id == props.schema);
  //   } else {
  //     _schema =
  //       _currentSchema?.def?.db == _dbSchema.id
  //         ? _schemaTable.find((f) => f.id == _currentSchema.id)
  //         : _schemaTable.find((f) => f.def?.db == _dbSchema.id) ??
  //           ({
  //             ..._dbSchema,
  //             id: uniqueNameFromString(
  //               _dbSchema.id + "View",
  //               _schemaTable.map((f) => f.id)
  //             ),
  //             type: "view",
  //             def: { db: _dbSchema.id },
  //             predicate: JSON.stringify(
  //               _dbSchema.primary == "true"
  //                 ? defaultPredicate
  //                 : defaultTablePredicate
  //             ),
  //           } as FrameSchema);
  //   }
  //   return _schema;
  // };
  const sortedColumns = useMemo(() => {
    return cols
      .filter(
        (f) =>
          f.hidden != "true" &&
          !(predicate?.colsHidden ?? []).some((c) => c == f.name + f.table)
      )
      .sort(
        (a, b) =>
          (predicate?.colsOrder ?? []).findIndex((x) => x == a.name + a.table) -
          (predicate?.colsOrder ?? []).findIndex((x) => x == b.name + b.table)
      );
  }, [cols, predicate]);
  const filteredData = useMemo(
    () =>
      data
        .filter((f) => {
          return (predicate?.filters ?? []).reduce((p, c) => {
            const row = cols.some(
              (f) => f.schemaId == defaultContextSchemaID && f.name == "tags"
            )
              ? {
                  ...f,
                  tags: (
                    props.superstate.pathsIndex.get(f[PathPropertyName])
                      ?.tags ?? []
                  ).join(", "),
                }
              : f;
            return p
              ? filterReturnForCol(
                  cols.find((col) => col.name + col.table == c.field),
                  c,
                  row,
                  spaceCache.properties
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
          return (predicate?.sort ?? []).reduce((p, c) => {
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

  const updateRow = async (row: DBRow, index: number) => {
    const spaceState = props.superstate.spacesIndex.get(
      contextPath ?? spaceCache.path
    );
    if (index == -1) {
      if (dbSchema?.id == defaultContextSchemaID) {
        const actualIndex = data.findIndex(
          (f) => f[PathPropertyName] == row[PathPropertyName]
        );
        if (actualIndex == -1) {
          const name = row[PathPropertyName];
          const path = props.superstate.pathsIndex.get(name);
          if (path) {
            await pinPathToSpaceAtIndex(
              props.superstate,
              spaceState,
              path.path
            );
          } else {
            const newPath =
              removeTrailingSlashFromFolder(spaceState.path) + "/" + name;

            await createSpace(props.superstate, newPath, {});
          }
          const changedCols = Object.keys(row).filter(
            (f) => f != PathPropertyName
          );
          saveProperties(
            props.superstate,
            row?.[PathPropertyName],
            changedCols.reduce((p, c) => ({ ...p, [c]: row[c] }), {})
          );
          saveDB(createNewRow(tableData, row));
          return;
        }
        updateRow(row, actualIndex);
        return;
      }
      saveDB(createNewRow(tableData, row));
      return;
    }
    const currentData = data[index];
    const changedCols = Object.keys(row).filter(
      (f) => row[f] != currentData[f]
    );
    if (props.superstate.settings.saveAllContextToFrontmatter) {
      saveProperties(
        props.superstate,
        currentData?.[PathPropertyName],
        changedCols.reduce((p, c) => ({ ...p, [c]: row[c] }), {})
      );
    }
    saveDB({
      ...tableData,
      rows: tableData.rows.map((r, i) =>
        i == index
          ? {
              ...r,
              ...row,
            }
          : r
      ),
    });
  };

  const updateValue = (
    column: string,
    value: string,
    table: string,
    index: number,
    path: string
  ) => {
    const col = (
      table == "" ? tableData : contextTable[tagSpacePathFromTag(table)]
    )?.cols.find((f) => f.name == column);
    if (
      dbSchema.id == defaultContextSchemaID &&
      col &&
      props.superstate.settings.saveAllContextToFrontmatter
    ) {
      saveProperties(
        props.superstate,
        path ?? tableData.rows[index]?.[PathPropertyName],
        { [column]: parseMDBStringValue(fieldTypeForField(col), value, true) }
      );
    }

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
      const path = tableData.rows[index][PathPropertyName];

      saveContextDB(
        {
          ...contextTable[tagSpacePathFromTag(table)],
          rows: contextTable[tagSpacePathFromTag(table)].rows.map((r, i) =>
            r[PathPropertyName] == path
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        tagSpacePathFromTag(table)
      );
    }
  };
  const sortColumn = (sort: Sort) => {
    savePredicate({
      sort: [sort],
    });
  };

  const hideColumn = (col: SpaceTableColumn, hidden: true) => {
    savePredicate({
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
    if (props.superstate.settings.saveAllContextToFrontmatter)
      saveProperties(
        props.superstate,
        path ?? tableData.rows[index]?.[PathPropertyName],
        { [column]: parseMDBStringValue(fieldTypeForField(col), value, true) }
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
    } else if (contextTable[tagSpacePathFromTag(table)]) {
      const path = tableData.rows[index][PathPropertyName];
      saveContextDB(
        {
          ...contextTable[tagSpacePathFromTag(table)],
          cols: contextTable[tagSpacePathFromTag(table)].cols.map((m) =>
            m.name == column
              ? {
                  ...m,
                  value: fieldValue,
                }
              : m
          ),
          rows: contextTable[tagSpacePathFromTag(table)].rows.map((r, i) =>
            path == r[PathPropertyName]
              ? {
                  ...r,
                  [column]: value,
                }
              : r
          ),
        },
        tagSpacePathFromTag(table)
      );
    }
  };
  const syncAllProperties = async (f: SpaceTable) => {
    const paths = f.rows.map((f) => f[PathPropertyName]);

    const getPathProperties = async (
      paths: string[],
      fmKeys: SpaceProperty[]
    ): Promise<DBTable> => {
      let rows: DBTable = {
        uniques: [],
        cols: fmKeys.map((f) => f.name),
        rows: [],
      };
      for (const c of paths) {
        const properties =
          props.superstate.pathsIndex.get(c)?.metadata.property;
        rows = {
          uniques: [],
          cols: fmKeys.map((f) => f.name),
          rows: [
            ...rows.rows,
            {
              [PathPropertyName]: c,
              ...(properties
                ? fmKeys.reduce((p, c) => {
                    const value = parseProperty(
                      c.name,
                      properties[c.name],
                      c.type
                    );
                    if (value?.length > 0) return { ...p, [c.name]: value };
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
      f.cols.filter((f) => !f.type.includes("file"))
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

  useEffect(() => {
    if (frameSchema) {
      parsePredicate(frameSchema.predicate);
    }
  }, [frameSchema]);

  const selectRows = (lastSelected: string, rows: string[]) => {
    setSelectedRows(rows);
    if (!(dbSchema?.primary == "true")) return;
    if (lastSelected) {
      const path = tableData.rows[parseInt(lastSelected)]?.[PathPropertyName];
      if (path) props.superstate.ui.setActivePath(path);
    } else {
      props.superstate.ui.setActivePath(contextPath);
    }
  };

  const savePredicate = (newPredicate: Partial<Predicate>) => {
    const defPredicate = defaultPredicateForSchema(dbSchema);
    const pred = {
      ...(predicate ?? defPredicate),
      ...newPredicate,
    };
    const cleanedPredicate = validatePredicate(pred, defPredicate);

    if (frameSchema) {
      saveSchema({
        ...frameSchema,
        predicate: JSON.stringify(cleanedPredicate),
      });
    } else {
      saveSchema({
        id: uniqueNameFromString(
          dbSchema.id + "View",
          frameSchemas.map((f) => f.id)
        ),
        name: dbSchema.name + " View",
        type: "view",
        def: { db: dbSchema.id },
        predicate: JSON.stringify(cleanedPredicate),
      });
    }
    setPredicate(cleanedPredicate);
  };
  useEffect(() => {
    if (predicate)
      setPredicate((p) => ({
        ...p,
        colsOrder: uniq([
          ...p.colsOrder,
          ...cols
            .filter((f) => f.hidden != "true")
            .map((c) => c.name + c.table),
        ]),
      }));
  }, [cols]);

  const parsePredicate = (predicateStr: string) => {
    const defPredicate = defaultPredicateForSchema(dbSchema);
    const newPredicate = validatePredicate(
      safelyParseJSON(predicateStr),
      defPredicate
    );
    setPredicate({
      ...newPredicate,
      colsOrder: uniq([
        ...newPredicate.colsOrder,
        ...cols.filter((f) => f.hidden != "true").map((c) => c.name + c.table),
      ]),
    });
  };

  const delColumn = (column: SpaceTableColumn) => {
    let mdbtable: SpaceTable;
    const table = column.table;
    if (table == "") {
      mdbtable = tableData;
    } else if (contextTable[tagSpacePathFromTag(table)]) {
      mdbtable = contextTable[tagSpacePathFromTag(table)];
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
    } else if (contextTable[tagSpacePathFromTag(table)]) {
      saveContextDB(newTable, tagSpacePathFromTag(table));
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
    if (table == "" || table == contextPath) {
      mdbtable = tableData;
    } else if (contextTable[tagSpacePathFromTag(table)]) {
      mdbtable = contextTable[tagSpacePathFromTag(table)];
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
    if (
      !oldColumn &&
      newColumn.schemaId == defaultContextSchemaID &&
      newColumn.type.startsWith("option")
    ) {
      const allOptions = uniq(
        [...(props.superstate.spacesMap.getInverse(contextPath) ?? [])].flatMap(
          (f) =>
            parseMultiString(
              props.superstate.pathsIndex.get(f)?.metadata?.property?.[
                newColumn.name
              ]
            ) ?? []
        )
      );
      const values = serializeOptionValue(
        allOptions.map((f) => ({ value: f, name: f })),
        {}
      );
      column.value = values;
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
        filters: (predicate?.filters ?? []).map((f) =>
          f.field == oldColumn.name + oldColumn.table
            ? { ...f, field: column.name + column.table }
            : f
        ),
        sort: (predicate?.sort ?? []).map((f) =>
          f.field == oldColumn.name + oldColumn.table
            ? { ...f, field: column.name + column.table }
            : f
        ),
        groupBy: (predicate?.groupBy ?? []).map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsHidden: (predicate?.colsHidden ?? []).map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsOrder: (predicate?.colsOrder ?? []).map((f) =>
          f == oldColumn.name + oldColumn.table ? column.name + column.table : f
        ),
        colsSize: {
          ...(predicate?.colsSize ?? {}),
          [column.name + column.table]:
            predicate?.colsSize?.[oldColumn.name + oldColumn.table],
          [oldColumn.name + oldColumn.table]: undefined,
        },
        colsCalc: {
          ...(predicate?.colsCalc ?? {}),
          [column.name + column.table]:
            predicate?.colsCalc?.[oldColumn.name + oldColumn.table],
          [oldColumn.name + oldColumn.table]: undefined,
        },
      });
    if (table == "") {
      if (dbSchema.id == defaultContextSchemaID) {
        syncAllProperties(newTable);
      } else {
        saveDB(newTable);
      }
    } else if (contextTable[tagSpacePathFromTag(table)]) {
      saveContextDB(newTable, tagSpacePathFromTag(table));
    }

    return true;
  };

  return (
    <ContextEditorContext.Provider
      value={{
        source: contextPath,
        views,
        cols,
        saveDB,
        filteredData,
        dbSchema,
        tableData,
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
        data,
        updateRow,
      }}
    >
      {props.children}
    </ContextEditorContext.Provider>
  );
};
