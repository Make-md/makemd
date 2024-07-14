import { dateAfter, dateBefore, empty, FilterFunctionType, greaterThan, isSameDay, isSameDayAsToday, lessThan, listEquals, listIncludes, stringCompare, stringEqual } from "../filter";


export const filterFnTypes: FilterFunctionType = {
  isNotEmpty: {
    type: ["text", "file", "number", "option", "option-multi", "link", "link-multi", 'image'],
    fn: (v, f) => !empty(v, ''),
    valueType: "none",
  },
  isEmpty: {
    type: ["text", "file", "number", "option", "option-multi", "link", "link-multi", 'image'],
    fn: (v, f) => empty(v, ''),
    valueType: "none",
  },
  include: {
    fn: (v, f) => stringCompare(v, f),
    type: ["text", "file", "link", 'image'],
    valueType: "text",
  },
  notInclude: {
    type: ["text", "file", "link", 'image'],
    fn: (v, f) => !stringCompare(v, f),
    valueType: "text",
  },
  is: {
    type: ["text"],
    fn: (v, f) => stringEqual(v, f),
    valueType: "text",
  },
  isNot: {
    type: ["text"],
    fn: (v, f) => !stringEqual(v, f),
    valueType: "text",
  },
  equal: {
    type: ["number"],
    fn: (v, f) => stringEqual(v, f),
    valueType: "number",
  },
  isLink: {
    type: ["link", "context"],
    fn: (v, f) => stringEqual(v, f),
    valueType: "link",
  },
  isNotLink: {
    type: ["link", "context"],
    fn: (v, f) => !stringEqual(v, f),
    valueType: "link",
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
    type: ["date"],
    fn: (v, f) =>  dateBefore(v, f),
    valueType: "date",
  },
  dateAfter: {
    type: ["date"],
    fn: (v, f) =>  dateAfter(v, f),
    valueType: "date",
  },
  isSameDate: {
    type: ["date"],
    fn: (v, f) => isSameDay(v, f),
    valueType: "date",
  },
  isSameDateAsToday: {
    type: ["date"],
    fn: (v, f) => isSameDayAsToday(v, f),
    valueType: "none",
  },
  isExactList: {
    type: ["option", "option-multi","link-multi", "context-multi", 'tags-multi'],
    fn: (v, f) => listEquals(v, f),
    valueType: "list",
  },
  isAnyInList: {
    type: ["option", "context", 'link', "option-multi", 'link-multi', "context-multi", 'tags-multi'],
    fn: (v, f) => listIncludes(v, f),
    valueType: "list",
  },
  isNoneInList: {
    type: ["option", "context", 'link', "option-multi", 'link-multi', "context-multi", 'tags-multi'],
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
