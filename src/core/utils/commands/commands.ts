import { fieldSchema } from "schemas/mdb";
import { Command, CommandSchema } from "types/commands";
import { DBTables, SpaceProperty, SpaceTableSchema } from "types/mdb";
import { safelyParseJSON } from "utils/parsers";

export const commandToDBTables = (tables: Command, fields: SpaceProperty[]): DBTables => {
    return ({
      m_fields: {
        uniques: fieldSchema.uniques,
        cols: fieldSchema.cols,
        rows: [...fields.filter(f => f.schemaId != tables.schema.id), ...tables.fields, { name: "$function", schemaId: tables.schema.id, value: tables.code, type: "command"} as SpaceProperty],
      }
    }) as DBTables;
  
  };
  export const mdbSchemaToCommandSchema = (schema: SpaceTableSchema) : CommandSchema => {
    if (!schema) return null;
  return {
    ...schema,
    def: safelyParseJSON(schema.def)
  }
  }