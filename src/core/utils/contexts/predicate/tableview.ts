import { FilterFn, SortingFn } from "@tanstack/react-table";
import { SpaceTableColumn } from "shared/types/mdb";
import { Predicate } from "shared/types/predicate";
import { filterFnTypes } from "./filterFns/filterFnTypes";
import { SortFunction, sortFnTypes } from "./sort";

export const tableViewFilterFn = (
    filterFn: (cellValue: any, filterValue: any) => boolean
  ): FilterFn<any> => {
    return (row, columnId, filterValue, addmeta) => {
      return filterFn(row.getValue(columnId), filterValue);
    };
  };
  
  export const filterFnForCol = (
    predicate: Predicate,
    col: SpaceTableColumn
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

  export const tableViewSortFn = (sortFn: SortFunction, col?: SpaceTableColumn): SortingFn<any> => {
    return (row, row2, columnId) => {
      return sortFn(row.getValue(columnId), row2.getValue(columnId), col);
    };
  };
  
  export const sortFnForCol = (
    predicate: Predicate,
    col: SpaceTableColumn
  ): SortingFn<any> => {
    const { sort } = predicate;
    const sortField = sort.find((f) => f.field == col.name + col.table);
    if (!sortField || !sortField.fn) {
      return null;
    }
    const sortType = sortFnTypes[sortField.fn];
    if (sortType) {
      return tableViewSortFn(sortType.fn, col);
    }
    return null;
  };
  