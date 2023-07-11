import { DBRow, MDBColumn } from "types/mdb";
import { Filter } from "types/predicate";
import { parseMultiString } from "../../parser";
import { filterFnTypes } from "./filterFns/filterFnTypes";


export type FilterFunctionType = Record<
  string,
  { type: string[]; fn: FilterFunction; valueType: string }
>;
type FilterFunction = (v: any, f: any) => boolean;

export const stringEqual: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return value == filterValue;
};

export const empty: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return (value ?? "").length == 0;
};

export const stringCompare: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return (value ?? "")
    .toLowerCase()
    .includes((filterValue ?? "").toLowerCase());
};

export const greaterThan: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return parseFloat(value) > parseFloat(filterValue);
};

export const lessThan: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return parseInt(value) > parseInt(filterValue);
};

export const listIncludes: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const valueList = value ? parseMultiString(value) : [];
  const strings = filterValue ? parseMultiString(filterValue) : [];
  return strings.some((f) => valueList.some((g) => g == f));
};

export const filterReturnForCol = (
  col: MDBColumn,
  filter: Filter,
  row: DBRow
) => {
  if (!col) return true;

  const filterType = filterFnTypes[filter?.fn];
  let result = true;

  if (filterType && filterType.fn) {
    result = filterType.fn(row[filter.field], filter.value);
  }

  return result;
};


