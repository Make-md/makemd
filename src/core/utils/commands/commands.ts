import { fieldSchema } from "shared/schemas/fields";
import { Command, CommandSchema } from "shared/types/commands";
import { DBTables, SpaceProperty, SpaceTableSchema } from "shared/types/mdb";
import { safelyParseJSON } from "shared/utils/json";

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