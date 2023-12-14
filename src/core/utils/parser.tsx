import { SpaceSort } from "core/types/space";
import { parseLinkString } from "utils/parsers";
import { pathToString } from "utils/path";

//named parsers for converting strings to values

export const parseSortStrat = (str: string): SpaceSort => {
  const [a, b] = str.split("_");
  return { field: a, asc: b == "asc", group: true };
};

export const parseLinkDisplayString = (string: string) => {
  return pathToString(parseLinkString(string));
};
