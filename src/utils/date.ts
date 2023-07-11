import { format } from "date-fns";
import MakeMDPlugin from "main";

export const formatDate = (plugin: MakeMDPlugin, date: Date, dateFormat?: string) => {
    let dateString;
    try  {
       dateString = format(
            date,
            dateFormat?.length > 0
              ? dateFormat
              : plugin.settings.defaultDateFormat
          )
    } catch (e) {
        dateString = 'Date Format Invalid'
    }
    return dateString;

}