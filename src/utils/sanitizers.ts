
export const sanitizeSQLStatement = (name: string) => {
  try {
    return name?.replace(/'/g, `''`)
  } catch(e) {
    console.log(e, name);
    return ''
  }
};export const sanitizeColumnName = (name: string): string => {
  if (name?.charAt(0) == "_") {
    return sanitizeColumnName(name.substring(1));
  }
  return name?.replace(/"/g, ``);
};
export const sanitizeTableName = (name: string) => {
  return name?.replace(/[^a-z0-9+]+/gi, "");
};
const folderReservedRe = /^[+\$#^]+/;
const illegalRe = /[\/\?<>\\:\*\|":]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

export const sanitizeFolderName = (name: string) => {
  const replacement = "";
  return name
    .replace(folderReservedRe, replacement)
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement);
};
export const sanitizeFileName = (name: string) => {
  const replacement = "";
  return name
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement);
};

