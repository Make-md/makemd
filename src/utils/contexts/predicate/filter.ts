import { FilterFn } from "@tanstack/react-table";
import i18n from "i18n";
import { DBRow, MDBColumn } from "types/mdb";
import { Predicate } from "utils/contexts/predicate/predicate";
import { splitString } from "./predicate";
export type Filter = {
  field: string;
  type: string;
  value: string;
};

export type FilterFunctionType = Record<
  string,
  { type: string[]; label: string; fn: FilterFunction; valueType: string }
>;
type FilterFunction = (v: any, f: any) => boolean;

const stringEqual: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return value == filterValue;
};

const stringCompare: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return (value ?? "")
    .toLowerCase()
    .includes((filterValue ?? "").toLowerCase());
};

const greaterThan: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return parseFloat(value) > parseFloat(filterValue);
};

const lessThan: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return parseInt(value) > parseInt(filterValue);
};

const listIncludes: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const valueList = value ? splitString(value) : [];
  const strings = filterValue ? splitString(filterValue) : [];
  return strings.some((f) => valueList.some((g) => g == f));
};

export const filterFnTypes: FilterFunctionType = {
  include: {
    type: ["text", "file", "link", "link-multi"],
    fn: stringCompare,
    label: i18n.filterTypes.contains,
    valueType: "text",
  },
  notInclude: {
    type: ["text", "file", "link", "link-multi"],
    fn: (v, f) => !stringCompare(v, f),
    label: i18n.filterTypes.notContains,
    valueType: "text",
  },
  is: {
    type: ["text", "file", "link", "context"],
    fn: stringEqual,
    label: i18n.filterTypes.is,
    valueType: "text",
  },
  isNot: {
    type: ["text", "file", "link", "context"],
    fn: (v, f) => !stringEqual(v, f),
    label: i18n.filterTypes.isNot,
    valueType: "text",
  },
  equal: {
    type: ["number"],
    fn: stringEqual,
    label: "=",
    valueType: "number",
  },
  isGreatThan: {
    type: ["number"],
    fn: greaterThan,
    label: ">",
    valueType: "number",
  },
  isLessThan: {
    type: ["number"],
    fn: lessThan,
    label: "<",
    valueType: "number",
  },
  isLessThanOrEqual: {
    type: ["number"],
    fn: (v, f) => !greaterThan(v, f),
    label: "≤",
    valueType: "number",
  },
  isGreatThanOrEqual: {
    type: ["number"],
    fn: (v, f) => !lessThan(v, f),
    label: "≥",
    valueType: "number",
  },
  dateBefore: {
    type: ["date"],
    fn: lessThan,
    label: i18n.filterTypes.before,
    valueType: "date",
  },
  dateAfter: {
    type: ["date"],
    fn: greaterThan,
    label: i18n.filterTypes.after,
    valueType: "date",
  },
  isAnyInList: {
    type: ["option", "context", "option-multi", "context-multi"],
    fn: listIncludes,
    label: i18n.filterTypes.anyOf,
    valueType: "list",
  },
  isNoneInList: {
    type: ["option", "context", "option-multi", "context-multi"],
    fn: (v, f) => !listIncludes(v, f),
    label: i18n.filterTypes.noneOf,
    valueType: "list",
  },
  isTrue: {
    type: ["boolean"],
    fn: (v, f) => v == "true",
    label: i18n.filterTypes.checked,
    valueType: "boolean",
  },
  isFalse: {
    type: ["boolean"],
    fn: (v, f) => v != "true",
    label: i18n.filterTypes.unchecked,
    valueType: "boolean",
  },
};

export const filterReturnForCol = (
  col: MDBColumn,
  filter: Filter,
  row: DBRow
) => {
  if (!col) return true;

  const filterType = filterFnTypes[filter.type];
  let result = true;

  if (filterType) {
    result = filterType.fn(row[filter.field], filter.value);
  }

  return result;
};

export const tableViewFilterFn = (
  filterFn: (cellValue: any, filterValue: any) => boolean
): FilterFn<any> => {
  return (row, columnId, filterValue, addmeta) => {
    return filterFn(row.getValue(columnId), filterValue);
  };
};

export const filterFnForCol = (
  predicate: Predicate,
  col: MDBColumn
): FilterFn<any> => {
  const { filters } = predicate;
  const filterField = filters.find((f) => f.field == col.name + col.table);
  if (!filterField) {
    return () => true;
  }
  const filterType = filterFnTypes[filterField.type];
  if (filterType) {
    return tableViewFilterFn(filterType.fn);
  }
  return () => true;
};
