import { Superstate } from "core/superstate/superstate";
import { detectPropertyType } from "utils/properties";

export type MetadataType = {
  name: string;
  type: string;
};

export const allCacheTypesForPaths =  (
  superstate: Superstate,
  paths: string[]
): MetadataType[] => {
  if (!superstate.settings.experimental) return [];;
  const properties: { [key: string]: string[] } = {};

  for (const path of paths) {
     const f = superstate.pathsIndex.get(path)?.metadata;
      if (f) {
      Object.keys(f).forEach((k) => {
        const type = detectPropertyType(f[k], k);
        if (type !='unknown' && type !='object')
        properties[k] = [...(properties[k] ?? []), type];
      });
    }
  }
  return Object.keys(properties).reduce((p, c) => {
    return [...p, { name: c, type: properties[c][0] }];
  }, [] as MetadataType[]);
};

export const allPropertiesForPaths = (
  superstate: Superstate,
  paths: string[]
): MetadataType[] => {
  const properties: { [key: string]: string[] } = {};

  for (const path of paths) {
     const f = superstate.pathsIndex.get(path)?.metadata?.properties;
      if (f) {
      Object.keys(f).forEach((k) => {
        properties[k] = [...(properties[k] ?? []), detectPropertyType(f[k], k)];
      });
    }
  }
  return Object.keys(properties).reduce((p, c) => {
    return [...p, { name: c, type: properties[c][0] }];
  }, [] as MetadataType[]);
};

const metadatTypeFilterPredicate = (value: any, index: number, self: any[]) => {
  return (
    self.findIndex(
      (v) => value["type"] == v["type"] && value["name"] == v["name"]
    ) === index
  );
};
