import { parseMultiString, safelyParseJSON } from "utils/parsers";
import { fieldTypeForType } from "../../schemas/mdb";


export const parseFieldValue = (
  value: string,
  type: string
): Record<string, any> => {
  let valueProp = safelyParseJSON(value);
  if (valueProp) {
    return [...(fieldTypeForType(type).configKeys ?? []), 'alias', 'default'].reduce((p, c) => ({ ...p, [c]: valueProp[c] }), {});
  }
  if (!type) return {};
  if (!valueProp) {
    if (type == "context") {
      if (value?.length > 0) {
        valueProp = {
          space: value,
        };
      } else {
        valueProp = {};
      }
    } else if (type.startsWith("date")) {
      if (value?.length > 0) {
        valueProp = {
          format: value,
        };
      } else {
        valueProp = {};
      }
    } else if (type.startsWith("fileprop")) {
      if (value?.length > 0) {
        const [field, val] = value.split(".");
        valueProp = {
          field,
          value: val,
        };
      } else {
        valueProp = {};
      }
    } else if (type.startsWith('option')) {
      if (value?.length > 0) {
        const options = parseMultiString(value).map(f => ({ name: f, value: f }));
        valueProp = {
          options
        };
      } else {
        valueProp = {};
      }
    }
  }
  return valueProp ?? {};
};
