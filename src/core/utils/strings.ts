import { Superstate } from "makemd-core";
import { safelyParseJSON } from "utils/parsers";

export const defaultString = (value: any, string: string) => {
  if (!value || value.length == 0) return string;
  return value;
}

export function ensureArray(value: unknown): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

export function ensureStringValueFromSet(value: unknown, values: string[], defaultValue: string) : string {
  const _v = ensureString(value)
  return values.some(f => f == _v) ? _v : defaultValue
}

export function ensureString(value: unknown): string {
  if (!value) return ""
  if (typeof value !== 'string') {
    const newValue = value.toString();
    if (typeof newValue === 'string') {
      return newValue;
    }
    return '';
  }
  return value;
}


export function ensureBoolean(value: unknown): boolean {
  if (!value) return false
  return true;
}


export const indexOfCharElseEOS = (char: string, str: string) => {
  if (str.indexOf(char) > 0) return str.indexOf(char);
  return str.length;
};

export const spaceNameFromSpacePath = (contextPath: string, superstate: Superstate) => superstate.spacesIndex.get(contextPath)?.name ?? contextPath
export const spacePathFromName = (spaceName: string) => "spaces://"+encodeSpaceName(spaceName)
export const encodeSpaceName = (spaceName: string) => spaceName?.replace(/\//g, "+")
;export const tagSpacePathFromTag = (tag: string) =>
"spaces://"+tag


export const wrapObjectString = (s: string) => `{ ${Object.entries(safelyParseJSON(s)).map(([key, value]) => `${key}: ${value}`).join(', ')} }`
export const wrapParanthesis = (s: string) => s ? `(${s})` : null;
export const wrapQuotes = (s: string) => s ? `"${s.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"` : null
export const unwrapParanthesis = (s: string) => {
  if (!s) return s;
  if (s.startsWith("(")) {
    if (s.endsWith(")")) {
      return s.substring(1, s.length - 1);
    } else if (s.endsWith(");")) {
      return s.substring(1, s.length - 2);
    }
  }
  return s;
}
export const removeQuotes = (s: string): string => {
  if (!s) return s;
  if (typeof s === 'number') return (s as number).toString();
  const singleQuoteWithSemicolon = s.startsWith("'") && (s.endsWith("';") || s.endsWith("'"));
  const doubleQuoteWithSemicolon = s.startsWith('"') && (s.endsWith('";') || s.endsWith('"'));

  if (singleQuoteWithSemicolon || doubleQuoteWithSemicolon) {
      // Remove the quotes
      s = s.substring(1, s.length - 1);
      // If there was a semicolon, remove it as well
      if (s.endsWith('"') || s.endsWith("'")) {
          s = s.substring(0, s.length - 1);
      }
      return s.replace(/\\"/g, '"')
  } else {
      return s.replace(/\\"/g, '"');
  }
}

export const initiateString = (s: string, defaultString: string) => !s || s.length == 0 ? defaultString : s

export const removeLeadingSlash = (path: string) =>
  path.charAt(0) == "/" ? path.substring(1) : path;
export const pathToParentPath = (path: string) =>
  removeLeadingSlash(path.substring(0, path.lastIndexOf("/"))) ||
  path;



  
