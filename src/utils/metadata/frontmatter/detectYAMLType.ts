import { uniq } from "../../array";
import { parseMultiString } from "../../parser";


export const detectYAMLType = (value: any, key: string): string => {
  if (typeof value === "string") {
    if (/\/\/(\S+?(?:jpe?g|png|gif|svg))/gi.test(value) ||
      value.includes("unsplash")) {
      return "image";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "date";
    }
    if (key == "tag" || key == "tags") {
      return "tag";
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
      return "tag-multi";
    }
    //yaml lol
    if (arrayValue.length == 1 &&
      Array.isArray(arrayValue[0]) &&
      arrayValue[0].length == 1 &&
      typeof arrayValue[0][0] === "string") {
      return "link";
    }
    const types = uniq(arrayValue.map((f) => detectYAMLType(f, key)));
    if (types.length == 1 && types[0] == "link") {
      return "link-multi";
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
  }
  return "text";
};
