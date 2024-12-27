import { DBTable } from "shared/types/mdb";


export const vaultSchema: DBTable = {
  uniques: ["path"],
  cols: ["path", "parent", "created", "sticker", "color", "folder", "rank", "name"],
  rows: [],
};
