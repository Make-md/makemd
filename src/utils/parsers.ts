import { ContextLookup, PathPropertyName } from "core/types/context";
import { indexOfCharElseEOS } from "core/utils/strings";
import { detectPropertyType } from "./properties";
import { serializeMultiDisplayString, serializeMultiString } from "./serializers";

export const parseMultiString = (str: string): string[] =>
  str?.match(/(\\.|[^,])+/g) ?? [];export const parseProperty = (field: string, value: any) => {
  const YAMLtype = detectPropertyType(value, field);
  switch (YAMLtype) {
    case "object":
      return JSON.stringify(value);
      break;
    case "number":
      return (value as number).toString();
      break;
    case "boolean":
      return value ? "true" : "false";
      break;
    case "date":
      return value;
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
    case "image":
      return value;
      break;
  }
  return "";
};
//https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map


export const safelyParseJSON = (json: string) => {
  // This function cannot be optimised, it's best to
  // keep it small!
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    //
    // Oh well, but whatever...
  }

  return parsed; // Could be undefined!
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

