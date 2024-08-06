import { Superstate } from "core/superstate/superstate";
import { deletePath } from "core/superstate/utils/path";
import { PathPropertyName } from "core/types/context";
import { folderForTagSpace } from "core/utils/spaces/space";
import { pathToParentPath } from "core/utils/strings";
import { isString } from "lodash";
import { DBRow, SpaceInfo, SpaceTable } from "types/mdb";
import { insert } from "utils/array";
import { defaultMDBTableForContext } from "../../../schemas/mdb";
import { uniq } from "../../../utils/array";
import { parseMultiString } from "../../../utils/parsers";
import { formatDate } from "../date";


export const optionValuesForColumn = (column: string, table: SpaceTable) => {
  return uniq(
    table?.rows.reduce((p, c) => {
      if (!isString(c[column])) return [...p]
      return [...p, ...parseMultiString(c[column])];
    }, []) ?? []
  );
};

export const defaultTableDataForContext = (superstate: Superstate, space: SpaceInfo): SpaceTable => {
  const paths = [...superstate.getSpaceItems(space.path, true)];
  return {
    ...defaultMDBTableForContext(space),
    rows: paths.map((f) => ({ [PathPropertyName]: f.path, "Created": formatDate(superstate, f.metadata?.ctime, "yyyy-MM-dd") })),
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
  tag: string,
  newTag: string
) => {

  const spacePath = folderForTagSpace(tag, superstate.settings);

    if (await superstate.spaceManager.pathExists(spacePath)) {
      superstate.spaceManager.renamePath(spacePath, pathToParentPath(spacePath) + '/' + newTag)

    } else {
      deletePath(superstate, spacePath)
      
    }
  superstate.onTagRenamed(tag, newTag)

};
