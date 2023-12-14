import { Superstate } from "core/superstate/superstate";
import { uniqueNameFromString } from "utils/array";


export const createInlineTable = async (superstate: Superstate, path: string) => {


    const schemas = await superstate.spaceManager.tablesForSpace(path)

    if (schemas)
      return uniqueNameFromString(
        "Table",
        schemas.map((f) => f.id)
      );
    return "Table";
  };