import { parseFlexValue } from "core/schemas/parseFieldValue";
import { DBRow, SpaceTableColumn } from "shared/types/mdb";
import { Filter } from "shared/types/predicate";
import { parseMultiString } from "utils/parsers";
import { filterFnTypes } from "./filterFns/filterFnTypes";


export type FilterFunctionType = Record<
  string,
  { type: string[]; fn: FilterFunction; valueType: string }
>;
type FilterFunction = (v: any, f: any) => boolean;

export const startsWith: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return (value ?? "").startsWith(filterValue);
}

export const endsWith: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return (value ?? "").endsWith(filterValue);
}

export const lengthEquals: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  return value.length == parseInt(filterValue);
}

export const listEquals: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const valueList = value ? parseMultiString(value) : [];
  const strings = filterValue ? parseMultiString(filterValue) : [];
  return strings.every((f) => valueList.some((g) => g == f)) && valueList.every((f) => strings.some((g) => g == f));
}

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
  return parseInt(value) < parseInt(filterValue);
};
export const dateAfter: FilterFunction = (
  value: string,
  filterValue: string
): boolean => {
  const dateValue = isNaN(Date.parse(value)) ? new Date(parseInt(value)) : new Date(value);
  const dateFilterValue = isNaN(Date.parse(filterValue)) ? new Date(parseInt(filterValue)) : new Date(filterValue);
  return dateValue.valueOf() >= dateFilterValue.valueOf();
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
  if (valueList.length == 0) return false;
  
  return strings.some((f) => valueList.some((g) => g == f));
};

export const isSameDay: FilterFunction = (value: string, filterValue: string) : boolean => {
  if (!value) return false;
  const inputDate = new Date(`${value.toString().replace(".", ':')}`);

  // Get the current date
  const currentDate = new Date(`${filterValue}`);
  // Compare the month and date
  return inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() === currentDate.getDate();
}

export const isSameDayAsToday: FilterFunction = (value: string) : boolean => {
  if (!value) return false;
  const inputDate = new Date(`${value.toString()}T00:00`);

  // Get the current date
  const currentDate = new Date();
  // Compare the month and date
  return inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() === currentDate.getDate();
}

export const filterReturnForCol = (
  col: SpaceTableColumn,
  filter: Filter,
  row: DBRow,
  properties: Record<string, any>
) => {
  if (!col) return true;

  const filterType = filterFnTypes[filter?.fn];
  let result = true;
  if (filterType && filterType.fn) {
    const value = (filter.fType == 'property') ? properties[filter.value] : filter.value;
    const rowValue = col.type == 'flex' ? parseFlexValue(row[filter.field])?.value : row[filter.field];
    result = filterType.fn(rowValue, value);
  }

  return result;
};


