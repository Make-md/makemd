import i18n from "core/i18n";


export const filterFnLabels : Record<string, string> = {
  isEmpty: i18n.filterTypes.isEmpty,
  isNotEmpty: i18n.filterTypes.isNotEmpty,
  include: i18n.filterTypes.contains,
  notInclude: i18n.filterTypes.notContains,
  is: i18n.filterTypes.is,
  isNot: i18n.filterTypes.isNot,
  equal: "=",
  isGreatThan: ">",
  isLessThan: "<",
  isLessThanOrEqual: "≤",
  isGreatThanOrEqual: "≥",
  dateBefore: i18n.filterTypes.before,
  dateAfter: i18n.filterTypes.after,
  isSameDateAsToday: "today",
  isAnyInList: i18n.filterTypes.anyOf,
  isNoneInList: i18n.filterTypes.noneOf,
  isTrue: i18n.filterTypes.checked,
  isFalse: i18n.filterTypes.unchecked,
};
