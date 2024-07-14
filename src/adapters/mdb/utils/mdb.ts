
import {
  DBTable,
  FilesystemSpaceInfo,
  MDB,
  SpaceProperty,
  SpaceTable,
  SpaceTableSchema,
  SpaceTables
} from "types/mdb";

import { vaultSchema } from "adapters/obsidian/filesystem/schemas/vaultSchema";
import {
  defaultFieldsForContext
} from "schemas/mdb";
import { Database, QueryExecResult } from "sql.js";
import { sanitizeSQLStatement } from "utils/sanitizers";
import {
  dbResultsToDBTables,
  deleteFromDB,
  dropTable, getDBFile, replaceDB, saveDBFile
} from "../db/db";
import { MDBFileTypeAdapter } from "../mdbAdapter";




export const dbTableToMDBTable = (
  table: DBTable,
  schema: SpaceTableSchema,
  fields: SpaceProperty[]
): SpaceTable => {
  return {
    schema,
    cols: fields,
    rows: table?.rows ?? [],
  };
};

const updateFieldsToSchema = (fields: SpaceProperty[], space: FilesystemSpaceInfo) => {
  const defaultFields = defaultFieldsForContext(space);
  return [
    ...fields,
    ...(defaultFields.rows.filter(
      (f) => !fields.some((g) => g.name == f.name && g.schemaId == f.schemaId)
    ) as SpaceProperty[]),
  ];
};


export const getMDB = async (
  plugin: MDBFileTypeAdapter,
  path: string,
): Promise<MDB> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(plugin, path, false);
  if (!buf) {
    return null;
  }

  const db = new sqlJS.Database(new Uint8Array(buf));

  let fields;
  let schemas;
  try {
    fields = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_fields`)
    )[0].rows as SpaceProperty[];
    schemas = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_schema`)
    )[0].rows as SpaceTableSchema[];
  } catch (e) {
    db.close();
    return null;
  }
  let dbTable
  try {
   dbTable = schemas.filter(f => f.type == 'db').map(f => ({[f.id]: dbResultsToDBTables(
    db.exec(
      `SELECT * FROM "${f.id}"`
    )
  )[0]})).reduce((p,c) => ({...p, ...c}), {});
  
    } catch (e) {
      db.close();
      return null
    }

  db.close();
  return {
    schemas,
    fields,
    tables: dbTable
  }
};



export const getMDBTable = async (
  adapter: MDBFileTypeAdapter,
  dbPath: string,
  table: string,
): Promise<SpaceTable> => {

  
  const sqlJS = await adapter.sqlJS();
  const buf = await getDBFile(adapter, dbPath, false);
  
  if (!buf) {
    return null;
  }

  const db = new sqlJS.Database(new Uint8Array(buf));

  let fieldsTables;
  let schema;
  try {
    fieldsTables = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_fields WHERE schemaId = '${table}'`)
    );
    schema = dbResultsToDBTables(
      db.exec(`SELECT * FROM m_schema WHERE id = '${table}'`)
    )[0]?.rows[0] as SpaceTableSchema;
  } catch (e) {
    adapter.plugin.superstate.ui.error(e);
    db.close();
    return null;
  }
  if (!schema) return null;
  

  const fields = (fieldsTables[0]?.rows as SpaceProperty[] ?? []).filter(
    (f) => f.name.length > 0
  );
  let dbTable;
  try {
      dbTable = dbResultsToDBTables(
      db.exec(
        `SELECT * FROM "${table}"`
      )
    );
      } catch (e) {
      db.close();
      return {
        schema: schema,
        cols: fields,
        rows: [],
      };
    }

  db.close();
  return dbTableToMDBTable(
    dbTable[0],
    schema,
    fields
  );
};

export const getMDBTables = async (plugin: MDBFileTypeAdapter, dbPath: string) => {
  const sqlJS = await plugin.sqlJS();
    const buf = await getDBFile(plugin, dbPath, false);
    if (!buf) {
      return null;
    }
  
    const db = new sqlJS.Database(new Uint8Array(buf));
  
    let schemas = []
    try {
       schemas = (dbResultsToDBTables(
      db.exec(`SELECT * FROM m_schema`)
    )[0]?.rows ?? []) as SpaceTableSchema[];
    } catch (e) {
      db.close();
      return null;
    }
    const mdbTables = {} as SpaceTables;
    schemas.forEach(schema => {
      let fieldsTables;
      try {
        fieldsTables = dbResultsToDBTables(
          db.exec(`SELECT * FROM m_fields WHERE schemaId = '${schema.id}'`)
        );
        
      } catch (e) {
        return;
      }
      
    
      const fields = (fieldsTables?.[0]?.rows as SpaceProperty[] ?? []).filter(
        (f) => f.name.length > 0
      );
    
      let dbTable;
      try {
      dbTable = dbResultsToDBTables(db.exec(`SELECT * FROM "${schema.id}"`));
      
      mdbTables[schema.id] = dbTableToMDBTable(
        dbTable[0],
        schema,
        fields
      );} catch (e) {
        
        mdbTables[schema.id] = {
          schema,
          cols: fields,
          rows: [],
        };
        return;
      }
    })
    db.close();
    return mdbTables
}

export const deleteMDBTable = async (
  plugin: MDBFileTypeAdapter,
  table: string,
  dbPath: string,
): Promise<boolean> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(plugin, dbPath, false);
  if (!buf) {
    return false;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  deleteFromDB(db, "m_schema", `id = '${sanitizeSQLStatement(table)}'`);
  deleteFromDB(db, "m_schema", `def = '${sanitizeSQLStatement(table)}'`);
  deleteFromDB(db, "m_fields", `schemaId = '${sanitizeSQLStatement(table)}'`);
  dropTable(db, table);
  await saveDBFile(plugin, dbPath, db.export().buffer);
  db.close();
  return true;
};

export const getMDBTableSchemas = async (
  plugin: MDBFileTypeAdapter,
  path: string,
): Promise<SpaceTableSchema[]> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(plugin, path, false);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  let schemas : QueryExecResult[] = [];
  try {
    schemas = db.exec(`SELECT * FROM m_schema`)
  } catch (e) {
    console.log(e, path)
  }
  db.close();
  return (schemas[0]?.values ?? []).map((f) => {
    const [id, name, type, def, predicate, primary] = f as string[];
    return { id, name, type, def, predicate, primary };
  });
};

export const getMDBTableProperties = async (
  adapter: MDBFileTypeAdapter,
  path: string,
): Promise<SpaceProperty[]> => {
  const sqlJS = await adapter.sqlJS();
  const buf = await getDBFile(adapter, path, false);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  let fieldsTables
  

  try {
    fieldsTables = dbResultsToDBTables(db.exec(`SELECT * FROM m_fields`))[0].rows as SpaceProperty[];

  } catch (e) {
    adapter.plugin.superstate.ui.error(e);
    db.close();
    return [];
  }
  
  if (fieldsTables.length == 0) {
    try {
      db.exec(
        `CREATE TABLE m_fields (name TEXT, schemaId TEXT, type TEXT, value TEXT, hidden TEXT, attrs TEXT, unique TEXT, primary TEXT)`
      );
    } catch (e) {
      console.log(e);
    }
    
    db.close();

    return [];
  }
  db.close();
  return fieldsTables;
};

export const initiateDB = (db: Database) => {
  replaceDB(db, {
    vault: vaultSchema,
  });
};




