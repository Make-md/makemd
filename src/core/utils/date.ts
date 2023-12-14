import { Superstate } from "core/superstate/superstate";
import { format } from "date-fns";

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
        dateString = 'Date Format Invalid'
    }
    return dateString;

}