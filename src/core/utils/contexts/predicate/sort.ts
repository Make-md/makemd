import i18n from "shared/i18n";
import { DBRow, SpaceTableColumn, SpaceProperty } from "shared/types/mdb";
import { Sort } from "shared/types/predicate";
import { parseMultiString } from "utils/parsers";
import { safelyParseJSON } from "shared/utils/json";



export type SortFunctionType = Record<
  string,
  { type: string[]; label: string; fn: SortFunction; desc: boolean; fieldDef?: SpaceProperty }
>;
export type SortFunction = (v: any, f: any, fieldDef?: SpaceProperty) => SortResultType;

type SortResultType = -1 | 0 | 1;

/**
 * Extract options order from field definition
 */
const getOptionsOrder = (fieldDef?: SpaceProperty): string[] => {
  if (!fieldDef?.value) return [];
  
  const parsed = safelyParseJSON(fieldDef.value);
  if (!parsed?.options) return [];
  
  // Return the values in the order they appear in options array
  return parsed.options
    .filter((opt: any) => opt?.value)
    .map((opt: any) => String(opt.value));
};

const simpleSort = (a: any, b: any) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const stringSort = (value: string, filterValue: string): SortResultType =>
  value.localeCompare(filterValue, undefined, { numeric: true,  sensitivity: "base" }) as SortResultType;

/**
 * Sort option fields based on their defined order
 */
const optionSort: SortFunction = (
  value: string,
  filterValue: string,
  fieldDef?: SpaceProperty
): SortResultType => {
  // If we have a field definition with option ordering, use that
  if (fieldDef?.type === 'option' || fieldDef?.type === 'option-multi') {
    const optionsOrder = getOptionsOrder(fieldDef);
    if (optionsOrder.length > 0) {
      const aIndex = optionsOrder.indexOf(String(value));
      const bIndex = optionsOrder.indexOf(String(filterValue));
      
      // If both values are in the options order, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return simpleSort(aIndex, bIndex);
      }
      // If only one is in options, that one comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
  }
  
  // Fallback to string sort for values not in options or if no field def
  return stringSort(value, filterValue);
};

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

/**
 * Sort option-multi fields based on their defined order (for first value)
 */
const optionMultiSort: SortFunction = (
  value: string,
  filterValue: string,
  fieldDef?: SpaceProperty
): SortResultType => {
  // Parse multi-values
  const values = parseMultiString(value);
  const filterValues = parseMultiString(filterValue);
  
  // Get first values for comparison
  const firstValue = values[0] || '';
  const firstFilterValue = filterValues[0] || '';
  
  // Use option sort for the first values
  return optionSort(firstValue, firstFilterValue, fieldDef);
};

export const normalizedSortForType = (type: string, desc: boolean) => {
  return Object.keys(sortFnTypes).find(
    (f) =>
      sortFnTypes[f].type.some((g) => g == type) && sortFnTypes[f].desc == desc
  );
};

export const sortFnTypes: SortFunctionType = {
  alphabetical: {
    type: ["text"],
    fn: stringSort,
    label: i18n.sortTypes.alphaAsc,
    desc: false,
  },
  reverseAlphabetical: {
    type: ["text"],
    fn: (v, f) => (stringSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.alphaDesc,
    desc: true,
  },
  optionOrder: {
    type: ["option"],
    fn: optionSort,
    label: "First → Last",
    desc: false,
  },
  reverseOptionOrder: {
    type: ["option"],
    fn: (v, f, fieldDef) => (optionSort(v, f, fieldDef) * -1) as SortResultType,
    label: "Last → First",
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
    label: i18n.labels.nineToOne,
    desc: true,
  },
  optionMultiOrder: {
    type: ["option-multi"],
    fn: optionMultiSort,
    label: "First → Last",
    desc: false,
  },
  reverseOptionMultiOrder: {
    type: ["option-multi"],
    fn: (v, f, fieldDef) => (optionMultiSort(v, f, fieldDef) * -1) as SortResultType,
    label: "Last → First",
    desc: true,
  },
  count: {
    type: ["context-multi", "link-multi", "tags-multi"],
    fn: countSort,
    label: i18n.sortTypes.itemsDesc,
    desc: true,
  },
  reverseCount: {
    type: ["context-multi", "link-multi", "tags-multi"],
    fn: (v, f) => (countSort(v, f) * -1) as SortResultType,
    label: i18n.sortTypes.itemsAsc,
    desc: false,
  },
  optionMultiCount: {
    type: ["option-multi"],
    fn: countSort,
    label: i18n.sortTypes.itemsDesc,
    desc: true,
  },
  reverseOptionMultiCount: {
    type: ["option-multi"],
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
    const value = col.type == "flex" ? parseMultiString(row[sort.field]) : row[sort.field];
    const value2 = col.type == "flex" ? parseMultiString(row2[sort.field]) : row2[sort.field];
    // Pass the column as field definition for option sorting
    return sortType.fn(value, value2, col);
  }
  return 0;
};

