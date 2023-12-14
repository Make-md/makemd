import { Filter } from "core/types/predicate";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { parseMultiString } from "utils/parsers";
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
export const dateAfter: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const dateValue = isNaN(Date.parse(value)) ? new Date(parseInt(value)) : new Date(value);
  const dateFilterValue = isNaN(Date.parse(filterValue)) ? new Date(parseInt(filterValue)) : new Date(filterValue);
  return dateValue.valueOf() > dateFilterValue.valueOf();
};

export const dateBefore: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const dateValue = isNaN(Date.parse(value)) ? new Date(parseInt(value)) : new Date(value);
  const dateFilterValue = isNaN(Date.parse(filterValue)) ? new Date(parseInt(filterValue)) : new Date(filterValue);
  return dateValue.valueOf() < dateFilterValue.valueOf();
};

export const listIncludes: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const valueList = value ? parseMultiString(value) : [];
  const strings = filterValue ? parseMultiString(filterValue) : [];
  return strings.some((f) => valueList.some((g) => g == f));
};

export const isSameDayAsToday: FilterFunction = (value: string) : boolean => {
  const inputDate = new Date(`${value}T00:00`);

  // Get the current date
  const currentDate = new Date();
  // Compare the month and date
  return inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() === currentDate.getDate();
}

export const filterReturnForCol = (
  col: SpaceTableColumn,
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


