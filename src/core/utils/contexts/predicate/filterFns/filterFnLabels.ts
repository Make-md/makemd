import i18n from "shared/i18n";


export const filterFnLabels : Record<string, string> = {
  isEmpty: i18n.filterTypes.isEmpty,
  isNotEmpty: i18n.filterTypes.isNotEmpty,
  include: i18n.filterTypes.contains,
  notInclude: i18n.filterTypes.notContains,
  is: i18n.filterTypes.is,
  isNot: i18n.filterTypes.isNot,
  isLink: i18n.filterTypes.is,
  isNotLink: i18n.filterTypes.isNot,
  equal: "=",
  isGreatThan: ">",
  isLessThan: "<",
  isLessThanOrEqual: "≤",
  isGreatThanOrEqual: "≥",
  dateBefore: i18n.filterTypes.before,
  dateAfter: i18n.filterTypes.after,
  isSameDate: i18n.filterTypes.isSameDate,
  isSameDateAsToday: i18n.filterTypes.isSameDateAsToday,
  isExactList: i18n.filterTypes.is,
  isAnyInList: i18n.filterTypes.anyOf,
  isNoneInList: i18n.filterTypes.noneOf,
  isTrue: i18n.filterTypes.checked,
  isFalse: i18n.filterTypes.unchecked,
};
