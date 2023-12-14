import { dateAfter, dateBefore, empty, FilterFunctionType, greaterThan, isSameDayAsToday, lessThan, listIncludes, stringCompare, stringEqual } from "../filter";


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
    fn: (v, f) => stringEqual(v, f),
    valueType: "text",
  },
  isNot: {
    type: ["text", "file", "link", "context", "fileprop"],
    fn: (v, f) => !stringEqual(v, f),
    valueType: "text",
  },
  equal: {
    type: ["number"],
    fn: (v, f) => stringEqual(v, f),
    valueType: "number",
  },
  isGreatThan: {
    type: ["number"],
    fn: (v, f) => greaterThan(v, f),
    valueType: "number",
  },
  isLessThan: {
    type: ["number"],
    fn: (v, f) => lessThan(v, f),
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
    fn: (v, f) =>  dateBefore(v, f),
    valueType: "date",
  },
  dateAfter: {
    type: ["date", 'fileprop'],
    fn: (v, f) =>  dateAfter(v, f),
    valueType: "date",
  },
  isSameDateAsToday: {
    type: ["date"],
    fn: (v, f) => isSameDayAsToday(v, f),
    valueType: "none",
  },
  isAnyInList: {
    type: ["option", "context", "option-multi", "context-multi", 'tags-multi', 'tags'],
    fn: (v, f) => listIncludes(v, f),
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
