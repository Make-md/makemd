import { ensureArray, ensureString, indexOfCharElseEOS } from "core/utils/strings";
import { format } from "date-fns";
import { ContextLookup, PathPropertyName } from "shared/types/context";
import { safelyParseJSON } from "../shared/utils/json";
import { detectPropertyType } from "./properties";
import { serializeMultiDisplayString, serializeMultiString } from "./serializers";

export const parseMultiString = (str: string): string[] => ensureString(str).startsWith("[") ? ensureArray(safelyParseJSON(str)).map(f => ensureString(f)) : parseMultiDisplayString(str)
  
  export const parseMultiDisplayString = (str: string):string[] => (ensureString(str).replace('\\,', ',')?.match(/(\\.|[^,])+/g) ?? []).map(f => f.trim());
  export const parseProperty = (field: string, value: any, type?: string) : string => {
  const YAMLtype = type ?? detectPropertyType(value, field);
  if (!value) return ""
  switch (YAMLtype) {
    case "tags-multi": {
      return value;
    }
    break;
    case "object":
      case "object-multi": 
      {
        if (Array.isArray(value)) {
          if (value[0].path) {
            return JSON.stringify(value.map((v: any) => v.path));
          }
        } else {
          if (value.path) {
            return value.path;
          }
        }
      return JSON.stringify(value);
      }
      break;
    case "number":
      return (value as number).toString();
      break;
    case "boolean":
      return value ? "true" : "false";
      break;
    case "date":
      {
      if (value instanceof Date) {
        const dateString = format(value, "yyyy-MM-dd")
        
        if (typeof dateString === 'string') return dateString;
        return ''
      }
      if (!(typeof value === 'string')) return '';

      return value;
    }
      break;
    case "duration":
      return serializeMultiDisplayString(Object.keys(value.values)
        .reduce(
          (p, c) => [
            ...p,
            ...(value.values[c] > 0 ? [value.values[c] + " " + c] : []),
          ],
          []
        ));
      break;
    case "option-multi":
    case "link-multi":
      case "context-multi":
      if (typeof value === "string") {
        return parseLinkString(value);
      }
      return serializeMultiString(value
        .map((v: any) => {
          if (!v) {
            return '';
          }
          if (typeof v === "string") {
            return parseLinkString(v);
          }
          if (v.path) {
            return v.path;
          }
          if (Array.isArray(value) &&
            v.length == 1 &&
            Array.isArray(v[0]) &&
            v[0].length == 1 &&
            typeof v[0][0] === "string") {
            return v[0][0];
          }
          return JSON.stringify(v);
        })
      );
      break;
    case "link":
    case "context":
      {
        if (Array.isArray(value) &&
          value.length == 1 &&
          Array.isArray(value[0]) &&
          value[0].length == 1 &&
          typeof value[0][0] === "string") {
          return value[0][0];
        } else if (typeof value === "string") {
          return parseLinkString(value);
        }
        return value.path;
      }
      break;
    case "text":
    case "tag":
    case "option":
    case "image":
      return value;
      break;
  }
  return "";
};

export const parseObject = (value: string, multi: boolean) => {
  return multi
    ? ensureArray(safelyParseJSON(value))
    : safelyParseJSON(value) ?? {};
};

export const parsePropString = (str: string): ContextLookup => {
  const [p1, p2] = str?.match(/(\\.|[^.])+/g) ?? [];
  if (p2) return {
    field: p1, property: p2
  };
  return { field: PathPropertyName, property: p1 };

};
export const parseLinkString = (string: string) => {
  if (!string) return "";
  const match = /\[\[(.*?)\]\]/g.exec(string);
  const stringValue = match?.length > 1
    ? match[1].substring(0, indexOfCharElseEOS("|", match[1]))
    : string;
  if (stringValue) return stringValue;
  return string;
};

