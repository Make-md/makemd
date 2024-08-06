import { Superstate } from "core/superstate/superstate";
import { format, parseISO } from "date-fns";
import { isDate, isFinite, isString } from "lodash";

export const isValidDate = (d: Date) => {
    return d instanceof Date && !isNaN(d as any);
  }

export const formatDate = (superstate: Superstate, date: Date, dateFormat?: string) => {
    let dateString;
    try  {
       dateString = format(
            date,
            dateFormat?.length > 0
              ? dateFormat
              : superstate.settings.defaultDateFormat
          )
    } catch (e) {
        dateString = ''
    }
    return dateString;

}

export const parseDate = (str: any) => {
    if (!str) return null;
    if (isFinite(str)) {
        return new Date(str);
    }
    if (isString(str))
    {
        return parseISO(str)
        
    }
if (isDate(str))return str;
return null;
}