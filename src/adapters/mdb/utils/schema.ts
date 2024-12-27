import { DBTable, SpaceTableSchema } from "shared/types/mdb";

export const saveSchemaToDBTables = (table: SpaceTableSchema, schemas: SpaceTableSchema[]) => {
    const newSchema = schemas.find((f) => f.id == table.id)
      ? true
      : false;

    const newSchemaTable: DBTable = newSchema
      ? {
        uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
          rows: schemas.map((f) => (f.id == table.id ? table : f)),
        }
      : {
        uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
          rows: [...schemas, table],
        };
    return {
        m_schema: newSchemaTable,
    }
  };

  export const deleteSchemaToDBTables = (table: SpaceTableSchema, schemas: SpaceTableSchema[]) => {
    const newSchemaTable: DBTable = {
        uniques: [],
        cols: ["id", "name", "type", "def", "predicate", "primary"],
        rows: schemas.filter((f) => f.id != table.id),
    };
    return {
        m_schema: newSchemaTable,
    }
  }