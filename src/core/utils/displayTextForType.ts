import { Superstate } from 'makemd-core';
import { SpaceProperty } from 'shared/types/mdb';
import { safelyParseJSON } from 'shared/utils/json';
import { parseMultiString } from 'utils/parsers';
import { formatDate, isValidDate, parseDate } from './date';

export const displayTextForType = (
  property: SpaceProperty,
  value: string | number | boolean | object | null | undefined,
  superstate?: Superstate
): string => {
  if (!value || value === '') return '';
  
  const propertyConfig = safelyParseJSON(property?.value) || {};
  
  switch (property?.type) {
    case 'date':
    case 'date-multi': {
      const dateValue = parseDate(value);
      if (!isValidDate(dateValue)) return String(value);
      
      const format = propertyConfig?.format;
      if (superstate?.settings) {
        return formatDate(superstate.settings, dateValue, format);
      }
      
      try {
        return format ? format(dateValue, format) : dateValue.toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    
    case 'link':
    case 'link-multi': {
      if (property.type === 'link-multi') {
        const links = parseMultiString(String(value)) || [];
        return links.map(link => getLinkDisplayName(link, superstate)).join(', ');
      }
      return getLinkDisplayName(String(value), superstate);
    }
    
    case 'file': {
      return getLinkDisplayName(String(value), superstate);
    }
    
    case 'option':
    case 'option-multi': {
      if (property.type === 'option-multi') {
        const options = parseMultiString(String(value)) || [];
        return options.join(', ');
      }
      return String(value);
    }
    
    case 'tags':
    case 'tags-multi': {
      const tags = parseMultiString(String(value)) || [];
      return tags.map(tag => `#${tag}`).join(' ');
    }
    
    case 'boolean': {
      return String(value) === 'true' || value === true ? '✓' : '';
    }
    
    case 'number': {
      const numberValue = parseFloat(String(value));
      if (isNaN(numberValue)) return String(value);
      
      const format = propertyConfig?.format;
      if (format === 'currency') {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD'
        }).format(numberValue);
      } else if (format === 'percent') {
        return `${(numberValue * 100).toFixed(2)}%`;
      }
      return numberValue.toString();
    }
    
    case 'object':
    case 'object-multi': {
      try {
        const parsed = safelyParseJSON(String(value));
        if (parsed && typeof parsed === 'object') {
          return JSON.stringify(parsed);
        }
      } catch {}
      return String(value);
    }
    
    default:
      return value?.toString() || '';
  }
};

function getLinkDisplayName(path: string, superstate?: Superstate): string {
  if (!path) return '';
  
  // Try to get the proper name from superstate's path index
  if (superstate) {
    const pathState = superstate.pathsIndex.get(path);
    if (pathState?.label?.name) {
      return pathState.label.name;
    }
  }
  
  // Fallback to extracting filename from path
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  
  const extensionIndex = fileName.lastIndexOf('.');
  if (extensionIndex > 0) {
    return fileName.substring(0, extensionIndex);
  }
  
  return fileName;
}