import { format } from "date-fns";
import { parseMultiString } from "utils/parsers";
import { uniq } from "./array";


export const detectPropertyType = (value: any, key: string): string => {

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
  }
  return "text";
};export const defaultValueForType = (type: string) => {
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
};
export const parseMDBValue = (type: string, value: string): any => {
  if (type == "number") {
    return parseFloat(value);
  } else if (type == "boolean") {
    return value == "true";
  } else if (type.includes("multi")) {
    return parseMultiString(value).map((f) => parseMDBValue(type.replace("-multi", ""), f)
    );
  } else if (type.includes("link") || type.includes("context")) {
    return `[[${value}]]`;
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

