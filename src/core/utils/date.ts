import type { Superstate } from 'core/superstate/superstate';
import { format, parseISO } from 'date-fns';
import { isDate, isFinite, isString } from 'lodash';
import { RRule } from 'rrule';

export const isValidDate = (d: Date) => {
  return d instanceof Date && !isNaN(d as any);
};

export const isoDateFormat = `yyyy-MM-dd'T'HH:mm:ss`;

export const formatDate = (
  superstate: Superstate,
  date: Date,
  dateFormat?: string,
) => {
  let dateString;
  
  try {
    const hasTime =
    date.getHours() > 0 || date.getMinutes() > 0 || date.getSeconds() > 0;
    dateString = format(
      date,
      dateFormat?.length > 0
        ? dateFormat
        : hasTime
          ? `${superstate.settings.defaultDateFormat} ${superstate.settings.defaultTimeFormat}`
          : superstate.settings.defaultDateFormat,
    );
  } catch (e) {
    dateString = '';
  }
  return dateString;
};

export const parseDate = (str: any) => {
  if (!str) return null;
  if (isFinite(str)) {
    return new Date(str);
  }
  if (isString(str)) {
    return parseISO(str);
  }
  if (isDate(str)) return str;
  return null;
};

export const getFreqValue = (freq: string) => {
  if (freq == 'DAILY') return RRule.DAILY;
  if (freq == 'WEEKLY') return RRule.WEEKLY;
  if (freq == 'MONTHLY') return RRule.MONTHLY;
  if (freq == 'YEARLY') return RRule.YEARLY;
  if (freq == 'HOURLY') return RRule.HOURLY;
};
export const getWeekdayValue = (weekday: string) => {
  if (weekday == 'SU') return 6;
  if (weekday == 'MO') return 0;
  if (weekday == 'TU') return 1;
  if (weekday == 'WE') return 2;
  if (weekday == 'TH') return 3;
  if (weekday == 'FR') return 4;
  if (weekday == 'SA') return 5;
};
