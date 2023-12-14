import { PathPropertyName } from "core/types/context";
import { SpaceTable } from "types/mdb";
import { insertMulti } from "utils/array";

export const renameRowForPath = (
    spaceTable: SpaceTable,
    paths: string,
    newPath: string
  ): SpaceTable => {
    return {
      ...spaceTable,
      rows: spaceTable.rows.map((f) =>
        f[PathPropertyName] == paths
          ? { ...f, [PathPropertyName]: newPath }
          : f
      ),
    };
  };
  
 

  export const removeRowForPath = (spaceTable: SpaceTable, paths: string): SpaceTable => {
    return {
      ...spaceTable,
      rows: spaceTable.rows.filter(
        (f) => f[PathPropertyName] != paths
      ),
    };
  };

  export const removeRowsForPath = (spaceTable: SpaceTable, paths: string[]): SpaceTable => {
    return {
      ...spaceTable,
      rows: spaceTable.rows.filter(
        (f) => !paths.includes(f[PathPropertyName])
      ),
    };
  };



  export const reorderRowsForPath = (spaceTable: SpaceTable, paths: string[], index: number): SpaceTable => {
    const rows = spaceTable.rows.filter(
      (f) => paths.includes(f[PathPropertyName])
    )
    return {
      ...spaceTable,
      rows: insertMulti(spaceTable.rows.filter(
        (f) => !paths.includes(f[PathPropertyName])
      ), index, rows),
    };
  };