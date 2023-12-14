import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { folderForTagSpace } from "core/utils/spaces/space";
import { pathToParentPath } from "core/utils/strings";
import { DBRow, SpaceInfo, SpaceTable } from "types/mdb";
import { insert } from "utils/array";
import { defaultMDBTableForContext } from "../../../schemas/mdb";
import { uniq } from "../../../utils/array";
import { parseMultiString } from "../../../utils/parsers";


export const optionValuesForColumn = (column: string, table: SpaceTable) => {
  return uniq(
    table?.rows.reduce((p, c) => {
      return [...p, ...parseMultiString(c[column])];
    }, []) ?? []
  );
};

export const defaultTableDataForContext = (superstate: Superstate, space: SpaceInfo): SpaceTable => {
  const paths = [...superstate.getSpaceItems(space.path, true)];
  return {
    ...defaultMDBTableForContext(space),
    rows: paths.map((f) => ({ [PathPropertyName]: f.path })),
  };

};




export const createNewRow = (mdb: SpaceTable, row: DBRow, index?: number) => {
  if (index) {
    return {
      ...mdb,
      rows: insert(mdb.rows, index, row),
    };
  }
  return {
    ...mdb,
    rows: [...mdb.rows, row],
  };
};


export const renameTagSpacePath = async (
  superstate: Superstate,
  space: string,
  newSpace: string
) => {
  const spacePath = folderForTagSpace(space, superstate.settings);
  if (await superstate.spaceManager.pathExists(spacePath)) {
    superstate.onPathDeleted(spacePath);
  } else {
    superstate.onPathRename(spacePath, pathToParentPath(spacePath) + '/' + newSpace);
  }


};
