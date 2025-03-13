import { parseFieldValue } from "core/schemas/parseFieldValue";
import i18n from "shared/i18n";
import { PathPropertyName } from "shared/types/context";
import { DBTable, DBTables, SpaceProperty, SpaceTable, SpaceTableSchema } from "shared/types/mdb";
import { FrameSchema } from "shared/types/mframe";
import { SpaceInfo } from "shared/types/spaceInfo";
import { safelyParseJSON } from "shared/utils/json";
import { parsePropString } from "utils/parsers";
import { defaultContextDBSchema, defaultContextSchemaID } from "../shared/schemas/context";
import { defaultContextFields, defaultTagFields } from "../shared/schemas/fields";

export type FieldType = {
  type: string;
  label: string;
  restricted?: boolean;
  icon?: string;
  multi?: boolean;
  primative?: boolean;
  metadata?: boolean;
  multiType?: string;
  configKeys?: string[];
  description?: string;
};

export const fieldTypeForField = (f: SpaceProperty) => {
  if (!f) return null;
  return f.type == 'fileprop' ? parseFieldValue(f.value, 'fileprop')?.type ?? 'text' : f.type
};

export const stickerForField = (f: SpaceProperty) => f.attrs?.length > 0
? safelyParseJSON(f.attrs)?.icon ?? fieldTypeForType(f.type, f.name)?.icon
: fieldTypeForType(f.type, f.name)?.icon


export const stickerForSchema = (f: FrameSchema) => f.def?.icon?.length > 0 ? (f.def)?.icon : "ui//layout-list";
export const stickerForDBSchema = (f: SpaceTableSchema) => safelyParseJSON(f?.def)?.icon ?? "ui//layout-list"

export const fieldTypeForType = (type: string, name?: string) =>
    name == PathPropertyName ? 
    fieldTypes.find((t) => t.type == 'file') : name == 'tags' ? 
    fieldTypes.find((t) => t.type == 'tags-multi') : name == 'aliases' ? 
    fieldTypes.find((t) => t.type == 'option-multi') : name == 'sticker' ? 
    fieldTypes.find((t) => type == 'icon') : fieldTypes.find((t) => type == t.type) ||
    fieldTypes.find((t) => type == t.multiType);

export const fieldTypes: FieldType[] = [
  {
    type: "unknown",
    label: "",
    restricted: true,
    icon: 'ui//file-question',
  },
  {
    type: 'any',
    label: '',
    restricted: true,
    icon: 'ui//wildcard',
    multi: true,
    multiType: 'any-multi',
  },
  {
    type: "text",
    label: i18n.properties.text.label,
    metadata: true,
    icon: 'ui//text',
    primative: true,
    description: i18n.properties.text.description
  },
  {
    type: "number",
    label: i18n.properties.number.label,
    metadata: true,
    icon: 'ui//binary',
    configKeys: ['unit'],
    primative: true,
    description: i18n.properties.number.description
  },
  {
    type: "boolean",
    label: i18n.properties.boolean.label,
    metadata: true,
    icon: 'ui//check-square',
    primative: true,
    description: i18n.properties.boolean.description
  },
  {
    type: "date",
    label: i18n.properties.date.label,
    metadata: true,
    icon: 'ui//calendar',
    configKeys: ['format'],
    primative: true,
    description: i18n.properties.date.description
  },
  {
    type: "option",
    label: i18n.properties.option.label,
    multi: true,
    multiType: "option-multi",
    icon: 'ui//list',
    configKeys: ['options', 'source', 'sourceProps'],
    description: i18n.properties.option.description
  },
  {
    type: "tags-multi",
    label: i18n.properties.tags.label,
    icon: 'ui//tags',
    description: i18n.properties.tags.description
  },
  {
    type: "file",
    label: i18n.properties.file.label,
    restricted: true,
    icon: 'ui//mk-make-h3',
  },
  {
    type: "fileprop",
    label: i18n.properties.fileProperty.label,
    icon: 'ui//formula',
    configKeys:['field', 'value', 'type'],
    description: i18n.properties.fileProperty.description
  },
  {
    type: "link",
    label: i18n.properties.link.label,
    multi: true,
    multiType: "link-multi",
    metadata: true,
    icon: 'ui//file-text',
    primative: true,
    description: i18n.properties.link.description
  },
  {
    type: "context",
    label: i18n.properties.context.label,
    icon: 'ui//mk-make-note',
    multi: true,
    multiType: "context-multi",
    configKeys: ['space', 'field'],
    description: i18n.properties.context.description
  },
  {
    type: "aggregate",
    label: i18n.properties.aggregate.label,
    icon: 'ui//mk-make-note',
    multi: false,
    configKeys: ['ref', 'field', 'fn'],
    description: i18n.properties.aggregate.description
  },
  {
    type: "object",
    label: i18n.properties.object.label,
    multi: true,
    multiType: 'object-multi',
    metadata: true,
    icon: 'ui//list-tree',
    configKeys: ['type', 'typeName'],
    description: i18n.properties.object.description
  },
  {
    type: "icon",
    label: i18n.properties.icon.label,
    multi: true,
    multiType: "icon-multi",
    icon: 'ui//gem',
    restricted: true,
    primative: true,
    description: i18n.properties.icon.description
  },
  {
    type: "image",
    label: i18n.properties.image.label,
    multi: true,
    multiType: "image-multi",
    metadata: true,
    icon: 'ui//mk-make-image',
    primative: true,
    description: i18n.properties.image.description
  },
  {
    type: "color",
    label: i18n.properties.color.label,
    icon: 'ui//mk-make-image',
    restricted: true,
    description: i18n.properties.color.description
  },
  {
    type: "space",
    label: i18n.properties.space.label,
    icon: 'ui//layout-grid',
    restricted: true,
    description: i18n.properties.space.description
  },
  {
    type: "table",
    label: i18n.properties.space.label,
    icon: 'ui//layout-grid',
    restricted: true,
    description: i18n.properties.space.description
  },
  {
    type: 'super',
    label: i18n.properties.super.label,
    icon: 'ui//zap',
    restricted: true,
    configKeys: ['dynamic', 'field'],
  },
  {
    type: 'input',
    label: i18n.properties.super.label,
    icon: 'ui//input',
    restricted: true,
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
export const defaultFrameListViewID = "filesView";
export const defaultFrameListViewSchema: SpaceTableSchema = {
  id: defaultFrameListViewID,
  name: "All",
  type: "view",
  def: JSON.stringify({db: defaultContextSchemaID, icon: 'ui//file-stack'}),
};


export const mainFrameID = 'main'

export const defaultMainFrameSchema = (id: string) => ({id, name: id, type: 'frame', def: '', predicate: '', primary: "true"})

export const defaultFramesTable: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultMainFrameSchema(mainFrameID), defaultFrameListViewSchema] as SpaceTableSchema[],
};


export const defaultContextTable: DBTable = {
  uniques: [],
  cols: ["id", "name", "type", "def", "predicate", "primary"],
  rows: [defaultContextDBSchema] as SpaceTableSchema[],
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
