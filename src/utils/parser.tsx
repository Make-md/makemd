import { Space } from "schemas/spaces";
import { ContextDef } from "types/context";
import { DBRow } from "types/mdb";
import { SpaceDef } from "types/space";
import { safelyParseJSON } from "./json";
import { filePathToString, indexOfCharElseEOS } from "./strings";
import { MULTI_STRING_DELIMITER } from "./serializer";

//named parsers for converting strings to values

export const parseSortStrat = (str: string): [string, boolean] => {
  const [a, b] = str.split("_");
  return [a, b == "asc"];
};

export const parseMultiString = (str: string): string[] =>
  str?.match(new RegExp(`(\\.|[^${MULTI_STRING_DELIMITER}])+`, 'g')) ?? [];

export const parseLinkString = (string: string) => {
  if (!string) return "";
  const match = /\[\[(.*?)\]\]/g.exec(string);
  const stringValue =
    match?.length > 1
      ? match[1].substring(0, indexOfCharElseEOS("|", match[1]))
      : string;
  if (stringValue) return stringValue;
  return string;
};

export const parseLinkDisplayString = (string: string) => {
  return filePathToString(parseLinkString(string));
};

export const parseContextDefString = (str: string): ContextDef[] => {
  if (!str || str.length == 0) return [];
  if (str.charAt(0) == "#") {
    return str.split("&").map((f) => ({
      type: "tag",
      value: f,
    }));
  }
  return safelyParseJSON(str) ?? [];
};

export const parseSpace = (spaceRow: DBRow): Space => {
  return {
    ...spaceRow,
    def: parseSpaceDefString(spaceRow.def),
  } as Space;
};

export const parseSpaceDefString = (str: string): SpaceDef => {
  if (!str || str.length == 0)
    return { type: "focus", folder: "", filters: [] };
  if (str.charAt(0) != "{") {
    return {
      folder: str,
      type: "focus",
      filters: [
        {
          type: "any",
          trueFalse: true,
          filters: [
            {
              type: "filemeta",
              fType: "string",
              field: "folder",
              fn: "equals",
              value: str,
            },
          ],
        },
      ],
    };
  }
  return safelyParseJSON(str) ?? [];
};
