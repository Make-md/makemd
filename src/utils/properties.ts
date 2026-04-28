import { parseFlexValue } from "core/schemas/parseFieldValue";
import { format } from "date-fns";
import { fieldTypeForField } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { parseMultiString } from "utils/parsers";
import { uniq } from "../shared/utils/array";


export const detectPropertyType = (value: any, key: string): string => {
  if (value instanceof Date) {
      return "date"
  }
  if (typeof value === "string") {
    if (/\/\/(\S+?(?:jpe?g|png|gif|svg))/gi.test(value) ||
      value.includes("unsplash")) {
      return "image";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "date";
    }
    
    if (key == "tag" || key == "tags") {
      return "tags-multi";
    }
    if (/\[\[.*?\]\]/.test(value)) {
      return "link";
    }
  } else if (typeof value === "number") {
    return "number";
  } else if (typeof value === "boolean") {
    return "boolean";
  } else if (!value) {
    return "unknown";
  } else if (Array.isArray(value) ||
    (typeof value === "string" && value.indexOf(",") > -1)) {
    let arrayValue: string[] = Array.isArray(value) ? value : [];
    if (typeof value === "string" && value.indexOf(",") > -1) {
      arrayValue = parseMultiString(value);
    }
    if (key == "tag" || key == "tags") {
      return "tags-multi";
    }
    //yaml lol
    if (arrayValue.length == 1 &&
      Array.isArray(arrayValue[0]) &&
      arrayValue[0].length == 1 &&
      typeof arrayValue[0][0] === "string") {
      return "link";
    }
    const types = uniq(arrayValue.map((f) => detectPropertyType(f, key)));
    if (types.length == 1 && types[0] == "link") {
      return "link-multi";
    }
    if (types.some(f => f == 'object')) {
      
      return "object-multi";
    }
    return "option-multi";
  } else if (value.isLuxonDateTime) {
    return "date";
  } else if (value.isLuxonDuration) {
    return "duration";
  } else if (value.type == "file") {
    return "link";
  } else if (typeof value === "object" &&
    !Array.isArray(value) &&
    value !== null) {
    return "object";
  } else {
    return 'unknown'
  }
  return "text";
};

export const defaultValueForType = (type: string) => {
  if (type == "date") {
    return format(Date.now(), "yyyy-MM-dd");
  }
  if (type == "number") {
    return 0;
  }
  if (type == "boolean") {
    return true;
  }
  if (type == "link") {
    return "[[Select Note]]";
  }
  if (type == "option") {
    return "one, two";
  }
  if (type == "text") {
    return " ";
  }
  if (type == "image") {
    return "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
  }
  if (type == "object") {
    return {};
  }
  if (type == "object-multi") {
    return [];
  }
};

export const parseParameters = (fieldValues: Record<string, string>, fields: SpaceProperty[]): Record<string, any> => {
  return Object.keys(fieldValues)
      .filter((f) => f != "$api")
      .reduce((f, g) => {
        const col = fields.find((c) => c.name == g);
        return { ...f, [g]: parseMDBStringValue(fieldTypeForField(col), fieldValues[g], false) };
      }, {});
};

export const parsePropertyValue = (value: any, type: string): any => {
  if (!type) return value;
  if (type == "number") {
    return parseFloat(value);
  } else if (type == "boolean") {
    return value == "true";
  } else if (type.includes("-multi")) {
    return parseMultiString(value).map((f) => parseMDBStringValue(type.replace("-multi", ""), f, false)
    );
  }
  return value;
}

export const parseMDBStringValue = (type: string, value: string, frontmatter?: boolean): any => {
  if (!type) {
    return value;
  }
  if (type == 'flex') {
    const flexObject = parseFlexValue(value)
    return parseMDBStringValue(flexObject.type, flexObject.value, frontmatter)
  }
  if (type == "object") {
    return JSON.parse(value);
  } else if (type == 'object-multi') {
    return JSON.parse(value);
  }
  if (type == "number") {
    return parseFloat(value);
  } else if (type == "boolean") {
    return value == "true";
  } else if (type == "date" || type == "datetime" || type == "date-end") {
    // Parse date strings to Date objects for proper temporal scaling
    if (!value || value === '') return null;
    const date = new Date(value);
    // Return the date object if valid, otherwise return the original string
    return !isNaN(date.getTime()) ? date : value;
  } else if (type.includes("-multi")) {
    return parseMultiString(value).map((f) => parseMDBStringValue(type.replace("-multi", ""), f, frontmatter)
    );
  } else if (type.includes("link") || type.includes("context")) {
    return frontmatter ? `[[${value}]]` : value;
  }
  return value;
};
export const yamlTypeToMDBType = (YAMLtype: string) => {
  switch (YAMLtype) {
    case "duration":
      return "text";
      break;
    case "unknown":
      return "text";
      break;
  }
  return YAMLtype;
};
export const propertyIsObjectType = (property: SpaceProperty) => {
  if (property.type == "object" || property.type == "object-multi" || property.type == "super") return true;
  return false

};

// Like detectPropertyType but tailored for cell rendering: maps the
// "unknown" return (null/empty values) to "text" so the cell still has a
// renderer. Use this when picking a fallback type for an undeclared value.
export const inferCellTypeForValue = (value: any, key = ""): string => {
  const t = detectPropertyType(value, key);
  return t === "unknown" ? "text" : t;
};

// Cell renderers serialize values as strings on save. Coerce them back to
// the native primitive shape implied by the column type so YAML stays clean
// (unquoted booleans/numbers) and downstream inference doesn't misread the
// stringified form as text. Returns the value unchanged when no coercion
// applies.
export const coerceStringToType = (value: any, type: string): any => {
  if (typeof value !== "string") return value;
  if (type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }
  if (type === "number") {
    if (value.trim() === "") return value;
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  return value;
};

// Try to JSON-parse a string; return undefined on failure. Convenience
// wrapper around the try/catch boilerplate.
export const tryParseJSON = <T = any>(s: string): T | undefined => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
};

// Build an ObjectType-shape schema from an example object, recursing into
// nested objects/arrays-of-objects so deeply-nested keys also get a typed
// schema entry. Mirrors the structure expected by ObjectCell/ObjectEditor.
export const deriveSchemaFromValue = (obj: Record<string, any>): any =>
  Object.keys(obj).reduce<any>((acc, k) => {
    const v = obj[k];
    const t = inferCellTypeForValue(v, k);
    const entry: any = { type: t, label: k };
    if (t === "object" && v && typeof v === "object" && !Array.isArray(v)) {
      entry.value = { type: deriveSchemaFromValue(v), typeName: k };
    } else if (
      t === "object-multi" &&
      Array.isArray(v) &&
      v.length > 0 &&
      v[0] &&
      typeof v[0] === "object" &&
      !Array.isArray(v[0])
    ) {
      entry.value = { type: deriveSchemaFromValue(v[0]), typeName: k };
    }
    return { ...acc, [k]: entry };
  }, {});

