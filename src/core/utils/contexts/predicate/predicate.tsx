import { SpaceTableSchema } from "shared/types/mdb";
import { Filter, Predicate, Sort } from "shared/types/predicate";
import { defaultPredicate } from "../../../../shared/schemas/predicate";
import { FilterFunctionType } from "./filter";
import { filterFnTypes } from "./filterFns/filterFnTypes";
import { SortFunctionType, sortFnTypes } from "./sort";

export const defaultPredicateFnForType = (
  type: string,
  types: FilterFunctionType | SortFunctionType
) => {
  const fnType = Object.keys(types).find((f) =>
    types[f].type.find((g) => g == type)
  );
  return fnType;
};

export const allPredicateFns = (
  types: FilterFunctionType | SortFunctionType
) => {
  return Object.keys(types);
};

export const predicateFnsForType = (
  type: string,
  types: FilterFunctionType | SortFunctionType
) => {
  const fnTypes = Object.keys(types).filter((f) =>
    types[f].type.find((g) => g == type)
  );
  return fnTypes;
};

export const cleanPredicateType = (
  type: Sort[] | Filter[],
  definedTypes: FilterFunctionType | SortFunctionType
) => {
  return type.filter((f) => Object.keys(definedTypes).find((g) => g == f.fn));
};

export const validatePredicate = (
  prevPredicate: Predicate,
  defaultPredicate: Predicate
): Predicate => {
  if (!prevPredicate) {
    return defaultPredicate;
  }
  return {
    ...defaultPredicate,
    view: prevPredicate.view,
    listItem: prevPredicate.listItem,
    listGroup: prevPredicate.listGroup,
    listView: prevPredicate.listView,
    listViewProps: prevPredicate.listViewProps,
    listItemProps: prevPredicate.listItemProps,
    listGroupProps: prevPredicate.listGroupProps,
    filters: Array.isArray(prevPredicate.filters)
      ? (cleanPredicateType(prevPredicate.filters, filterFnTypes) as Filter[])
      : [],
    sort: Array.isArray(prevPredicate.sort)
      ? cleanPredicateType(prevPredicate.sort, sortFnTypes)
      : [],
    groupBy: Array.isArray(prevPredicate.groupBy) ? prevPredicate.groupBy : [],
    colsOrder: Array.isArray(prevPredicate.colsOrder)
      ? prevPredicate.colsOrder
      : [],
    colsHidden: Array.isArray(prevPredicate.colsHidden)
      ? prevPredicate.colsHidden
      : [],
    colsSize: prevPredicate.colsSize ?? {},
    colsCalc: prevPredicate.colsCalc ?? {},
    limit: typeof prevPredicate.limit === 'number' && prevPredicate.limit >= 0 ? prevPredicate.limit : 0,
  };
};

export const defaultPredicateForSchema = (schema: SpaceTableSchema) => {
  return schema?.primary == "true"
    ? defaultPredicate
    : {
        ...defaultPredicate,
        view: "table",
        limit: 0,
      };
};
