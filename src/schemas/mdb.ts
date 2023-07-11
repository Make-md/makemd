import i18n from "i18n";
import { FilePropertyName } from "types/context";
import { ContextInfo } from "types/contextInfo";
import { DBTable, DBTables, MDBField, MDBSchema, MDBTable } from "types/mdb";
import { parsePropString } from "utils/contexts/parsers";

export type FieldType = {
  type: string;
  label: string;
  restricted?: boolean;
  icon?: string;
  multi?: boolean;
  metadata?: boolean;
  multiType?: string;
  defaultValue?: string;
};

export const fieldTypeForType = (type: string) =>
    fieldTypes.find((t) => type == t.type) ||
    fieldTypes.find((t) => type == t.multiType);

export const fieldTypes: FieldType[] = [
  {
    type: "unknown",
    label: "",
    restricted: true,
  },
  {
    type: "preview",
    label: i18n.properties.preview.label,
    restricted: true,
  },
  {
    type: "text",
    label: i18n.properties.text.label,
    metadata: true,
    icon: 'mk-make-h3'
  },
  {
    type: "number",
    label: i18n.properties.number.label,
    metadata: true,
    icon: 'mk-make-tag'
  },
  {
    type: "boolean",
    label: i18n.properties.boolean.label,
    metadata: true,
    icon: 'mk-make-todo'
  },
  {
    type: "date",
    label: i18n.properties.date.label,
    metadata: true,
    icon: 'mk-make-date'
  },
  {
    type: "option",
    label: i18n.properties.option.label,
    multi: true,
    multiType: "option-multi",
    icon: 'mk-make-list'
  },
  {
    type: "file",
    label: i18n.properties.file.label,
    restricted: true,
    icon: 'mk-make-h3'
  },
  {
    type: "fileprop",
    label: i18n.properties.fileProperty.label,
  },
  {
    type: "link",
    label: i18n.properties.link.label,
    multi: true,
    multiType: "link-multi",
    metadata: true,
    icon: 'mk-make-note'
  },
  {
    type: "context",
    label: i18n.properties.context.label,
    multi: true,
    multiType: "context-multi",
    icon: 'mk-make-note'
  },
  {
    type: "object",
    label: i18n.properties.context.label,
    restricted: true,
    metadata: true,
  },
  {
    type: "image",
    label: i18n.properties.image.label,
    multi: true,
    multiType: "image-multi",
    metadata: true,
    icon: 'mk-make-image'
  },
];

export const defaultValueForPropertyType = (name: string, value: string, type: string) => {
  if (type == "preview") {
    return "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
  }
  if (type == 'fileprop') {
    const {field, property} = parsePropString(value)
    if (property == 'ctime' || property == 'mtime')
    return (Date.now()-60).toString();
    return value;
  }
  if (type == 'file') {
    return "Note Name"
  }
  if (type == "date") {
    return "2020-04-21";
  }
  if (type == "number") {
    return "123";
  }
  if (type == "boolean") {
    return "true";
  }
  if (type == "link") {
    return "[[Select Note]]";
  }
  if (type == "option") {
    return "one, two";
  }
  if (type == "text") {
    return name;
  }
  if (type == "image") {
    return "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
  }
  return ""
};

export const defaultFileDBSchema: MDBSchema = {
  id: "files",
  name: "Files",
  type: "db",
  primary: "true",
};

export const defaultFileListSchema: MDBSchema = {
  id: "filesView",
  name: "Files",
  type: "list",
  def: "files",
};

export const defaultFileTableSchema: MDBSchema = {
  id: "filesView",
  name: "Files",
  type: "table",
  def: "files",
};

export const defaultFolderSchema: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultFileDBSchema, defaultFileListSchema] as MDBSchema[],
};

export const defaultTagSchema: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultFileDBSchema, defaultFileTableSchema] as MDBSchema[],
};

export const fieldSchema = {
  uniques: ["name,schemaId"],
  cols: [
    "name",
    "schemaId",
    "type",
    "value",
    "attrs",
    "hidden",
    "unique",
    "primary",
  ],
};

export const defaultFolderFields: DBTable = {
  ...fieldSchema,
  rows: [
    {
      name: i18n.properties.preview.label,
      schemaId: "files",
      type: "preview",
      hidden: "",
      unique: "",
      attrs: "",
      value: "",
      primary: "",
    },
    {
      name: FilePropertyName,
      schemaId: "files",
      type: "file",
      primary: "true",
      hidden: "",
      unique: "",
      attrs: "",
      value: "",
    },
    {
      name: i18n.properties.fileProperty.createdTime,
      schemaId: "files",
      type: "fileprop",
      value: "File.ctime",
      hidden: "",
      unique: "",
      attrs: "",
      primary: "",
    },
  ] as MDBField[],
};

export const defaultFieldsForContext = (context: ContextInfo) => {
  if (context.type == 'tag') {
    return defaultTagFields
  } else if (context.type == 'folder') {
    return defaultFolderFields;
  }
  return defaultFolderFields;
};

export const defaultTableFields: MDBField[] = [
  {
    name: i18n.properties.defaultField,
    schemaId: "",
    type: "text",
  },
];

export const defaultTagFields: DBTable = {
  ...fieldSchema,
  rows: [
    {
      name: FilePropertyName,
      schemaId: "files",
      type: "file",
      primary: "true",
      hidden: "",
      unique: "",
      attrs: "",
      value: "",
    },
  ],
};

export const defaultMDBTableForContext = (context: ContextInfo) => {
  if (context.type == 'tag') {
    return defaultTagMDBTable;
  } else if (context.type == 'folder') {
    return defaultFolderMDBTable;
  }
  return defaultFolderMDBTable;
};

export const defaultFolderMDBTable: MDBTable = {
  schema: defaultFileDBSchema,
  cols: defaultFolderFields.rows as MDBField[],
  rows: [],
};

export const defaultQueryMDBTable: MDBTable = {
  schema: defaultFileDBSchema,
  cols: defaultFolderFields.rows as MDBField[],
  rows: [],
};

export const defaultTagMDBTable: MDBTable = {
  schema: defaultFileDBSchema,
  cols: defaultTagFields.rows as MDBField[],
  rows: [],
};

export const fieldsToTable = (
  fields: MDBField[],
  schemas: MDBSchema[]
): DBTables => {
  return fields
    .filter((s) => schemas.find((g) => g.id == s.schemaId && g.type == "db"))
    .reduce<DBTables>((p, c) => {
      return {
        ...p,
        ...(p[c.schemaId]
          ? {
              [c.schemaId]: {
                uniques:
                  c.unique == "true"
                    ? [...p[c.schemaId].uniques, c.name]
                    : p[c.schemaId].uniques,
                cols: [...p[c.schemaId].cols, c.name],
                rows: [],
              },
            }
          : {
              [c.schemaId]: {
                uniques: c.unique == "true" ? [c.name] : [],
                cols: [c.name],
                rows: [],
              },
            }),
      };
    }, {});
};

export const defaultTablesForContext = (context: ContextInfo) => {
  if (context.type == "tag") {
    return defaultTagTables
  } else if (context.type == 'folder') {
    return defaultFolderTables
  } 
  return defaultFolderTables
};

export const defaultFolderTables = {
  m_schema: defaultFolderSchema,
  m_fields: defaultFolderFields,
  ...fieldsToTable(
    defaultFolderFields.rows as MDBField[],
    defaultFolderSchema.rows as MDBSchema[]
  ),
};

export const defaultTagTables = {
  m_schema: defaultTagSchema,
  m_fields: defaultTagFields,
  ...fieldsToTable(
    defaultTagFields.rows as MDBField[],
    defaultTagSchema.rows as MDBSchema[]
  ),
};
