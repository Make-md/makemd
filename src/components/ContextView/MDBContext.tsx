import { matchAny } from "components/ui/menus/selectMenu/concerns/matchers";
import i18n from "i18n";
import MakeMDPlugin from "main";
import {
  CachedMetadata,
  getAllTags,
  Notice,
  TAbstractFile, TFolder
} from "obsidian";
import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  defaultFileDBSchema, defaultFolderFields,
  defaultFolderMDBTable,
  defaultFolderSchema,
  defaultFolderTables, defaultTableFields, defaultTagFields,
  defaultTagMDBTable,
  defaultTagSchema, defaultTagTables
} from "schemas/mdb";
import {
  DBRow,
  DBRows,
  DBTable, MDBColumn, MDBField,
  MDBSchema,
  MDBTable,
  MDBTables
} from "types/mdb";
import { eventTypes } from "types/types";
import { tagContextFromTag } from "utils/contexts/contexts";
import {
  frontMatterForFile, parseFrontMatter
} from "utils/contexts/fm";
import {
  consolidateFilesToTable,
  consolidateRowsToTag,
  deleteMDBTable,
  getMDBTable,
  getMDBTableSchemas,
  newRowByDBRow,
  saveMDBToPath
} from "utils/contexts/mdb";
import { filterReturnForCol } from "utils/contexts/predicate/filter";
import { sortReturnForCol } from "utils/contexts/predicate/sort";
import { saveDBToPath } from "utils/db/db";
import { appendFileMetadataForRow, getAbstractFileAtPath } from "utils/file";
import { sanitizeColumnName, sanitizeTableName } from "utils/sanitize";
import {
  folderChildren,
  safelyParseJSON,
  uniq,
  uniqueNameFromString
} from "utils/tree";
import {
  defaultPredicate,
  Predicate,
  validatePredicate
} from "../../utils/contexts/predicate/predicate";
type MDBContextProps = {
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
  dbPath: string | null;
  isFolderContext: boolean;
  folderPath: string;
  saveColumn: (column: MDBColumn, oldColumn?: MDBColumn) => boolean;
  newColumn: (column: MDBColumn) => boolean;
  delColumn: (column: MDBColumn) => void;
  saveSchema: (schema: MDBSchema) => Promise<void>;
  deleteSchema: (schema: MDBSchema) => Promise<void>;
  tagContexts: string[];
  dbFileExists: boolean;
  searchString: string;
  setSearchString: React.Dispatch<React.SetStateAction<string>>;
  loadContextFields: (tag: string) => void;
};

export const MDBContext = createContext<MDBContextProps>({
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
  dbPath: null,
  isFolderContext: false,
  folderPath: "",
  saveColumn: () => false,
  newColumn: () => false,
  delColumn: () => {},
  saveSchema: () => null,
  deleteSchema: () => null,
  tagContexts: [],
  dbFileExists: false,
  searchString: "",
  setSearchString: () => {},
  loadContextFields: () => {},
});

export const MDBProvider: React.FC<
  React.PropsWithChildren<{
    plugin: MakeMDPlugin;
    dbPath: string;
    folder?: string;
    tag?: string;
    schema?: string;
  }>
> = (props) => {
  const { dbPath } = props;
  const [dbFileExists, setDBFileExists] = useState<boolean>(false);
  const [schema, setSchema] = useState<MDBSchema>(null);
  const [searchString, setSearchString] = useState<string>(null);
  const [schemaTable, setSchemaTable] = useState<DBTable>(null);
  const tables = (schemaTable?.rows as MDBSchema[]) ?? [];
  const [tableData, setTableData] = useState<MDBTable | null>(null);
  const [dbSchema, setDBSchema] = useState<MDBSchema>(null);
  const [contextTable, setContextTable] = useState<MDBTables>({});
  const [predicate, setPredicate] = useState<Predicate>(defaultPredicate);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const defaultSchema = props.tag ? defaultTagSchema : defaultFolderSchema;
  const folderPath = props.folder ?? props.tag ?? "";
  const isFolderContext = props.folder ? true : false;
  const tagContexts = useMemo(
    () => (dbSchema?.def?.length > 0 ? dbSchema?.def?.split("&") ?? [] : []),
    [dbSchema]
  );
  const cols: MDBColumn[] = useMemo(
    () => [
      ...(tableData?.cols.map((f) => ({ ...f, table: "" })) ?? []),
      ...tagContexts.reduce(
        (p, c) => [
          ...p,
          ...(contextTable[c]?.cols
            .filter((f) => f.name != "File" && f.type != "fileprop")
            .map((f) => ({ ...f, table: c })) ?? []),
        ],
        []
      ),
    ],
    [tableData, schema, contextTable, tagContexts]
  );
  const data: DBRows = useMemo(
    () =>
      tableData?.rows.map((r, index) => ({
        _index: index.toString(),
        ...(dbSchema?.primary
          ? { ...appendFileMetadataForRow(r, tableData.cols) }
          : r),
        ...tagContexts.reduce((p, c) => {
          const contextRowIndexByFile: number =
            contextTable[c]?.rows.findIndex((f) => f.File == r.File) ?? -1;
          const contextRowsByFile: DBRow =
            contextTable[c]?.rows[contextRowIndexByFile] ?? {};
          const contextRowsWithKeysAppended: DBRow = Object.keys(
            contextRowsByFile
          ).reduce((pa, ca) => ({ ...pa, [ca + c]: contextRowsByFile[ca] }), {
            ["_index" + c]: contextRowIndexByFile.toString(),
          });
          return { ...p, ...contextRowsWithKeysAppended };
        }, {}),
      })) ?? [],
    [tableData, schema, contextTable]
  );
  const sortedColumns = useMemo(
    () =>
      cols
        .filter((f) => f.hidden != "true")
        .sort(
          (a, b) =>
            predicate.colsOrder.findIndex((x) => x == a.name + a.table) -
            predicate.colsOrder.findIndex((x) => x == b.name + b.table)
        ),
    [cols, predicate]
  );
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

    const deleteResult = await deleteMDBTable(props.plugin, dbPath, table.id);
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
    await saveDBToPath(props.plugin, dbPath, { m_schema: newSchemaTable });
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
                    const value = parseFrontMatter(c, fm[c], false);
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
    saveDB({
      ...f,
      rows: f.rows.map((r) => {
        const fmRow = yamlTableData.rows.find((f) => f.File == r.File);
        if (fmRow) {
          return {
            ...r,
            ...fmRow,
          };
        }
        return r;
      }),
    });
  };
  useEffect(() => {
    if (props.schema && schemaTable && dbSchema?.id != props.schema) {
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
        saveSchema(newSchema).then((f) =>
          saveDB({
            schema: newSchema,
            cols: defaultTableFields.map((g) => ({
              ...g,
              schemaId: newSchema.id,
            })),
            rows: [],
          })
        );
      }
    }
  }, [schemaTable]);
  const loadTables = async () => {
    if (getAbstractFileAtPath(app, props.dbPath)) {
      setDBFileExists(true);
      getMDBTableSchemas(
        props.plugin,
        props.dbPath,
        props.tag ? true : false
      ).then((f) => {
        setSchemaTable({
          ...defaultSchema,
          rows: f,
        });
        if (!props.schema) setDBSchema(f?.find((g) => g.type == "db"));
      });
    } else {
      if (props.schema) {
        saveDB(props.tag ? defaultTagMDBTable : defaultFolderMDBTable).then(
          (f) => {
            setSchemaTable(defaultSchema);
          }
        );
      } else {
        setSchemaTable(defaultSchema);
        setDBSchema(defaultFileDBSchema);
      }
    }
  };

  const refreshTags = async (evt: CustomEvent) => {
    if (!dbFileExists) {
      loadDefaultTableData();
    } else {
      if (dbSchema.primary) {
        runDef();
      } else {
        getMDBData();
      }
    }
  };

  const refreshSpace = async (evt: CustomEvent) => {
    if (!dbFileExists) {
      loadDefaultTableData();
    }
  };

  const getMDBData = () => {
    getMDBTable(props.plugin, dbSchema.id, dbPath, !isFolderContext).then((f) =>
      setTableData(f)
    );
  };

  const refreshMDB = async (evt: CustomEvent) => {
    if (!dbFileExists || dbSchema?.primary != 'true') {
      return;
    }

    if (evt.detail.dbPath == dbPath) {
      if (dbSchema)
        getMDBTable(props.plugin, dbSchema.id, dbPath, !isFolderContext).then(
          (f) => setTableData(f)
        );
    } else {
      const tag = Object.keys(contextTable).find(
        (t) => tagContextFromTag(props.plugin, t) == evt.detail.dbPath
      );
      if (tag) loadContextFields(tag);
    }
  };

  useEffect(() => {
    window.addEventListener(eventTypes.mdbChange, refreshMDB);
    window.addEventListener(eventTypes.spacesChange, refreshSpace);
    window.addEventListener(eventTypes.tagsChange, refreshTags);

    return () => {
      window.removeEventListener(eventTypes.mdbChange, refreshMDB);
      window.removeEventListener(eventTypes.spacesChange, refreshSpace);
      window.removeEventListener(eventTypes.tagsChange, refreshTags);
    };
  }, [contextTable, dbSchema, dbPath]);
  useEffect(() => {
    loadTables();
  }, [dbPath]);
  const saveDB = async (newTable: MDBTable) => {
    if (!dbFileExists) {
      const defaultFields = isFolderContext
        ? defaultFolderFields
        : defaultTagFields;
      const defaultTable = isFolderContext
        ? defaultFolderTables
        : defaultTagTables;
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
      await saveDBToPath(props.plugin, dbPath, dbField).then((f) => {
        setDBFileExists(true);
        f ? setTableData(newTable) : new Notice("DB ERROR");
      });
    } else {
      await saveMDBToPath(props.plugin, dbPath, newTable).then((f) => {
        setDBFileExists(true);
        f ? setTableData(newTable) : new Notice("DB ERROR");
      });
    }
  };

  useEffect(() => {
    if (!schemaTable || !dbSchema) return;
    const _schema =
      schema?.def == dbSchema.id
        ? schema
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
        loadDefaultTableData();
      }
    }
  }, [dbSchema]);

  useEffect(() => {
    if (dbFileExists) parsePredicate(schema.predicate);
  }, [schema]);

  useEffect(() => {
    if (dbFileExists && tableData) getContextTags(tableData);
  }, [tableData]);
  const selectRows = (lastSelected: string, rows: string[]) => {
    if (lastSelected) {
      const path = tableData.rows[parseInt(lastSelected)].File;
      let evt = new CustomEvent(eventTypes.selectedFileChange, {
        detail: { filePath: path },
      });
      window.dispatchEvent(evt);
    } else {
      let evt = new CustomEvent(eventTypes.selectedFileChange, {
        detail: { filePath: null },
      });
      window.dispatchEvent(evt);
    }
    setSelectedRows(rows);
  };

  const loadDefaultTableData = () => {
    let files: TAbstractFile[];
    if (props.folder) {
      files = folderChildren(
        props.plugin,
        getAbstractFileAtPath(props.plugin.app, props.folder) as TFolder
      );
      setTableData({
        ...(isFolderContext ? defaultFolderMDBTable : defaultTagMDBTable),
        rows: files.map((f) =>
          newRowByDBRow({ _source: "folder", File: f.path })
        ),
      });
    } else if (props.tag) {
      files = getAllFilesForTag(props.tag)
        .map((f) => getAbstractFileAtPath(app, f))
        .filter((f) => f);
      setTableData({
        ...(isFolderContext ? defaultFolderMDBTable : defaultTagMDBTable),
        rows: files.map((f) => newRowByDBRow({ _source: "tag", File: f.path })),
      });
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
    let files: TAbstractFile[];
    if (props.folder) {
      files = folderChildren(
        props.plugin,
        getAbstractFileAtPath(props.plugin.app, props.folder) as TFolder
      );
      consolidateFilesToTable(
        props.plugin,
        dbPath,
        dbSchema.id,
        files.map((f) => f.path)
      )
        .then((f) => {
          for (let c of tagContexts) {
            loadTagContext(c, f.rows);
          }
          setTableData(f);
          return f;
        })
        .then((f) => syncAllMetadata(f));
    } else if (props.tag) {
      files = getAllFilesForTag(props.tag)
        .map((f) => getAbstractFileAtPath(app, f))
        .filter((f) => f);
      consolidateFilesToTable(
        props.plugin,
        dbPath,
        dbSchema.id,
        files.map((f) => f.path),
        props.tag
      )
        .then((f) => {
          for (let c of tagContexts) {
            loadTagContext(c, f.rows);
          }
          setTableData(f);
          return f;
        })
        .then((f) => syncAllMetadata(f));
    }
  };

  const loadTagContext = async (tag: string, files: DBRows) => {
    consolidateRowsToTag(
      props.plugin,
      tagContextFromTag(props.plugin, tag),
      dbSchema.id,
      dbPath,
      files
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
      "files",
      tagContextFromTag(props.plugin, tag),
      true
    ).then((f) => {
      setContextTable((t) => ({
        ...t,
        [tag]: f,
      }));
    });
  };

  const tagExists = (
    currentCache: CachedMetadata,
    findTag: string
  ): boolean => {
    let currentTags: string[] = [];
    if (getAllTags(currentCache)) {
      //@ts-ignore
      currentTags = getAllTags(currentCache);
    }
    return currentTags.find((tag) => tag.toLowerCase() == findTag.toLowerCase())
      ? true
      : false;
  };

  const getAllFilesForTag = (tag: string) => {
    let tagsCache: string[] = [];

    (() => {
      app.vault.getMarkdownFiles().forEach((tfile) => {
        let currentCache!: CachedMetadata;
        if (app.metadataCache.getFileCache(tfile) !== null) {
          //@ts-ignore
          currentCache = app.metadataCache.getFileCache(tfile);
        }
        let relativePath: string = tfile.path;
        const hasTag: boolean = tagExists(currentCache, tag);
        if (hasTag) {
          tagsCache.push(relativePath);
        }
      });
    })();
    return tagsCache;
  };

  const saveContextDB = async (newTable: MDBTable, context: string) => {
    const dbPath = tagContextFromTag(props.plugin, context);
    await saveMDBToPath(props.plugin, dbPath, newTable).then((f) =>
      f && setContextTable((t) => ({
            ...t,
            [context]: newTable,
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
            ? { ...f, field: newColumn.name + newColumn.table }
            : f
        ),
        sort: predicate.sort.map((f) =>
          f.field == oldColumn.name + oldColumn.table
            ? { ...f, field: newColumn.name + newColumn.table }
            : f
        ),
        groupBy: predicate.groupBy.map((f) =>
          f == oldColumn.name + oldColumn.table
            ? newColumn.name + newColumn.table
            : f
        ),
        colsHidden: predicate.colsHidden.map((f) =>
          f == oldColumn.name + oldColumn.table
            ? newColumn.name + newColumn.table
            : f
        ),
        colsOrder: predicate.colsOrder.map((f) =>
          f == oldColumn.name + oldColumn.table
            ? newColumn.name + newColumn.table
            : f
        ),
        colsSize: {
          ...predicate.colsSize,
          [newColumn.name + newColumn.table]:
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
        dbPath,
        saveColumn,
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
        folderPath,
        isFolderContext,
        setDBSchema,
      }}
    >
      {props.children}
    </MDBContext.Provider>
  );
};
