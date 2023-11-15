import { matchAny } from "components/ui/menus/selectMenu/concerns/matchers";
import i18n from "i18n";
import _, { isEqual } from "lodash";
import MakeMDPlugin from "main";
import { FrontMatterCache, Notice, TAbstractFile } from "obsidian";
import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  defaultFieldsForContext,
  defaultFileDBSchema,
  defaultFolderSchema,
  defaultTableFields,
  defaultTablesForContext,
  defaultTagSchema,
} from "schemas/mdb";
import { ContextDef, FilePropertyName } from "types/context";
import { ContextInfo } from "types/contextInfo";
import {
  DBRow,
  DBRows,
  DBTable,
  MDBColumn,
  MDBField,
  MDBSchema,
  MDBTable,
  MDBTables,
} from "types/mdb";
import { Predicate, Sort } from "types/predicate";
import { ActivePathEvent, eventTypes, SpaceChangeEvent } from "types/types";
import { uniq, uniqueNameFromString } from "utils/array";
import { linkContextRow, tagContextFromTag } from "utils/contexts/contexts";
import {
  defaultTableDataForContext,
  deleteMDBTable,
  getMDBTable,
  getMDBTableSchemas,
  saveMDBToPath,
} from "utils/contexts/mdb";
import { filterReturnForCol } from "utils/contexts/predicate/filter";
import { sortReturnForCol } from "utils/contexts/predicate/sort";
import { saveDBToPath } from "utils/db/db";
import { getAbstractFileAtPath } from "utils/file";
import { safelyParseJSON } from "utils/json";
import {
  frontMatterForFile,
  saveFrontmatterValue,
} from "utils/metadata/frontmatter/fm";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { parseContextDefString } from "utils/parser";
import { pathByString } from "utils/path";
import { sanitizeColumnName, sanitizeTableName } from "utils/sanitize";
import {
  defaultPredicate,
  validatePredicate,
} from "../../utils/contexts/predicate/predicate";
type MDBContextProps = {
  def: ContextDef[];
  tables: MDBSchema[];
  cols: MDBColumn[];
  sortedColumns: MDBColumn[];
  tableData: MDBTable | null;
  data: DBRows;
  filteredData: DBRows;
  contextTable: MDBTables;
  setContextTable: React.Dispatch<React.SetStateAction<MDBTables>>;
  selectedRows: string[];
  selectRows: (lastSelected: string, rows: string[]) => void;
  predicate: Predicate;
  savePredicate: (predicate: Predicate) => void;
  saveDB: (newTable: MDBTable) => Promise<void>;
  saveContextDB: (newTable: MDBTable, context: string) => Promise<void>;
  dbSchema: MDBSchema;
  setDBSchema: (schema: MDBSchema) => void;
  schema: MDBSchema;
  setSchema: (schema: MDBSchema) => void;
  hideColumn: (column: MDBColumn, hidden: boolean) => void;
  sortColumn: (sort: Sort) => void;
  saveColumn: (column: MDBColumn, oldColumn?: MDBColumn) => boolean;
  newColumn: (column: MDBColumn) => boolean;
  delColumn: (column: MDBColumn) => void;
  saveSchema: (schema: MDBSchema) => Promise<void>;
  deleteSchema: (schema: MDBSchema) => Promise<void>;
  tagContexts: string[];
  dbFileExists: boolean;
  searchString: string;
  contextInfo: ContextInfo | null;
  readMode: boolean;
  setSearchString: React.Dispatch<React.SetStateAction<string>>;
  loadContextFields: (tag: string) => void;
  updateValue: (
    column: string,
    value: string,
    table: string,
    index: number,
    file: string
  ) => void;
  updateFieldValue: (
    column: string,
    fieldValue: string,
    value: string,
    table: string,
    index: number,
    file: string
  ) => void;
};

export const MDBContext = createContext<MDBContextProps>({
  def: [],
  tables: [],
  cols: [],
  sortedColumns: [],
  data: [],
  filteredData: [],
  tableData: null,
  contextTable: {},
  selectedRows: [],
  selectRows: () => {},
  setContextTable: () => {},
  predicate: defaultPredicate,
  savePredicate: () => {},
  saveDB: () => null,
  saveContextDB: () => null,
  schema: null,
  dbSchema: null,
  setSchema: () => {},
  setDBSchema: () => {},
  hideColumn: () => {},
  saveColumn: () => false,
  newColumn: () => false,
  sortColumn: () => {},
  delColumn: () => {},
  saveSchema: () => null,
  deleteSchema: () => null,
  tagContexts: [],
  contextInfo: null,
  dbFileExists: false,
  readMode: false,
  searchString: "",
  setSearchString: () => {},
  loadContextFields: () => {},
  updateValue: () => {},
  updateFieldValue: () => {},
});

export const MDBProvider: React.FC<
  React.PropsWithChildren<{
    plugin: MakeMDPlugin;
    context: ContextInfo;
    schema?: string;
    file?: string;
  }>
> = (props) => {
  const [readMode, setReadMode] = useState(props.context.readOnly);
  const [dbFileExists, setDBFileExists] = useState<boolean>(false);
  const [schema, setSchema] = useState<MDBSchema>(null);
  const [searchString, setSearchString] = useState<string>(null);
  const [schemaTable, setSchemaTable] = useState<DBTable>(null);
  const tables = (schemaTable?.rows as MDBSchema[]) ?? [];
  const [tableData, setTableData] = useState<MDBTable | null>(null);
  const [dbSchema, setDBSchema] = useState<MDBSchema>(null);
  const [contextTable, setContextTable] = useState<MDBTables>({});
  const [predicate, setPredicate] = useState<Predicate>(defaultPredicate);
  const def = useMemo(() => parseContextDefString(dbSchema?.def), [dbSchema]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [metadataCache, setMetadataCache] = useState<FrontMatterCache>(null);
  const defaultSchema =
    props.context.type == "tag" ? defaultTagSchema : defaultFolderSchema;
  const contextInfo: ContextInfo = useMemo(() => {
    return props.context;
  }, [props.context]);
  const tagContexts = useMemo(
    () => def.filter((f) => f.type == "tag").map((f) => f.value),
    [def]
  );
  const cols: MDBColumn[] = useMemo(
    () =>
      tableData
        ? [
            ...(tableData.cols.map((f) => ({ ...f, table: "" })) ?? []),
            ...tagContexts.reduce(
              (p, c) => [
                ...p,
                ...(contextTable[c]?.cols
                  .filter(
                    (f) => f.name != FilePropertyName && f.type != "fileprop"
                  )
                  .map((f) => ({ ...f, table: c })) ?? []),
              ],
              []
            ),
          ]
        : [],
    [tableData, schema, contextTable, tagContexts]
  );
  const data: DBRows = useMemo(
    () =>
      tableData?.rows.map((r, index) =>
        linkContextRow(
          props.plugin,
          {
            _index: index.toString(),
            ...r,
            ...tagContexts.reduce((p, c) => {
              const contextRowIndexByFile: number =
                contextTable[c]?.rows.findIndex((f) => f.File == r.File) ?? -1;
              const contextRowsByFile: DBRow =
                contextTable[c]?.rows[contextRowIndexByFile] ?? {};
              const contextRowsWithKeysAppended: DBRow = Object.keys(
                contextRowsByFile
              ).reduce(
                (pa, ca) => ({ ...pa, [ca + c]: contextRowsByFile[ca] }),
                {
                  ["_index" + c]: contextRowIndexByFile.toString(),
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

  const deleteSchema = async (table: MDBSchema) => {
    if (table.primary) return;

    const deleteResult = await deleteMDBTable(
      props.plugin,
      contextInfo,
      table.id
    );
    if (deleteResult) {
      const newSchemaTable = {
        ...schemaTable,
        rows: schemaTable.rows.filter(
          (f) => f.id != table.id && f.def != table.id
        ),
      };
      setSchemaTable(newSchemaTable);
      if (dbSchema.id == table.id) {
        setDBSchema(
          newSchemaTable.rows.find((g) => g.type == "db") as MDBSchema
        );
      }
    }
  };
  const saveSchema = async (table: MDBSchema) => {
    const newSchema = schemaTable.rows.find((f) => f.id == table.id)
      ? true
      : false;

    const newSchemaTable: DBTable = newSchema
      ? {
          ...schemaTable,
          rows: schemaTable.rows.map((f) => (f.id == table.id ? table : f)),
        }
      : {
          ...schemaTable,
          rows: [...schemaTable.rows, table],
        };

    if (!contextInfo.readOnly) {
      await saveDBToPath(props.plugin, contextInfo.dbPath, {
        m_schema: newSchemaTable,
      });
      if (!dbFileExists) {
        saveDB(tableData);
      }
    }

    if (table.id == schema?.id) {
      setSchema(table);
    }
    if (table.id == dbSchema?.id) {
      setDBSchema(table);
      setTableData((f) => ({
        ...f,
        schema: table,
      }));
    }
    setSchemaTable(newSchemaTable);
  };

  const updateValue = (
    column: string,
    value: string,
    table: string,
    index: number,
    file: string
  ) => {
    const col = (table == "" ? tableData : contextTable[table])?.cols.find(
      (f) => f.name == column
    );

    if (col)
      saveFrontmatterValue(
        props.plugin,
        file ?? tableData.rows[index]?.File,
        column,
        value,
        col.type,
        props.plugin.settings.saveAllContextToFrontmatter
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

  const hideColumn = (col: MDBColumn, hidden: true) => {
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
    file: string
  ) => {
    const col = tableData.cols.find((f) => f.name == column);
    saveFrontmatterValue(
      props.plugin,
      file ?? tableData.rows[index]?.File,
      column,
      value,
      col.type,
      props.plugin.settings.saveAllContextToFrontmatter
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
  const syncAllMetadata = (f: MDBTable) => {
    const files = f.rows.map((f) => f.File);

    const importYAML = (files: string[], fmKeys: string[]): DBTable => {
      return files
        .map((f) => getAbstractFileAtPath(app, f))
        .filter((f) => f)
        .reduce(
          (p, c) => {
            const fm = frontMatterForFile(c);
            if (!fm) return p;
            return {
              uniques: [],
              cols: uniq([...p.cols, ...fmKeys]),
              rows: [
                ...p.rows,
                {
                  File: c.path,
                  ...fmKeys.reduce((p, c) => {
                    const value = parseFrontMatter(c, fm[c]);
                    if (value?.length > 0) return { ...p, [c]: value };
                    return p;
                  }, {}),
                },
              ],
            };
          },
          { uniques: [], cols: [], rows: [] }
        );
    };

    const yamlTableData = importYAML(
      files,
      f.cols.filter((f) => !f.type.contains("file")).map((f) => f.name)
    );
    const newRows = f.rows.map((r) => {
      const fmRow = yamlTableData.rows.find((f) => f.File == r.File);
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
    if (schemaTable) {
      if (props.schema) {
        if (dbSchema?.id != props.schema) {
          const preselectSchema = schemaTable.rows.find(
            (g) => g.id == props.schema
          ) as MDBSchema;
          if (preselectSchema) {
            if (preselectSchema.type == "db") {
              setDBSchema(preselectSchema);
              return;
            } else {
              const preselectDBSchema = schemaTable.rows.find(
                (g) => g.id == preselectSchema.def
              ) as MDBSchema;
              if (preselectDBSchema) {
                setDBSchema(preselectDBSchema);
                return;
              }
            }
          } else {
            const newSchema = {
              id: uniqueNameFromString(
                sanitizeTableName(props.schema),
                schemaTable.rows.map((g) => g.id)
              ),
              name: props.schema,
              type: "db",
            };
            setDBSchema(newSchema);
            saveSchema(newSchema).then((f) => {
              saveDB({
                schema: newSchema,
                cols: defaultTableFields.map((g) => ({
                  ...g,
                  schemaId: newSchema.id,
                })),
                rows: [],
              });
            });
          }
        }
      } else {
        if (!dbSchema) {
          setDBSchema(
            schemaTable.rows?.find((g) => g.type == "db") as MDBSchema
          );
        } else {
          setDBSchema(
            schemaTable.rows?.find((g) => g.id == dbSchema.id) as MDBSchema
          );
        }
      }
    }
  }, [schemaTable]);
  const loadTables = async () => {
    if (
      getAbstractFileAtPath(app, contextInfo.dbPath) ||
      contextInfo.isRemote
    ) {
      setDBFileExists(true);
      getMDBTableSchemas(props.plugin, contextInfo).then((f) => {
        setSchemaTable((prev) => ({
          ...defaultSchema,
          rows: f,
        }));
      });
    } else {
      if (props.schema) {
        saveDB(defaultTableDataForContext(props.plugin, contextInfo)).then(
          (f) => {
            setSchemaTable((prev) => defaultSchema);
          }
        );
      } else {
        setSchemaTable((prev) => defaultSchema);
        setDBSchema((prev) => defaultFileDBSchema);
      }
    }
  };

  const refreshFile = async (file: TAbstractFile) => {
    if (file.path == props.file && dbSchema) {
      const fCache = app.metadataCache.getCache(file.path)?.frontmatter;
      if (isEqual(fCache, metadataCache)) return;
      setMetadataCache(fCache);
      if (dbSchema.primary) {
        runDef();
      } else {
        getMDBData();
      }
    }
  };

  const refreshTags = async (tags: string[]) => {
    if (tagContexts.some((f) => tags.some((g) => g == f)))
      if (dbSchema.primary) {
        runDef();
      } else {
        getMDBData();
      }
  };

  const refreshSpace = async (evt: SpaceChangeEvent) => {
    if (evt.detail.type == "context") {
      refreshMDB(evt.detail.name);
      return;
    }
    if (evt.detail.type == "file") {
      refreshFile(getAbstractFileAtPath(app, evt.detail.name));
      return;
    }
    // if (evt.detail?.tags?.length > 0) {
    //   refreshTags(evt.detail.tags);
    //   return;
    // }
    if (
      (evt.detail.type == "space" || evt.detail.type == "vault") &&
      !dbFileExists
    ) {
      const defaultTable = defaultTableDataForContext(
        props.plugin,
        contextInfo
      );
      if (defaultTable) setTableData(defaultTable);
    } else if (evt.detail.type == "vault") {
      refreshMDB(contextInfo.contextPath);
    }
  };

  const getMDBData = () => {
    getMDBTable(props.plugin, contextInfo, dbSchema.id).then((f) => {
      setTableData(f);
    });
  };

  const refreshMDB = async (contextPath: string) => {
    if (!dbFileExists || dbSchema?.primary != "true") {
      return;
    }

    if (contextPath == contextInfo.contextPath) {
      if (dbSchema) {
        loadTables();
      }
    } else {
      const tag = Object.keys(contextTable).find(
        (t) => tagContextFromTag(props.plugin, t).contextPath == contextPath
      );
      if (tag) loadContextFields(tag);
    }
  };

  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, refreshSpace);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, refreshSpace);
    };
  }, [refreshSpace]);

  useEffect(() => {
    loadTables();
  }, [contextInfo]);
  const saveDB = async (newTable: MDBTable) => {
    if (contextInfo.readOnly) return;
    if (!dbFileExists) {
      const defaultFields = defaultFieldsForContext(contextInfo);
      const defaultTable = defaultTablesForContext(contextInfo);
      const dbField = {
        ...defaultTable,
        m_fields: {
          uniques: defaultFields.uniques,
          cols: defaultFields.cols,
          rows: [...(defaultFields.rows ?? []), ...newTable.cols],
        },
        [newTable.schema.id]: {
          uniques: newTable.cols
            .filter((c) => c.unique == "true")
            .map((c) => c.name),
          cols: newTable.cols.map((c) => c.name),
          rows: newTable.rows,
        },
      };

      await saveDBToPath(props.plugin, contextInfo.dbPath, dbField).then(
        (f) => {
          setDBFileExists(true);
          f ? setTableData(newTable) : new Notice("DB ERROR");
        }
      );
    } else {
      await saveMDBToPath(props.plugin, contextInfo, newTable).then((f) => {
        setDBFileExists(true);
        f ? setTableData(newTable) : new Notice("DB ERROR");
      });
    }
  };

  useEffect(() => {
    if (!schemaTable || !dbSchema) return;
    const _schema =
      schema?.def == dbSchema.id
        ? schemaTable.rows.find((f) => f.id == schema.id)
        : schemaTable.rows.find((f) => f.def == dbSchema.id) ?? {
            ...dbSchema,
            id: uniqueNameFromString(
              dbSchema.id + "View",
              schemaTable.rows.map((f) => f.id)
            ),
            type: "table",
            def: dbSchema.id,
          };

    if (_schema) {
      setSchema(_schema as MDBSchema);
      if (dbFileExists) {
        if (dbSchema.primary) {
          runDef();
        } else {
          getMDBData();
        }
      } else {
        const defaultTable = defaultTableDataForContext(
          props.plugin,
          contextInfo
        );
        if (defaultTable) setTableData(defaultTable);
      }
    }
  }, [dbSchema]);

  useEffect(() => {
    if (dbFileExists && schema) {
      parsePredicate(schema.predicate);
    }
  }, [schema]);

  useEffect(() => {
    if (dbFileExists && tableData) getContextTags(tableData);
  }, [tableData]);
  const selectRows = (lastSelected: string, rows: string[]) => {
    setSelectedRows(rows);
    if (!(dbSchema?.primary == "true")) return;
    if (lastSelected) {
      const path = tableData.rows[parseInt(lastSelected)].File;
      let evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
        detail: {
          selection: path,
          path: {
            ...pathByString(contextInfo.contextPath),
            ref: schema?.id,
          },
        },
      });
      window.dispatchEvent(evt);
    } else {
      let evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
        detail: {
          path: {
            ...pathByString(contextInfo.contextPath),
            ref: schema?.id,
          },
          selection: null,
        },
      });
      window.dispatchEvent(evt);
    }
  };

  const getContextTags = async (_tableData: MDBTable) => {
    //load contextfields
    const contextFields = _tableData.cols
      .filter((f) => f.type.contains("context"))
      .map((f) => f.value)
      .filter((f) => !tagContexts.some((g) => g == f));
    for (let c of contextFields) {
      loadContextFields(c);
    }
  };

  const runDef = async () => {
    if (contextInfo.type == "folder") {
      getMDBTable(props.plugin, contextInfo, "files").then((f) => {
        for (let c of tagContexts) {
          loadTagContext(c, f.rows);
        }
        setTableData(f);
        return f;
      });
    } else if (contextInfo.type == "tag") {
      getMDBTable(props.plugin, contextInfo, "files").then((f) => {
        for (let c of tagContexts) {
          loadTagContext(c, f.rows);
        }
        setTableData(f);
        return f;
      });
    } else if (contextInfo.type == "space") {
      getMDBTable(props.plugin, contextInfo, "files").then((f) => {
        setTableData(f);
        return f;
      });
    } else {
      getMDBTable(props.plugin, contextInfo, dbSchema.id).then((f) =>
        setTableData(f)
      );
    }
  };

  const loadTagContext = async (tag: string, files: DBRows) => {
    getMDBTable(
      props.plugin,
      tagContextFromTag(props.plugin, tag),
      "files"
    ).then((f) => {
      if (f) {
        const contextFields = f.cols
          .filter((g) => g.type.contains("context"))
          .map((g) => g.value)
          .filter((g) => !tagContexts.some((h) => h == g));
        for (let c of contextFields) {
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
    getMDBTable(
      props.plugin,
      tagContextFromTag(props.plugin, tag),
      "files"
    ).then((f) => {
      setContextTable((t) => ({
        ...t,
        [tag]: f,
      }));
    });
  };

  const saveContextDB = async (newTable: MDBTable, tag: string) => {
    const context = tagContextFromTag(props.plugin, tag);
    await saveMDBToPath(props.plugin, context, newTable).then(
      (f) =>
        f &&
        setContextTable((t) => ({
          ...t,
          [tag]: newTable,
        }))
    );
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

  const delColumn = (column: MDBColumn) => {
    let mdbtable: MDBTable;
    const table = column.table;
    if (table == "") {
      mdbtable = tableData;
    } else if (contextTable[table]) {
      mdbtable = contextTable[table];
    }
    const newFields: MDBField[] = mdbtable.cols.filter(
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
  const newColumn = (col: MDBColumn): boolean => {
    return saveColumn(col);
  };
  const saveColumn = (newColumn: MDBColumn, oldColumn?: MDBColumn): boolean => {
    let mdbtable: MDBTable;
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
      new Notice(i18n.notice.noPropertyName);
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
      new Notice(i18n.notice.duplicatePropertyName);
      return false;
    }
    const oldFieldIndex = oldColumn
      ? mdbtable.cols.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: MDBField[] =
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
      syncAllMetadata(newTable);
    } else if (contextTable[table]) {
      saveContextDB(newTable, table);
    }

    return true;
  };

  return (
    <MDBContext.Provider
      value={{
        def,
        readMode,
        contextInfo,
        data,
        filteredData,
        loadContextFields,
        selectedRows,
        selectRows,
        tableData,
        cols,
        sortedColumns,
        contextTable,
        setContextTable,
        predicate,
        savePredicate,
        saveDB,
        saveContextDB,
        schema,
        saveColumn,
        hideColumn,
        sortColumn,
        delColumn,
        newColumn,
        tagContexts,
        tables,
        setSchema,
        saveSchema,
        deleteSchema,
        dbFileExists,
        dbSchema,
        searchString,
        setSearchString,
        setDBSchema,
        updateValue,
        updateFieldValue,
      }}
    >
      {props.children}
    </MDBContext.Provider>
  );
};
