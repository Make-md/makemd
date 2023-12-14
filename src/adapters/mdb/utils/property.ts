import { fieldSchema } from "schemas/mdb";
import { DBTables, SpaceProperty } from "types/mdb";
import { sanitizeColumnName } from "utils/sanitizers";

export const savePropertyToDBTables = (newColumn: SpaceProperty, fields: SpaceProperty[], oldColumn?: SpaceProperty): DBTables => {
    const column = {
      ...newColumn,
      name: sanitizeColumnName(newColumn.name),
    };

    
    const oldFieldIndex = oldColumn
      ? fields.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: SpaceProperty[] =
      oldFieldIndex == -1
        ? [...fields, column]
        : fields.map((f, i) => (i == oldFieldIndex ? column : f));
    return {
        m_fields: {
            uniques: fieldSchema.uniques,
            cols: fieldSchema.cols,
            rows: [...(fields ?? []), ...newFields],
          },
    };
  };

  export const deletePropertyToDBTables = (column: SpaceProperty, fields: SpaceProperty[]): DBTables => {
    const newFields = fields.filter((f) => !(f.name == column.name && f.schemaId == column.schemaId));
    return {
        m_fields: {
            uniques: fieldSchema.uniques,
            cols: fieldSchema.cols,
            rows: [...(fields ?? []), ...newFields],
          },
    };
  } 