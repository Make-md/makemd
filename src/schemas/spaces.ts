import { DBTable } from "types/mdb";
import { SpaceDef } from "types/space";

export type AFile = {
  path: string;
  name: string;
  parent: string;
  isFolder: boolean;
  extension?: string;
  stat?: {
    ctime: number;
    mtime: number;
    size: number;
  }
}

export type VaultItem = {
  path: string;
  parent: string;
  created: string;
  sticker?: string;
  folder: string;
  color?: string;
  rank?: string;
};

export type Space = {
  name: string;
  sticker?: string;
  color?: string;
  pinned?: string;
  sort?: string;
  def?: SpaceDef;
  rank?: string;
};

export type SpaceItem = {
  space: string;
  path: string;
  rank: string;
};

export const vaultSchema: DBTable = {
  uniques: ["path"],
  cols: ["path", "parent", "created", "sticker", "color", "folder", "rank"],
  rows: [],
};

export const spaceSchema: DBTable = {
  uniques: ["name"],
  cols: ["name", "sticker", "color", "pinned", "sort", "def", "rank"],
  rows: [],
};

export const spaceItemsSchema: DBTable = {
  uniques: [],
  cols: ["space", "path", "rank"],
  rows: [],
};
