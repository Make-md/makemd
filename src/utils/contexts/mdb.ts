import { CONTEXT_VIEW_TYPE } from "components/ContextView/ContextView";
import MakeMDPlugin from "main";
import { TAbstractFile, TFolder } from "obsidian";
import { Database } from "sql.js";
import {
  DBRow, DBTable,
  MDBField,
  MDBSchema,
  MDBTable
} from "types/mdb";

import { insert } from "utils/array";
import { sanitizeSQLStatement } from "utils/sanitize";
import { serializeSQLFieldNames } from "utils/serializer";
import { spaceContextPathFromName } from "utils/strings";
import { folderChildren } from "utils/tree";
import {
  defaultFieldsForContext, defaultMDBTableForContext, defaultTablesForContext, fieldSchema
} from "../../schemas/mdb";
import { ContextInfo } from "../../types/contextInfo";
import { uniq } from "../array";
import {
  dbResultsToDBTables,
  deleteFromDB,
  dropTable, getDBFile, saveDBFile,
  saveDBToPath
} from "../db/db";
import { deleteFile, getAbstractFileAtPath, renameFile } from "../file";
import { getAllFilesForTag, tagToTagPath } from "../metadata/tags";
import { parseMultiString } from "../parser";
import { spaceContextFromSpace, tagContextFromTag } from "./contexts";

const dbTableToMDBTable = (
  table: DBTable,
  schema: MDBSchema,
  fields: MDBField[]
): MDBTable => {
  return {
    schema,
    cols: fields,
    rows: table?.rows ?? [],
  };
};

const updateFieldsToSchema = (fields: MDBField[], context: ContextInfo) => {
  const defaultFields = defaultFieldsForContext(context);
  return [
    ...fields,
    ...(defaultFields.rows.filter(
      (f) => !fields.some((g) => g.name == f.name && g.schemaId == f.schemaId)
    ) as MDBField[]),
  ];
};

export const getMDBTable = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  table: string
): Promise<MDBTable> => {
  if (!context)
  return null;
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(context.dbPath, context.isRemote);
  if (!buf) {
    return null;
  }

  const db = new sqlJS.Database(new Uint8Array(buf));

  await sanitizeTableSchema(plugin, db, context);
  let fieldsTables;
  let schema;
  try {
    fieldsTables = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_fields WHERE schemaId = '${table}'`)
    );
    schema = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_schema WHERE id = '${table}'`)
    )[0].rows[0] as MDBSchema;
  } catch (e) {
    db.close();
    return null;
  }
  if (fieldsTables.length == 0) {
    db.close();
    return {
      schema: schema,
      cols: [],
      rows: [],
    };
  }

  const fields = (fieldsTables[0].rows as MDBField[]).filter(
    (f) => f.name.length > 0
  );

  const dbTable = dbResultsToDBTables(
    db.exec(
      `SELECT ${serializeSQLFieldNames(fields
        .reduce((p, c) => [...p, `"${c.name}"`], [])
        )} FROM "${table}"`
    )
  );

  db.close();
  return dbTableToMDBTable(
    dbTable[0],
    schema,
    schema.primary ? updateFieldsToSchema(fields, context) : fields
  );
};

export const deleteMDBTable = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  table: string
): Promise<boolean> => {
  if (context.readOnly) return false;
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(context.dbPath, context.isRemote);
  if (!buf) {
    return false;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  deleteFromDB(db, "m_schema", `id = '${sanitizeSQLStatement(table)}'`);
  deleteFromDB(db, "m_schema", `def = '${sanitizeSQLStatement(table)}'`);
  deleteFromDB(db, "m_fields", `schemaId = '${sanitizeSQLStatement(table)}'`);
  dropTable(db, table);
  await saveDBFile(context.dbPath, db.export().buffer);
  db.close();
  //https://github.com/typeorm/typeorm/issues/1197 CHECK THIS
  //https://news.ycombinator.com/item?id=28157686
  return true;
};

export const getMDBTableSchemas = async (
  plugin: MakeMDPlugin,
  context: ContextInfo
): Promise<MDBSchema[]> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(context.dbPath, context.isRemote);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  await sanitizeTableSchema(plugin, db, context);
  const tables = db.exec(`SELECT * FROM m_schema`);
  db.close();
  return tables[0].values.map((f) => {
    const [id, name, type, def, predicate, primary] = f as string[];
    return { id, name, type, def, predicate, primary };
  });
};

export const getMDBSchema = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  schema: string
): Promise<MDBSchema> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(context.dbPath, context.isRemote);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  const tables = db.exec(
    `SELECT * FROM m_schema WHERE id='${sanitizeSQLStatement(schema)}'`
  );
  db.close();
  if (!tables[0] || !tables[0].values[0]) {
    return null;
  }
  return tables[0].values.map((f) => {
    const [id, name, type, def, predicate, primary] = f as string[];
    return { id, name, type, def, predicate, primary };
  })[0];
};


export const saveMDBToPath = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  mdb: MDBTable
): Promise<boolean> => {
  if (context.readOnly) return;
  const sqlJS = await plugin.sqlJS();

  const buf = await getDBFile(context.dbPath, context.isRemote);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  const fieldsTables = dbResultsToDBTables(
    db.exec(`SELECT * FROM m_fields WHERE schemaId != '${mdb.schema.id}'`)
  );

  const tables = {
    m_fields: {
      uniques: fieldSchema.uniques,
      cols: fieldSchema.cols,
      rows: [...(fieldsTables[0]?.rows ?? []), ...mdb.cols],
    },
    [mdb.schema.id]: {
      uniques: [] as string[],
      cols: mdb.cols.map((c) => c.name),
      rows: mdb.rows,
    },
  };
  db.close();
  return saveDBToPath(plugin, context.dbPath, tables);
};

export const optionValuesForColumn = (column: string, table: MDBTable) => {
  return uniq(
    table?.rows.reduce((p, c) => {
      return [...p, ...parseMultiString(c[column])];
    }, []) ?? []
  );
};

export const defaultTableDataForContext = (plugin: MakeMDPlugin, contextInfo: ContextInfo) : MDBTable => {
  let files: TAbstractFile[];
  if (contextInfo.type == "folder") {
    files = folderChildren(
      plugin,
      getAbstractFileAtPath(
        plugin.app,
        contextInfo.contextPath
      ) as TFolder
    );
    return {
      ...defaultMDBTableForContext(contextInfo),
      rows: files.map((f) => ({ File: f.path })),
    }
  } else if (contextInfo.type == "tag") {
    files = getAllFilesForTag(contextInfo.contextPath)
      .map((f) => getAbstractFileAtPath(app, f))
      .filter((f) => f);
    return {
      ...defaultMDBTableForContext(contextInfo),
      rows: files.map((f) => ({ File: f.path })),
    }
  } else if (contextInfo.type == "space") {
    files = [
      ...(plugin.index.spacesMap?.getInverse(
        contextInfo.contextPath.substring(
          0,
          contextInfo.contextPath.length - 2
        )
      ) ?? []),
    ]
      .map((f) => getAbstractFileAtPath(app, f))
      .filter((f) => f);
    return {
      ...defaultMDBTableForContext(contextInfo),
      rows: files.map((f) => ({ File: f.path })),
    }
  }
  return null;
};

export const createDefaultDB = async (
  plugin: MakeMDPlugin,
  context: ContextInfo
) => {

  //try to merge existing
  const table = defaultTableDataForContext(plugin, context);
  if (table)
    {const defaultFields = defaultFieldsForContext(context);
      const defaultTable = defaultTablesForContext(context);
      const dbField = {
        ...defaultTable,
        m_fields: {
          uniques: defaultFields.uniques,
          cols: defaultFields.cols,
          rows: [...(defaultFields.rows ?? []), ...table.cols],
        },
        [table.schema.id]: {
          uniques: table.cols
            .filter((c) => c.unique == "true")
            .map((c) => c.name),
          cols: table.cols.map((c) => c.name),
          rows: table.rows,
        },
      };

      const result = await saveDBToPath(plugin, context.dbPath, dbField)
      if (result) {
        await plugin.index.reloadContext(context);
        table.rows.map(f => getAbstractFileAtPath(app, f.File)).forEach(f => f && plugin.index.reloadFile(f, true));
        return true;
      }
      return false;
    }
  return false;
};

const sanitizeTableSchema = async (
  plugin: MakeMDPlugin,
  db: Database,
  context: ContextInfo
) => {
  const sqlJS = await plugin.sqlJS();
  //If for some reason we lose the table structure due to file corruption, unhandled error or user error, recreate the default structure
  const tableRes = db.exec(
    `SELECT name FROM sqlite_master WHERE type='table';`
  );
  if (
    !tableRes[0] ||
    !tableRes[0].values.some((f) => f[0] == "m_schema") ||
    !tableRes[0].values.some((f) => f[0] == "m_fields") ||
    !tableRes[0].values.some((f) => f[0] == "files")
  ) {
    await createDefaultDB(plugin, context);
  }
};




export const createNewRow = (mdb: MDBTable, row: DBRow, index?: number) => {
  if (index) {
    return {
      ...mdb,
      rows: insert(mdb.rows, index, row),
    };
  }
  return {
    ...mdb,
    rows: [...mdb.rows, row],
  };
};

export const deleteTagContext = async (plugin: MakeMDPlugin, tag: string) => {
  const context = tagContextFromTag(plugin, tag);
  if (getAbstractFileAtPath(app, context.dbPath)) {
    await deleteFile(plugin, getAbstractFileAtPath(app, context.dbPath));
  }
  app.workspace.iterateLeaves((leaf) => {
    if (
      leaf.view.getViewType() == CONTEXT_VIEW_TYPE &&
      leaf.view.getState().contextPath == tag
    ) {
      leaf.setViewState({ type: "empty" });
    }
  }, app.workspace["rootSplit"]!);
  plugin.index.deleteTag(tag);
};

export const deleteSpaceContext = async (plugin: MakeMDPlugin, space: string) => {
  const context = spaceContextFromSpace(plugin, spaceContextPathFromName(space));
  if (getAbstractFileAtPath(app, context.dbPath)) {
    await deleteFile(plugin, getAbstractFileAtPath(app, context.dbPath));
  }
  app.workspace.iterateLeaves((leaf) => {
    if (
      leaf.view.getViewType() == CONTEXT_VIEW_TYPE &&
      leaf.view.getState().contextPath == context.contextPath
    ) {
      leaf.setViewState({ type: "empty" });
    }
  }, app.workspace["rootSplit"]!);
};

export const connectContext = async (
  plugin: MakeMDPlugin,
  tag: string,
  source: string
) => {
  
};

export const disconnectContext = async (
  plugin: MakeMDPlugin,
  tag: string,
  source: string
) => {
  
};

export const renameSpaceContextFile = async (
  plugin: MakeMDPlugin,
  space: string,
  newSpace: string,
) => {
  const context = spaceContextFromSpace(plugin, spaceContextPathFromName(space));
  if (getAbstractFileAtPath(app, context.dbPath)) {
    const newSpaceDBPath = newSpace + ".mdb";
    if (
      !getAbstractFileAtPath(
        app,
        getAbstractFileAtPath(app, context.dbPath).parent.path +
          "/" + newSpaceDBPath
      )
    ) {
      await renameFile(plugin, 
        getAbstractFileAtPath(app, context.dbPath),
        newSpaceDBPath
      );
    } else {
      await deleteFile(plugin, getAbstractFileAtPath(app, context.dbPath));
    }
  }
    app.workspace.iterateLeaves((leaf) => {
      if (
        leaf.view.getViewType() == CONTEXT_VIEW_TYPE &&
        leaf.view.getState().contextPath == context.contextPath
      ) {
        leaf.setViewState({
          type: CONTEXT_VIEW_TYPE,
          state: { contextPath: spaceContextPathFromName(newSpace) },
        });
      }
    }, app.workspace["rootSplit"]!);
  
};


export const renameTagContextFile = async (
  plugin: MakeMDPlugin,
  tag: string,
  newTag: string,
) => {
  const context = tagContextFromTag(plugin, tag);
  if (getAbstractFileAtPath(app, context.dbPath)) {
    const newTagDBPath = tagToTagPath(newTag) + ".mdb";
    if (
      !getAbstractFileAtPath(
        app,
        getAbstractFileAtPath(app, context.dbPath).parent.path +
          "/" +
          tagToTagPath(newTag) +
          ".mdb"
      )
    ) {
      await renameFile(plugin, 
        getAbstractFileAtPath(app, context.dbPath),
        tagToTagPath(newTag) + ".mdb"
      );
    } else {
      await deleteFile(plugin, getAbstractFileAtPath(app, context.dbPath));
    }
  }
    plugin.index.renameTag(tag, newTag);
    app.workspace.iterateLeaves((leaf) => {
      if (
        leaf.view.getViewType() == CONTEXT_VIEW_TYPE &&
        leaf.view.getState().contextPath == tag
      ) {
        leaf.setViewState({
          type: CONTEXT_VIEW_TYPE,
          state: { contextPath: newTag },
        });
      }
    }, app.workspace["rootSplit"]!);
  
};
