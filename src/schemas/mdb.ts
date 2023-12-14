import i18n from "core/i18n";
import { PathPropertyName } from "core/types/context";
import { frameSchemaToMDBSchema } from "core/utils/frames/nodes";
import { DBTable, DBTables, SpaceInfo, SpaceProperty, SpaceTable, SpaceTableSchema } from "types/mdb";
import { FrameSchema } from "types/mframe";
import { parsePropString, safelyParseJSON } from "utils/parsers";

export type FieldType = {
  type: string;
  label: string;
  restricted?: boolean;
  icon?: string;
  multi?: boolean;
  metadata?: boolean;
  multiType?: string;
  configKeys?: string[];
};

export const stickerForField = (f: SpaceProperty) => f.attrs?.length > 0
? safelyParseJSON(f.attrs)?.icon ?? fieldTypeForType(f.type, f.name)?.icon
: fieldTypeForType(f.type, f.name)?.icon

export const fieldTypeForType = (type: string, name?: string) =>
    name == PathPropertyName ? fieldTypes.find((t) => t.type == 'file') : name == 'tags' ? fieldTypes.find((t) => t.type == 'tags') : name == 'aliases' ? fieldTypes.find((t) => t.type == 'option-multi') : name == 'sticker' ? fieldTypes.find((t) => type == 'icon') : fieldTypes.find((t) => type == t.type) ||
    fieldTypes.find((t) => type == t.multiType);

export const fieldTypes: FieldType[] = [
  {
    type: "unknown",
    label: "",
    restricted: true,
    icon: 'lucide//file-question'
  },
  {
    type: "text",
    label: i18n.properties.text.label,
    metadata: true,
    icon: 'lucide//text'
  },
  {
    type: "number",
    label: i18n.properties.number.label,
    metadata: true,
    icon: 'lucide//binary',
    configKeys: ['unit']
  },
  {
    type: "boolean",
    label: i18n.properties.boolean.label,
    metadata: true,
    icon: 'lucide//check-square'
  },
  {
    type: "date",
    label: i18n.properties.date.label,
    metadata: true,
    icon: 'lucide//calendar',
    configKeys: ['format']
  },
  {
    type: "option",
    label: i18n.properties.option.label,
    multi: true,
    multiType: "option-multi",
    icon: 'lucide//list',
    configKeys: ['options']
  },
  {
    type: "tags",
    label: i18n.properties.tags.label,
    icon: 'lucide//tags',
  },
  {
    type: "file",
    label: i18n.properties.file.label,
    restricted: true,
    icon: 'ui//mk-make-h3'
  },
  {
    type: "fileprop",
    label: i18n.properties.fileProperty.label,
    icon: 'lucide//list',
    configKeys:['field', 'value']
  },
  {
    type: "link",
    label: i18n.properties.link.label,
    multi: true,
    multiType: "link-multi",
    metadata: true,
    icon: 'lucide//file-text'
  },
  {
    type: "context",
    label: i18n.properties.context.label,
    icon: 'ui//mk-make-note',
    multi: true,
    multiType: "context-multi",
    configKeys: ['space']
  },
  {
    type: "object",
    label: i18n.properties.object.label,
    multi: true,
    multiType: 'object-multi',
    metadata: true,
    icon: 'lucide//list-tree'
  },
  {
    type: "icon",
    label: i18n.properties.icon.label,
    multi: true,
    multiType: "icon-multi",
    icon: 'lucide//gem',
    restricted: true
  },
  {
    type: "image",
    label: i18n.properties.image.label,
    multi: true,
    multiType: "image-multi",
    metadata: true,
    icon: 'ui//mk-make-image'
  },
  {
    type: "color",
    label: i18n.properties.color.label,
    icon: 'ui//mk-make-image',
    restricted: true
  },
  {
    type: "space",
    label: i18n.properties.space.label,
    icon: 'lucide//layout-grid',
    restricted: true
  },
  {
    type: 'super',
    label: i18n.properties.super.label,
    icon: 'lucide//zap',
    restricted: true,
    configKeys: ['dynamic', 'field']
  }
  
];

export const defaultValueForPropertyType = (name: string, value: string, type: string) => {
  
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
export const defaultContextSchemaID = "files";
export const defaultContextDBSchema: SpaceTableSchema = {
  id: defaultContextSchemaID,
  name: "Files",
  type: "db",
  primary: "true",
};

export const defaultFrameListViewID = "filesView";
export const defaultFrameListViewSchema: FrameSchema = {
  id: defaultFrameListViewID,
  name: "Files",
  type: "view",
  def: {db: defaultContextSchemaID},
};


export const mainFrameID = 'main'

export const defaultMainFrameSchema = (id: string) => ({id, name: id, type: 'frame', def: '', predicate: '', primary: "true"})

export const defaultFramesTable: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultMainFrameSchema(mainFrameID), frameSchemaToMDBSchema(defaultFrameListViewSchema)] as SpaceTableSchema[],
};


export const defaultContextTable: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultContextDBSchema] as SpaceTableSchema[],
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

export const defaultContextFields: DBTable = {
  ...fieldSchema,
  rows: [
    {
      name: PathPropertyName,
      schemaId: defaultContextSchemaID,
      type: "file",
      primary: "true",
      hidden: "",
      unique: "",
      attrs: "",
      value: "",
    },
    {
      name: i18n.properties.fileProperty.createdTime,
      schemaId: defaultContextSchemaID,
      type: "fileprop",
      value: PathPropertyName+".ctime",
      hidden: "",
      unique: "",
      attrs: "",
      primary: "true",
    },
  ] as SpaceProperty[],
};

export const defaultFieldsForContext = (space: SpaceInfo) => {
  return defaultContextFields;
};

export const defaultTableFields: SpaceProperty[] = [
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
      name: PathPropertyName,
      schemaId: defaultContextSchemaID,
      type: "file",
      primary: "true",
      hidden: "",
      unique: "",
      attrs: "",
      value: "",
    },
  ],
};

export const defaultMDBTableForContext = (space: SpaceInfo) => {
  
  return defaultFolderMDBTable;
};

export const defaultFolderMDBTable: SpaceTable = {
  schema: defaultContextDBSchema,
  cols: defaultContextFields.rows as SpaceProperty[],
  rows: [],
};

export const defaultQueryMDBTable: SpaceTable = {
  schema: defaultContextDBSchema,
  cols: defaultContextFields.rows as SpaceProperty[],
  rows: [],
};

export const defaultTagMDBTable: SpaceTable = {
  schema: defaultContextDBSchema,
  cols: defaultTagFields.rows as SpaceProperty[],
  rows: [],
};

export const fieldsToTable = (
  fields: SpaceProperty[],
  schemas: SpaceTableSchema[]
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

export const defaultTablesForContext = (space: SpaceInfo) => {
  
  return defaultFolderTables
};

export const defaultFolderTables = {
  m_schema: defaultContextTable,
  m_fields: defaultContextFields,
  ...fieldsToTable(
    defaultContextFields.rows as SpaceProperty[],
    defaultContextTable.rows as SpaceTableSchema[]
  ),
};

export const defaultTagTables = {
  m_schema: defaultContextTable,
  m_fields: defaultTagFields,
  ...fieldsToTable(
    defaultTagFields.rows as SpaceProperty[],
    defaultContextTable.rows as SpaceTableSchema[]
  ),
};
