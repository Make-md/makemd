import MakeMDPlugin from "main";
import { FileSystemAdapter, normalizePath } from "obsidian";
import { Database, QueryExecResult, SqlJsStatic } from "sql.js";
import { DBTable, DBTables } from "types/mdb";
import { sanitizeSQLStatement } from "utils/sanitize";
import { serializeSQLFieldNames, serializeSQLStatements, serializeSQLValues } from "utils/serializer";
import { uniq } from "../array";

export const getDBFile = async (path: string, isRemote: boolean) => {
  if (isRemote) {
    return fetch(path).then((res) => res.arrayBuffer());
  }
  if (!(await app.vault.adapter.exists(normalizePath(path)))) {
    return null;
  }
  const file = await (app.vault.adapter as FileSystemAdapter).readBinary(
    normalizePath(path)
  );
  return file;
};

export const getDB = async (
  sqlJS: SqlJsStatic,
  path: string,
  isRemote?: boolean
) => {
  const buf = await getDBFile(path, isRemote);
  if (buf) {
    return new sqlJS.Database(new Uint8Array(buf));
  }
  return new sqlJS.Database();
};

export const saveDBAndKeepAlive = (db: Database, path: string) => {
  const results = saveDBFile(path, db.export().buffer);
  return results;
};

export const saveAndCloseDB = async (db: Database, path: string) => {
  await saveDBFile(path, db.export().buffer);
  db.close();
};

export const saveDBFile = async (path: string, binary: ArrayBuffer) => {
  const file = (app.vault.adapter as FileSystemAdapter).writeBinary(
    normalizePath(path),
    binary
  );
  return file;
};

export const getAllTables = async (
  sqlJS: SqlJsStatic,
  path: string
): Promise<string[]> => {
  let db = await getDB(sqlJS, path);
  let tables;
  try {
    tables = db.exec(
      "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    );
  } catch (e) {
    console.log(e);
    db.close();
    return null;
  }
  const tableNames: string[] = tables[0].values.map((a) => a[0]) as string[];
  db.close();
  return tableNames;
};
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

export const updateDBConditionally = (
  db: Database,
  tables: DBTables,
  condition: string
) => {
  const sqlstr = serializeSQLStatements(Object.keys(tables)
    .map((t) => {
      const tableFields = tables[t].cols;
      const rowsQuery = tables[t].rows.reduce((prev, curr) => {
        return `${prev}\ UPDATE "${t}" SET ${serializeSQLValues(tableFields
          .map((c) => `${c}='${sanitizeSQLStatement(curr?.[c]) ?? ""}'`)
          )} WHERE ${condition};`;
      }, "");
      return rowsQuery;
    })
    );
  // Run the query without returning anything
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
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
        return `${prev}\ UPDATE "${t}" SET ${serializeSQLValues(tableFields
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

export const insertIntoDB = (
  db: Database,
  tables: DBTables,
  replace?: boolean
) => {
  const sqlstr = serializeSQLStatements(Object.keys(tables)
    .map((t) => {
      const tableFields = tables[t].cols;
      const rowsQuery = tables[t].rows.reduce((prev, curr) => {
        return `${prev}\ ${
          replace ? "REPLACE" : "INSERT"
        } INTO "${t}" VALUES (${serializeSQLValues(tableFields
          .map((c) => `'${sanitizeSQLStatement(curr?.[c]) ?? ""}'`)
          )});`;
      }, "");
      return rowsQuery;
    })
    );
  try {
    db.exec(`BEGIN TRANSACTION; ${sqlstr} COMMIT;`);
  } catch (e) {
    console.log(e);
  }
};

export const replaceDB = (db: Database, tables: DBTables) => {
  //rewrite the entire table, useful for storing ranks and col order, not good for performance
  const sqlstr = serializeSQLStatements(Object.keys(tables)
    .map((t) => {
      const tableFields = tables[t].cols;
      const fieldQuery = serializeSQLFieldNames(uniq(tableFields)
        .map((f) => `'${sanitizeSQLStatement(f)}' char`));
      const rowsQuery = tables[t].rows.reduce((prev, curr) => {
        return `${prev}\ REPLACE INTO "${t}" VALUES (${serializeSQLValues(tableFields
          .map((c) => `'${sanitizeSQLStatement(curr?.[c]) ?? ""}'`))});`;
      }, "");
      const idxQuery = tables[t].uniques
        .filter((f) => f)
        .reduce((p, c) => {
          return `${p}\ CREATE UNIQUE INDEX IF NOT EXISTS idx_${t}_${c.replace(
            /,/g,
            "_"
          )} ON ${t}(${c});`;
        }, "");
      const insertQuery = `CREATE TABLE IF NOT EXISTS "${t}" (${fieldQuery}); ${idxQuery} BEGIN TRANSACTION; ${rowsQuery} COMMIT;`;
      return `DROP INDEX IF EXISTS idx_${t}__id; DROP TABLE IF EXISTS "${t}"; ${
        fieldQuery.length > 0 ? insertQuery : ""
      }`;
    }));
  // Run the query without returning anything
  try {
    db.exec(sqlstr);
  } catch (e) {
    console.log(e);
  }
};

export const saveDBToPath = async (
  plugin: MakeMDPlugin,
  path: string,
  tables: DBTables
): Promise<boolean> => {
  const sqlJS = await plugin.sqlJS();
  //rewrite the entire table, useful for storing ranks and col order, not good for performance
  let db = await getDB(sqlJS, path);
  if (!db) {
    db.close()
    return false;
  }
  replaceDB(db, tables);
  
  await saveDBFile(path, db.export().buffer);
  db.close();
  return true;
};
