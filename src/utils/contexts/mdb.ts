import MakeMDPlugin from "main";
import { Database } from "sql.js";
import {
    DBRow,
    DBRows,
    DBTable, MDBField,
    MDBSchema,
    MDBTable
} from "types/mdb";
import { insert } from "utils/array";
import { sanitizeSQLStatement } from "utils/sanitize";
import {
    defaultFolderFields, defaultFolderTables, defaultTagFields, defaultTagTables, fieldSchema
} from "../../schemas/mdb";
import {
    dbResultsToDBTables, deleteFromDB,
    dropTable, getDBFile, saveDBFile, saveDBToPath
} from "../db/db";
import { getAbstractFileAtPath } from "../file";
import { onlyUniqueProp, uniq } from "../tree";
import { genId } from "../uuid";
import { splitString } from "./predicate/predicate";

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

const updateFieldsToSchema = (fields: MDBField[], tag: boolean) => {
  if (tag) {
    return [
      ...fields,
      ...(defaultTagFields.rows.filter(
        (f) => !fields.some((g) => g.name == f.name && g.schemaId == f.schemaId)
      ) as MDBField[]),
    ];
  }
  return [
    ...fields,
    ...(defaultFolderFields.rows.filter(
      (f) => !fields.some((g) => g.name == f.name && g.schemaId == f.schemaId)
    ) as MDBField[]),
  ];
};

export const getMDBTable = async (
  plugin: MakeMDPlugin,
  table: string,
  path: string,
  tag: boolean
): Promise<MDBTable> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(path);
  if (!buf) {
    return null;
  }

  const db = new sqlJS.Database(new Uint8Array(buf));

  await sanitizeTableSchema(plugin, db, path, tag);
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
    return null;
  }
  if (fieldsTables.length == 0) {
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
      `SELECT ${fields
        .reduce((p, c) => [...p, `"${c.name}"`], [])
        .join(", ")} FROM "${table}"`
    )
  );

  db.close();
  return dbTableToMDBTable(
    dbTable[0],
    schema,
    schema.primary ? updateFieldsToSchema(fields, tag) : fields
  );
};

export const deleteMDBTable = async (
  plugin: MakeMDPlugin,
  path: string,
  mdb: string
): Promise<boolean> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(path);
  if (!buf) {
    return false;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  deleteFromDB(db, "m_schema", `id = '${sanitizeSQLStatement(mdb)}'`);
  deleteFromDB(db, "m_schema", `def = '${sanitizeSQLStatement(mdb)}'`);
  deleteFromDB(db, "m_fields", `schemaId = '${sanitizeSQLStatement(mdb)}'`);
  dropTable(db, mdb);
  await saveDBFile(path, db.export().buffer);
  db.close();
  //https://github.com/typeorm/typeorm/issues/1197 CHECK THIS
  //https://news.ycombinator.com/item?id=28157686
  return true;
};

export const getMDBTableSchemas = async (
  plugin: MakeMDPlugin,
  path: string,
  tag: boolean
): Promise<MDBSchema[]> => {
  const sqlJS = await plugin.sqlJS();
  const buf = await getDBFile(path);
  if (!buf) {
    return null;
  }
  const db = new sqlJS.Database(new Uint8Array(buf));
  await sanitizeTableSchema(plugin, db, path, tag);
  const tables = db.exec(`SELECT * FROM m_schema`);
  db.close();
  return tables[0].values.map((f) => {
    const [id, name, type, def, predicate, primary] = f as string[];
    return { id, name, type, def, predicate, primary };
  });
};

export const saveMDBToPath = async (
  plugin: MakeMDPlugin,
  path: string,
  mdb: MDBTable
): Promise<boolean> => {
  const sqlJS = await plugin.sqlJS();

  const buf = await getDBFile(path);
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
      uniques: mdb.cols.filter((c) => c.unique == "true").map((c) => c.name),
      cols: mdb.cols.map((c) => c.name),
      rows: mdb.rows,
    },
  };
  return saveDBToPath(plugin, path, tables);
};

export const optionValuesForColumn = (column: string, table: MDBTable) => {
  return uniq(
    table?.rows.reduce((p, c) => {
      return [...p, ...splitString(c[column])];
    }, []) ?? []
  );
};

export const createDefaultDB = async (
  plugin: MakeMDPlugin,
  path: string,
  tag: boolean
) => {
  const sqlJS = await plugin.sqlJS();
  //try to merge existing
  const table = tag ? defaultTagTables : defaultFolderTables;
  return saveDBToPath(plugin, path, table);
};

const sanitizeTableSchema = async (
  plugin: MakeMDPlugin,
  db: Database,
  path: string,
  tag: boolean
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
    await createDefaultDB(plugin, path, tag);
  }
};

export const newRowByDBRow = (row: DBRow) => ({
  _id: genId(),
  ...row,
});

const rowWithID = (row: DBRow, tag: boolean) => {
  return row._id && row._id.length > 0
    ? row
    : {
        ...newRowByDBRow({ ...row, _source: tag ? "tag" : "folder" }),
      };
};

export const createNewRow = (mdb: MDBTable, row: DBRow, index?: number) => {
    if (index) {
        return {
            ...mdb,
            rows: insert(mdb.rows, index, newRowByDBRow(row))
        }
    }
  return {
    ...mdb,
    rows: [...mdb.rows, newRowByDBRow(row)],
  };
};

export const consolidateFilesToTable = async (
  plugin: MakeMDPlugin,
  path: string,
  table: string,
  files: string[],
  tag?: string
): Promise<MDBTable> => {
  const sqlJS = await plugin.sqlJS();
  const isTag = tag ? true : false;
  let db = new sqlJS.Database();
  if (getAbstractFileAtPath(app, path)) {
    const buf = await getDBFile(path);
    db = new sqlJS.Database(new Uint8Array(buf));
  } else {
    await createDefaultDB(plugin, path, false);
  }
  const mdbTable = await getMDBTable(plugin, table, path, isTag);
  const missingFiles = files
    .filter((f) => !mdbTable.rows.some((g) => g.File == f && g._source != ""))
    .map((f) => ({ File: f }));
  const mergeDuplicates = (rows: DBRows, tag: boolean): DBRows => {
    const mergeFields = (row: DBRow, row2: DBRow) => {
      return { ...row, ...row2 };
    };
    return rows.reduce((p, c) => {
      const findIndex = p.findIndex((f) => f._source != "" && f.File == c.File);
      if (findIndex != -1) {
        return p.map((f, i) => (i == findIndex ? mergeFields(f, c) : f));
      }
      return [...p, c];
    }, []);
  };
  let linkedFolderContexts = [""];
  if (tag) {
    const contexts: string[] = uniq(
      mdbTable.rows.map((f) => f._source).filter((f) => f != "" && f != "tag")
    );
    const promises: Promise<[MDBTable, string]>[] = contexts.map((context) =>
      getMDBTable(plugin, "files", context, false).then((f) => [f, context])
    );
    const results = await Promise.all(promises);
    linkedFolderContexts.push(
      ...results
        .filter(([f, g]) => f?.schema?.def?.split("&").some((h) => h == tag))
        .map(([f, g]) => g)
    );
  }
  const nonLinkedRows = mdbTable.rows.filter(
    (f) =>
      linkedFolderContexts.some((g) => g == f._source) &&
      !missingFiles.some((g) => f.File == g.File)
  );
  const newRows = [
    ...nonLinkedRows,
    ...[
      ...mergeDuplicates(
        mdbTable.rows.filter(
          (f) =>
            (f._source != "" || missingFiles.some((g) => f.File == g.File)) &&
            files.some((g) => g == f.File)
        ),
        isTag
      ),
      ...missingFiles,
    ].map((f) => rowWithID(f, isTag)),
  ];
  const newMDBTable = {
    ...mdbTable,
    cols: [
      ...((isTag ? defaultTagFields : defaultFolderFields).rows as MDBField[]),
      ...mdbTable.cols,
    ].filter(onlyUniqueProp("name")),
    rows: newRows,
  };
  await saveMDBToPath(plugin, path, newMDBTable);
  return newMDBTable;
};

export const consolidateRowsToTag = async (
  plugin: MakeMDPlugin,
  path: string,
  table: string,
  source: string,
  rows: DBRows
): Promise<MDBTable> => {
  const sqlJS = await plugin.sqlJS();
  let db = new sqlJS.Database();
  if (getAbstractFileAtPath(app, path)) {
    const buf = await getDBFile(path);
    db = new sqlJS.Database(new Uint8Array(buf));
  } else {
    await createDefaultDB(plugin, path, true);
  }
  const mdbTable = await getMDBTable(plugin, table, path, true);
  const prevRows = mdbTable.rows
    .map((f) => {
      if (f._source != source) {
        return f;
      }
      const row = rows.find((g) => g._id == f._sourceId);
      return row ? { ...f, File: row["File"] } : f;
    })
    .filter(
      (f) => f._source != source || rows.some((g) => g._id == f._sourceId)
    );

  const missingRows = rows
    .filter(
      (f) =>
        !mdbTable.rows.some((g) => g._source == source && g._sourceId == f._id)
    )
    .map((f) =>
      newRowByDBRow({ File: f.File, _source: source, _sourceId: f._id })
    );
  const newRows = [...prevRows, ...missingRows];
  const newMDBTable = {
    ...mdbTable,
    cols: [...(defaultTagFields.rows as MDBField[]), ...mdbTable.cols].filter(
      onlyUniqueProp("name")
    ),
    rows: newRows,
  };
  await saveMDBToPath(plugin, path, newMDBTable);
  return newMDBTable;
};
