import { Superstate } from "core/superstate/superstate";
import { pathToString } from "utils/path";

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
    return value.toString();
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

export const wrapQuotes = (s: string) => `"${s}"`
export const removeQuotes = (s: string): string => {
  if (!s) return s;

  const singleQuoteWithSemicolon = s.startsWith("'") && (s.endsWith("';") || s.endsWith("'"));
  const doubleQuoteWithSemicolon = s.startsWith('"') && (s.endsWith('";') || s.endsWith('"'));

  if (singleQuoteWithSemicolon || doubleQuoteWithSemicolon) {
      // Remove the quotes
      s = s.substring(1, s.length - 1);
      // If there was a semicolon, remove it as well
      if (s.endsWith('"') || s.endsWith("'")) {
          s = s.substring(0, s.length - 1);
      }
      return s;
  } else {
      return s;
  }
}

export const removeLeadingSlash = (path: string) =>
  path.charAt(0) == "/" ? path.substring(1) : path;
export const pathToParentPath = (path: string) =>
  removeLeadingSlash(path.substring(0, path.lastIndexOf("/"))) ||
  path;

  

  export const spaceDefPathForSpacePath = (spacePath: string) => spacePath+"/"+pathToString(spacePath)+".md"

  
