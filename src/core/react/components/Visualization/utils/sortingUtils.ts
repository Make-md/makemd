/**
 * Utility functions for sorting data in visualizations
 */

import { safelyParseJSON } from "shared/utils/json";

/**
 * Extract options order from field definition
 */
export const getOptionsOrder = (fieldDefinition: any): string[] => {
  if (!fieldDefinition?.value) return [];
  
  const parsed = safelyParseJSON(fieldDefinition.value);
  if (!parsed?.options) return [];
  
  // Return the values in the order they appear in options array
  return parsed.options
    .filter((opt: any) => opt?.value)
    .map((opt: any) => String(opt.value));
};

/**
 * Check if a string value looks like a date
 */
export const isDateLike = (val: string): boolean => {
  if (!val || typeof val !== 'string') return false;
  
  // Common date patterns
  return /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}\/\d{2}\/\d{2}/.test(val) ||
         /\w{3}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+\w{3}\s+\d{4}/.test(val);
};

/**
 * Intelligent comparison function for sorting mixed data types
 * Handles dates, numbers, and strings with numeric awareness
 */
export const intelligentCompare = (a: any, b: any): number => {
  const aStr = String(a);
  const bStr = String(b);
  
  // Try date sorting first
  if (isDateLike(aStr) || isDateLike(bStr)) {
    const dateA = new Date(aStr);
    const dateB = new Date(bStr);
    
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
  }
  
  // Try numeric sorting
  const numA = parseFloat(aStr);
  const numB = parseFloat(bStr);
  
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  
  // Fallback to string sorting with numeric awareness
  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Sort values based on encoding type
 */
export const sortByEncodingType = (
  a: any, 
  b: any, 
  encodingType: 'temporal' | 'quantitative' | 'nominal' | 'ordinal',
  field: string,
  scale?: any,
  fieldDefinition?: any
): number => {
  const aVal = a[field];
  const bVal = b[field];
  
  if (encodingType === 'temporal') {
    const dateA = aVal instanceof Date ? aVal : new Date(String(aVal));
    const dateB = bVal instanceof Date ? bVal : new Date(String(bVal));
    return dateA.getTime() - dateB.getTime();
  }
  
  if (encodingType === 'quantitative') {
    return Number(aVal) - Number(bVal);
  }
  
  // For nominal/ordinal data, check if we have option field ordering
  if (fieldDefinition?.type === 'option' || fieldDefinition?.type === 'option-multi') {
    const optionsOrder = getOptionsOrder(fieldDefinition);
    if (optionsOrder.length > 0) {
      const aIndex = optionsOrder.indexOf(String(aVal));
      const bIndex = optionsOrder.indexOf(String(bVal));
      
      // If both values are in the options order, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in options, that one comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
  }
  
  // For nominal/ordinal data, use the scale's domain order if available
  if (scale && scale.domain) {
    const xDomain = scale.domain();
    const aIndex = xDomain.indexOf(String(aVal));
    const bIndex = xDomain.indexOf(String(bVal));
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
  }
  
  // Fallback to intelligent comparison
  return intelligentCompare(aVal, bVal);
};

/**
 * Sort an array of unique values intelligently
 */
export const sortUniqueValues = (values: string[], fieldDefinition?: any): string[] => {
  // If we have option field definition, use that order
  if (fieldDefinition?.type === 'option' || fieldDefinition?.type === 'option-multi') {
    const optionsOrder = getOptionsOrder(fieldDefinition);
    if (optionsOrder.length > 0) {
      // Sort based on options order, with unknown values at the end
      return [...values].sort((a, b) => {
        const aIndex = optionsOrder.indexOf(a);
        const bIndex = optionsOrder.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // Fallback to intelligent comparison for values not in options
        return intelligentCompare(a, b);
      });
    }
  }
  
  return [...values].sort(intelligentCompare);
};

/**
 * Extract unique values from data and sort them intelligently
 */
export const getUniqueSortedValues = (data: any[], field: string, fieldDefinition?: any): string[] => {
  const values = data.map(d => String(d[field] || ''));
  const uniqueValues = Array.from(new Set(values));
  return sortUniqueValues(uniqueValues, fieldDefinition);
};