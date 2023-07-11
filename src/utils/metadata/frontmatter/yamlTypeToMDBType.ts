
export const yamlTypeToMDBType = (YAMLtype: string) => {
  switch (YAMLtype) {
    case "duration":
      return "text";
      break;
    case "unknown":
      return "text";
      break;
  }
  return YAMLtype;
};
