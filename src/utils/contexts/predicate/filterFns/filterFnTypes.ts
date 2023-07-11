import { empty, FilterFunctionType, greaterThan, lessThan, listIncludes, stringCompare, stringEqual } from "../filter";


export const filterFnTypes: FilterFunctionType = {
  isNotEmpty: {
    type: ["text", "file", "link", "link-multi", "fileprop", 'image'],
    fn: (v, f) => !empty(v, ''),
    valueType: "none",
  },
  isEmpty: {
    type: ["text", "file", "link", "link-multi", "fileprop", 'image'],
    fn: (v, f) => empty(v, ''),
    valueType: "none",
  },
  include: {
    fn: (v, f) => stringCompare(v, f),
    type: ["text", "file", "link", "link-multi", "fileprop", 'image'],
    valueType: "text",
  },
  notInclude: {
    type: ["text", "file", "link", "link-multi", "fileprop", 'image'],
    fn: (v, f) => !stringCompare(v, f),
    valueType: "text",
  },
  is: {
    type: ["text", "file", "link", "context", "fileprop"],
    fn: stringEqual,
    valueType: "text",
  },
  isNot: {
    type: ["text", "file", "link", "context", "fileprop"],
    fn: (v, f) => !stringEqual(v, f),
    valueType: "text",
  },
  equal: {
    type: ["number"],
    fn: stringEqual,
    valueType: "number",
  },
  isGreatThan: {
    type: ["number"],
    fn: greaterThan,
    valueType: "number",
  },
  isLessThan: {
    type: ["number"],
    fn: lessThan,
    valueType: "number",
  },
  isLessThanOrEqual: {
    type: ["number"],
    fn: (v, f) => !greaterThan(v, f),
    valueType: "number",
  },
  isGreatThanOrEqual: {
    type: ["number"],
    fn: (v, f) => !lessThan(v, f),
    valueType: "number",
  },
  dateBefore: {
    type: ["date", 'fileprop'],
    fn: lessThan,
    valueType: "date",
  },
  dateAfter: {
    type: ["date", 'fileprop'],
    fn: greaterThan,
    valueType: "date",
  },
  isAnyInList: {
    type: ["option", "context", "option-multi", "context-multi", 'tags-multi', 'tags'],
    fn: listIncludes,
    valueType: "list",
  },
  isNoneInList: {
    type: ["option", "context", "option-multi", "context-multi", 'tags-multi', 'tags'],
    fn: (v, f) => !listIncludes(v, f),
    valueType: "list",
  },
  isTrue: {
    type: ["boolean"],
    fn: (v, f) => v == "true",
    valueType: "none",
  },
  isFalse: {
    type: ["boolean"],
    fn: (v, f) => v != "true",
    valueType: "none",
  },
};
