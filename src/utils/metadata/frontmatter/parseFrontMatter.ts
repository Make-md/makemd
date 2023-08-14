import { MULTI_STRING_DELIMITER, serializeMultiDisplayString, serializeMultiString } from "utils/serializer";
import { detectYAMLType } from "./detectYAMLType";


export const parseFrontMatter = (field: string, value: any) => {
  // We need to always treat Aliases as an option-multi field, even if it's a string.
  const YAMLtype = field === 'aliases' ? 'option-multi' : detectYAMLType(value, field);
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
        return value.split(',').join(MULTI_STRING_DELIMITER);
      }
      return serializeMultiString(value
        .map((v: any) => {
          if (!v) {
            return '';
          }
          if (typeof v === "string") {
            return v;
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
          return value;
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
