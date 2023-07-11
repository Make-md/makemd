
import i18n from "i18n";
import { DBRow, MDBColumn } from "types/mdb";
import { Sort } from "types/predicate";
import { parseMultiString } from "utils/parser";



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

const stringSort: SortFunction = (
  value: string,
  filterValue: string
): SortResultType => simpleSort(value, filterValue);
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
    type: ["text", "file", "link", "context", 'fileprop'],
    fn: stringSort,
    label: i18n.sortTypes.alphaAsc,
    desc: false,
  },
  reverseAlphabetical: {
    type: ["text", "file", "link", "context", 'fileprop'],
    fn: (v, f) => (stringSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.alphaDesc,
    desc: true,
  },
  earliest: {
    type: ["date", 'fileprop'],
    fn: stringSort,
    label: i18n.sortTypes.earliest,
    desc: false,
  },
  latest: {
    type: ["date", 'fileprop'],
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
    type: ["number", 'fileprop'],
    fn: numSort,
    label: "1 → 9",
    desc: false,
  },
  reverseNumber: {
    type: ["number", 'fileprop'],
    fn: (v, f) => (numSort(v, f) * -1) as SortResultType,
    label: "9 → 1",
    desc: true,
  },
  count: {
    type: ["option-multi", "context-multi", "link-multi"],
    fn: countSort,
    label: i18n.sortTypes.itemsDesc,
    desc: true,
  },
  reverseCount: {
    type: ["option-multi", "context-multi", "link-multi"],
    fn: (v, f) => (countSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.itemsAsc,
    desc: false,
  },
};

export const sortReturnForCol = (
  col: MDBColumn,
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

