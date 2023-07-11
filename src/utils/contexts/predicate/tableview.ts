import { FilterFn, SortingFn } from "@tanstack/react-table";
import { MDBColumn } from "types/mdb";
import { Predicate } from "types/predicate";
import { filterFnTypes } from "./filterFns/filterFnTypes";
import { sortFnTypes, SortFunction } from "./sort";

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
    const filterType = filterFnTypes[filterField.fn];
    if (filterType) {
      return tableViewFilterFn(filterType.fn);
    }
    return () => true;
  };

  export const tableViewSortFn = (sortFn: SortFunction): SortingFn<any> => {
    return (row, row2, columnId) => {
      return sortFn(row.getValue(columnId), row2.getValue(columnId));
    };
  };
  
  export const sortFnForCol = (
    predicate: Predicate,
    col: MDBColumn
  ): SortingFn<any> => {
    const { sort } = predicate;
    const sortField = sort.find((f) => f.field == col.name + col.table);
    if (!sortField || !sortField.fn) {
      return null;
    }
    const sortType = sortFnTypes[sortField.fn];
    if (sortType) {
      return tableViewSortFn(sortType.fn);
    }
    return null;
  };
  