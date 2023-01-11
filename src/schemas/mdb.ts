import i18n from "i18n";
import { DBTable, DBTables, MDBField, MDBSchema, MDBTable } from "types/mdb";

export const fieldTypes = [
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
  },
  {
    type: "number",
    label: i18n.properties.number.label,
  },
  {
    type: "boolean",
    label: i18n.properties.boolean.label,
  },
  {
    type: "date",
    label: i18n.properties.date.label,
  },
  {
    type: "option",
    label: i18n.properties.option.label,
    multi: true,
    multiType: "option-multi",
  },
  {
    type: "file",
    label: i18n.properties.file.label,
    restricted: true,
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
  },
  {
    type: "context",
    label: i18n.properties.context.label,
    multi: true,
    multiType: "context-multi",
  },
  {
    type: "tag",
    label: i18n.properties.tag.label,
    multi: true,
    multiType: "tag-multi",
  },
  {
    type: "image",
    label: i18n.properties.image.label,
    multi: true,
    multiType: "image-multi",
  },
];

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
  uniques: ["id"],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultFileDBSchema, defaultFileListSchema] as MDBSchema[],
};

export const defaultTagSchema: DBTable = {
  uniques: ["id"],
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
      name: "_id",
      schemaId: "files",
      type: "id",
      unique: "true",
      hidden: "true",
    },
    {
      name: "_source",
      schemaId: "files",
      type: "source",
      hidden: "true",
    },
    {
      name: i18n.properties.preview.label,
      schemaId: "files",
      type: "preview",
    },
    {
      name: "File",
      schemaId: "files",
      type: "file",
      primary: "true",
    },
    {
      name: i18n.properties.fileProperty.createdTime,
      schemaId: "files",
      type: "fileprop",
      value: "ctime",
    },
  ] as MDBField[],
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
      name: "_id",
      schemaId: "files",
      type: "id",
      unique: "true",
      hidden: "true",
    },
    {
      name: "_source",
      schemaId: "files",
      type: "source",
      hidden: "true",
    },
    {
      name: "_sourceId",
      schemaId: "files",
      type: "sourceid",
      hidden: "true",
    },
    {
      name: "File",
      schemaId: "files",
      type: "file",
      primary: "true",
    },
  ],
};

export const defaultFolderMDBTable: MDBTable = {
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
