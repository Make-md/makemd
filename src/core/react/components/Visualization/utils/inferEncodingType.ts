import { SpaceProperty } from "shared/types/mdb";
import { FieldType } from "shared/types/visualization";

/**
 * Infers the appropriate visualization encoding type based on the field's SpaceProperty type
 */
export function inferEncodingType(
  property: SpaceProperty | undefined,
  values?: unknown[]
): FieldType {
  // If we have property metadata, use it to determine encoding type
  if (property) {
    switch (property.type) {
      case 'number':
        return 'quantitative';
      case 'date':
      case 'date-multi':
        return 'temporal';
      case 'boolean':
      case 'option':
      case 'option-multi':
      case 'tags':
      case 'tags-multi':
        return 'nominal';
      case 'link':
      case 'link-multi':
      case 'file':
      case 'text':
      case 'tag':
      case 'image':
        return 'nominal';
      default:
        // Fall through to value-based inference
        break;
    }
  }

  // If no property metadata, try to infer from values
  if (values && values.length > 0) {
    // Check if all non-null values are numbers
    const nonNullValues = values.filter(v => v != null && v !== '');
    if (nonNullValues.length === 0) return 'nominal';

    // Check if values are dates
    const areDates = nonNullValues.every(v => {
      if (v instanceof Date) return true;
      const date = new Date(String(v));
      return !isNaN(date.getTime());
    });
    if (areDates) return 'temporal';

    // Check if values are numbers
    const areNumbers = nonNullValues.every(v => {
      if (typeof v === 'number') return true;
      const num = Number(v);
      return !isNaN(num) && isFinite(num);
    });
    if (areNumbers) return 'quantitative';
  }

  // Default to nominal for categorical data
  return 'nominal';
}

/**
 * Checks if the encoding type should use a continuous scale
 */
export function isContinuousScale(type: FieldType): boolean {
  return type === 'quantitative' || type === 'temporal';
}

/**
 * Updates encoding type based on field property if not already set correctly
 */
export function ensureCorrectEncodingType(
  encoding: { field: string; type?: FieldType },
  property: SpaceProperty | undefined,
  values?: unknown[]
): { field: string; type: FieldType } {
  const inferredType = inferEncodingType(property, values);
  
  // If no type is set, use inferred type
  if (!encoding.type) {
    return { ...encoding, type: inferredType };
  }

  // For scatter plots, ensure numeric/date fields aren't treated as categorical
  if (
    (property?.type === 'number' || property?.type === 'date' || property?.type === 'date-multi') &&
    (encoding.type === 'nominal' || encoding.type === 'ordinal')
  ) {
    return { ...encoding, type: inferredType };
  }

  // Otherwise keep the existing type
  return { ...encoding, type: encoding.type };
}