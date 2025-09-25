import { Predicate } from "shared/types/predicate";

export const defaultPredicate: Predicate = {
  view: "list",
  filters: [],
  listView: "",
  listItem: "",
  listGroup: "",
  listGroupProps: {},
  listViewProps: {},
  listItemProps: {},
  sort: [],
  groupBy: [],
  colsOrder: [],
  colsHidden: [],
  colsSize: {},
  colsCalc: {},
  limit: 0,
};

export const defaultTablePredicate: Predicate = {
  view: "table",
  filters: [],
  listView: "",
  listItem: "",
  listGroup: "",
  listGroupProps: {},
  listViewProps: {},
  listItemProps: {},
  sort: [],
  groupBy: [],
  colsOrder: [],
  colsHidden: [],
  colsSize: {},
  colsCalc: {},
  limit: 0,
};
