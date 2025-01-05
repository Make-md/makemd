
import i18n from "shared/i18n";
import { DBRow, SpaceTableColumn } from "shared/types/mdb";
import { Sort } from "shared/types/predicate";
import { parseMultiString } from "utils/parsers";



export type SortFunctionType = Record<
  string,
  { type: string[]; label: string; fn: SortFunction; desc: boolean }
>;
export type SortFunction = (v: any, f: any) => SortResultType;

type SortResultType = -1 | 0 | 1;

const simpleSort = (a: any, b: any) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const stringSort = (value: string, filterValue: string): SortResultType =>
  value.localeCompare(filterValue, undefined, { numeric: true,  sensitivity: "base" }) as SortResultType;

const linkSort: SortFunction = (
  value: string,
  filterValue: string
): SortResultType => {
  const a = value.split("/").pop();
  const b = filterValue.split("/").pop();
  return stringSort(a, b);
}

const numSort: SortFunction = (
  value: string,
  filterValue: string
): SortResultType => simpleSort(parseFloat(value), parseFloat(filterValue));
const boolSort: SortFunction = (
  value: string,
  filterValue: string
): SortResultType =>
  simpleSort(value == "true" ? 1 : 0, filterValue == "true" ? 1 : 0);
const countSort: SortFunction = (
  value: string,
  filterValue: string
): SortResultType =>
  simpleSort(parseMultiString(value).length, parseMultiString(filterValue).length);

export const normalizedSortForType = (type: string, desc: boolean) => {
  return Object.keys(sortFnTypes).find(
    (f) =>
      sortFnTypes[f].type.some((g) => g == type) && sortFnTypes[f].desc == desc
  );
};

export const sortFnTypes: SortFunctionType = {
  alphabetical: {
    type: ["text", "option"],
    fn: stringSort,
    label: i18n.sortTypes.alphaAsc,
    desc: false,
  },
  reverseAlphabetical: {
    type: ["text", "option"],
    fn: (v, f) => (stringSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.alphaDesc,
    desc: true,
  },
  linkAlphabetical: {
    type: ["link", "context", "file", "image"],
    fn: linkSort,
    label: i18n.sortTypes.alphaAsc,
    desc: false,
  },
  linkReverseAlphabetical: {
    type: ["link", "context", "file", "image"],
    fn: (v, f) => (linkSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.alphaDesc,
    desc: true,
  },
  earliest: {
    type: ["date"],
    fn: stringSort,
    label: i18n.sortTypes.earliest,
    desc: false,
  },
  latest: {
    type: ["date"],
    fn: (v, f) => (stringSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.latest,
    desc: true,
  },
  boolean: {
    type: ["boolean"],
    fn: boolSort,
    label: i18n.sortTypes.checkAsc,
    desc: false,
  },
  booleanReverse: {
    type: ["boolean"],
    fn: (v, f) => (boolSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.checkDesc,
    desc: true,
  },
  number: {
    type: ["number"],
    fn: numSort,
    label: "1 → 9",
    desc: false,
  },
  reverseNumber: {
    type: ["number"],
    fn: (v, f) => (numSort(v, f) * -1) as SortResultType,
    label: "9 → 1",
    desc: true,
  },
  count: {
    type: ["option-multi", "context-multi", "link-multi", "tags-multi"],
    fn: countSort,
    label: i18n.sortTypes.itemsDesc,
    desc: true,
  },
  reverseCount: {
    type: ["option-multi", "context-multi", "link-multi", "tags-multi"],
    fn: (v, f) => (countSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.itemsAsc,
    desc: false,
  },
};

export const sortReturnForCol = (
  col: SpaceTableColumn,
  sort: Sort,
  row: DBRow,
  row2: DBRow
) => {
  if (!col) return 0;
  const sortType = sortFnTypes[sort.fn];
  if (sortType) {
    return sortType.fn(row[sort.field], row2[sort.field]);
  }
  return 0;
};

