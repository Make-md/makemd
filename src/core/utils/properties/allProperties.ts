import { Superstate } from "makemd-core";
import { detectPropertyType } from "utils/properties";

export type PropertyType = {
  name: string;
  type: string;
};


export const allPropertiesForPaths = (
  superstate: Superstate,
  paths: string[]
): PropertyType[] => {
  const properties: { [key: string]: string[] } = {};

  for (const path of paths) {
     const f = superstate.pathsIndex.get(path)?.metadata?.property;
      if (f) {
      Object.keys(f).forEach((k) => {
        properties[k] = [...(properties[k] ?? []), detectPropertyType(f[k], k)];
      });
    }
  }
  return Object.keys(properties).reduce((p, c) => {
    return [...p, { name: c, type: properties[c][0] }];
  }, [] as PropertyType[]);
};

const metadatTypeFilterPredicate = (value: any, index: number, self: any[]) => {
  return (
    self.findIndex(
      (v) => value["type"] == v["type"] && value["name"] == v["name"]
    ) === index
  );
};
