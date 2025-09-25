import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SpaceProperty } from "shared/types/mdb";

export const defaultValueForField = (field: SpaceProperty, value?: any, path?: string) => {

const parsedValue = parseFieldValue(field.value, field.type)

  if (field.type == 'number' || field.type == 'boolean') {
    if (value)
      return value;
  } else {
    if (value?.length > 0) {
      return value
    }
  }

  if (parsedValue) {
    if (parsedValue.default == '$space' && path) return path;
    return parsedValue.default;
  }
};
export const saveDefaultValueForField = (field: SpaceProperty, value: any) => {
    const parsedValue = parseFieldValue(field.value, field.type)
  return {
    ...field,
    value: JSON.stringify({
      ...parsedValue,
      default: value
    })
  };
};
