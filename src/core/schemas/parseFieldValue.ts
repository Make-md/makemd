import { safelyParseJSON } from "shared/utils/json";
import { parseMultiString } from "utils/parsers";
import { fieldTypeForType } from "../../schemas/mdb";

type FilePropValue = {
  value: string;
  type: string;
};

export const convertFileProp = ({ field, value }: { field: string; value: string; }): FilePropValue => {
  if (value == 'ctime')
    return { value: `parseDate(prop('File')['metadata']['ctime'])`, type: 'date' };
  return { value: ``, type: 'string' };
};

export const parseFieldValue = (
  value: string,
  type: string,
): Record<string, any> => {
  let valueProp = safelyParseJSON(value);
  if (valueProp) {
    if (type == 'fileprop') {
      if (valueProp.field)
      return convertFileProp(valueProp);
    }
    
    const fieldType = fieldTypeForType(type);
    return [...(fieldType?.configKeys ?? []), 'alias', 'default', 'required'].reduce((p, c) => ({ ...p, [c]: valueProp[c] }), {});
  }
  if (!type) return {};
  if (!valueProp) {
    if (type == "context") {
        valueProp = {};
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
        valueProp = convertFileProp({field, value: val})
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
};export const parseFlexValue = (dataString: string) => {
  const value = safelyParseJSON(dataString);
  const initialValue = value?.value;
  const initialType = value?.type;
  const initialConfig = value?.config;
  return {
    value: initialValue,
    type: initialType,
    config: initialConfig,
  };

};

