import { getParentPathFromString } from "adapters/obsidian/utils/file";

import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { defaultFrameSchema } from "schemas/frames";
import { defaultFramesTable, fieldSchema } from "schemas/mdb";
import { Database, QueryExecResult, SqlJsStatic } from "sql.js";
import { DBTable, DBTables, SpaceTables } from "types/mdb";
import { MDBFrames } from "types/mframe";
import { uniq } from "utils/array";
import { removeTrailingSlashFromFolder } from "utils/path";
import { sanitizeSQLStatement } from "utils/sanitizers";
import { serializeSQLFieldNames, serializeSQLStatements, serializeSQLValues } from "utils/serializers";

export const getDBFile = async (plugin: MDBFileTypeAdapter,
  path: string, isRemote: boolean) => {
  if (isRemote) {
    return fetch(path).then((res) => res.arrayBuffer());
  }
  if (!(await plugin.middleware.fileExists(path))) {
    return null;
  }
  const file = await plugin.middleware.readBinaryToFile(
    path
  );
  return file;
};

export const getDB = async (
  plugin: MDBFileTypeAdapter,
  sqlJS: SqlJsStatic,
  path: string,
  isRemote?: boolean,
) => {
  const buf = await getDBFile(plugin, path, isRemote);
  if (buf) {
    const db = await new sqlJS.Database(new Uint8Array(buf));
    try {
      db.exec(
        "SELECT name FROM sqlite_schema"
      );
    } catch {
      return new sqlJS.Database();
    }
    return db
  }
  return new sqlJS.Database();
};



export const saveDBFile = async (plugin: MDBFileTypeAdapter, path: string, binary: ArrayBuffer) => {
  
  if (
    !(await plugin.middleware.fileExists(
      removeTrailingSlashFromFolder(getParentPathFromString(path)))
    )
    
  ) {
    
    await plugin.middleware.createFolder(getParentPathFromString(path));
  }
  const file = plugin.middleware.writeBinaryToFile(
    path,
    binary
  );
  return file;
};



export const mdbTablesToDBTables = (tables: SpaceTables, uniques?: { [x: string] : string[] }) : DBTables => {
  return Object.keys(tables).reduce((p, c) => {
    return {
      ...p,
      [c]: {
        uniques: uniques?.[c] ?? [],
        cols: tables[c].cols.map((f) => f.name),
        rows: tables[c].rows
      },
    };
  }, {m_fields: {
    uniques: fieldSchema.uniques,
    cols: fieldSchema.cols,
    rows: Object.values(tables).flatMap(f => f.cols),
  }}) as DBTables;
  
}

export const mdbFrameToDBTables = (tables: MDBFrames, uniques?: { [x: string] : string[] }) : DBTables => {
  return Object.keys(tables).reduce((p, c) => {
    return {
      ...p,
      [c]: {
        uniques: defaultFrameSchema.uniques,
        cols: defaultFrameSchema.cols,
        rows: tables[c].rows
      },
    };
  }, {m_fields: {
    uniques: fieldSchema.uniques,
    cols: fieldSchema.cols,
    rows: Object.values(tables).flatMap(f => f.cols),
  }}) as DBTables;
  
}

export const schemasAndFields = (tables: SpaceTables) : DBTables => {
  return {m_fields: {
    uniques: fieldSchema.uniques,
    cols: fieldSchema.cols,
    rows: Object.values(tables).flatMap(f => f.cols),
  },
  m_schema: defaultFramesTable
  }
}
export const dbResultsToDBTables = (res: QueryExecResult[]): DBTable[] => {
  return res.reduce(
    (p, c, i) => [
      ...p,
      {
        cols: c.columns,
        rows: c
          ? c.values.map((r) =>
              c.columns.reduce(
                (prev, curr, index) => ({ ...prev, [curr]: r[index] }),
                {}
              )
            )
          : [],
      },
    ],
    []
  ) as DBTable[];
};



export const selectDB = (
  db: Database,
  table: string,
  condition?: string,
  fields?: string
): DBTable | null => {
  const fieldsStr = fields ?? "*";
  const sqlstr = condition
    ? `SELECT ${fieldsStr} FROM "${table}" WHERE ${condition};`
    : `SELECT ${fieldsStr} FROM ${table};`;
  let tables;
  try {
    tables = dbResultsToDBTables(db.exec(sqlstr)); // Run the query without returning anything
  } catch (e) {
    return null;
  }
  if (tables.length == 1) return tables[0];
  return null;
};

export const insertIntoDB = (
  db: Database,
  tables: DBTables,
  replace?: boolean
) => {
  const sqlstr = serializeSQLStatements(Object.keys(tables)
    .map((t) => {
      const tableFields = tables[t].cols;
      const rowsQuery = tables[t].rows.reduce((prev, curr) => {
        return `${prev} ${
          replace ? "REPLACE" : "INSERT"
        } INTO "${t}" VALUES (${serializeSQLValues(tableFields
          .map((c) => `'${sanitizeSQLStatement(curr?.[c]) ?? ""}'`)
          )});`;
      }, "");
      return rowsQuery;
    })
    );
  try {
    db.exec(`${sqlstr}`);
  } catch (e) {
    console.log(e);
  }
};


export const updateDB = (
  db: Database,
  tables: DBTables,
  updateCol: string,
  updateRef: string
) => {
  const sqlstr = serializeSQLStatements(Object.keys(tables)
    .map((t) => {
      const tableFields = tables[t].cols.filter((f) => f != updateRef);
      const rowsQuery = tables[t].rows.reduce((prev, curr) => {
        return `${prev} UPDATE "${t}" SET ${serializeSQLValues(tableFields
          .map((c) => `${c}='${sanitizeSQLStatement(curr?.[c]) ?? ""}'`)
          )} WHERE ${updateCol}='${
          sanitizeSQLStatement(curr?.[updateRef]) ?? ""
        }';`;
      }, "");
      return rowsQuery;
    })
    );
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
};

export const execQuery = (db: Database, sqlstr: string) => {
  //Fastest, but doesn't handle errors
  // Run the query without returning anything
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
};


export const deleteFromDB = (
  db: Database,
  table: string,
  condition: string
) => {
  const sqlstr = `DELETE FROM "${table}" WHERE ${condition};`;
  // Run the query without returning anything
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
};

export const dropTable = (db: Database, table: string) => {
  const sqlstr = `DROP TABLE IF EXISTS "${table}";`;
  // Run the query without returning anything
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
};



export const replaceDB = (db: Database, tables: DBTables) => {
  //rewrite the entire table, useful for storing ranks and col order, not good for performance
  const sqlStatements : string[] = [];
  Object.keys(tables)
    .forEach((t) => {
      const tableFields = tables[t].cols;
      const fieldQuery = serializeSQLFieldNames(uniq(tableFields).
        filter(f => f).map((f) => `'${sanitizeSQLStatement(f)}' char`));
      
      const createQuery = `CREATE TABLE IF NOT EXISTS "${t}" (${fieldQuery}); `
      const idxQuery = tables[t].uniques
        .filter((f) => f)
        .reduce((p, c) => {
          return `${p} CREATE UNIQUE INDEX IF NOT EXISTS "idx_${t}_${c.replace(
            /,/g,
            "_"
          )}" ON "${t}"(${c});`;
        }, "");
      const beginTransaction = `BEGIN TRANSACTION;`
      const rowsQuery = tables[t].rows.map((curr) => {
        return `REPLACE INTO "${t}" VALUES (${serializeSQLValues(tableFields
          .map((c) => `'${sanitizeSQLStatement(curr?.[c] ?? "")}'`))});`;
      });
      const commitQuery = `COMMIT;`;
      sqlStatements.push(`DROP INDEX IF EXISTS "idx_${t}__id"; DROP TABLE IF EXISTS "${t}";`)
      if (fieldQuery.length > 0) {
        sqlStatements.push(createQuery);
        sqlStatements.push(idxQuery);
        sqlStatements.push(beginTransaction);
        sqlStatements.push(...rowsQuery);
        sqlStatements.push(commitQuery);
      }

    });
  // Run the query without returning anything
  try {
    for (const s of sqlStatements) {
      db.exec(s)
    }
  } catch (e) {

    console.log(e);
  }
};

export const saveDBToPath = async (
  plugin: MDBFileTypeAdapter,
  path: string,
  tables: DBTables
): Promise<boolean> => {

  const sqlJS = await plugin.sqlJS();
  //rewrite the entire table, useful for storing ranks and col order, not good for performance
  const db = await getDB(plugin, sqlJS, path);
  if (!db) {
    db.close()
    return false;
  }
  replaceDB(db, tables);

  await saveDBFile(plugin, path, db.export().buffer);
  db.close();
  
    
  return true;
};
