import { Filter } from "./predicate";

export type SpaceSort = {
  field: string;
  asc: boolean;
  group: boolean;
  recursive: boolean;
};

export type SpaceDefFilter = {
  type: string;
  fType: string;
} & Filter;
export type SpaceDefGroup = {
  type: 'any' | 'all';
  trueFalse: boolean;
  filters: SpaceDefFilter[];
};
export type SpaceType = 'folder' | 'tag' | 'vault' | 'default' | 'unknown';


export type SpaceDefinition = {
  contexts?: string[];
  sort?: SpaceSort;
  filters?: SpaceDefGroup[];
  links?: string[];
  tags?: string[];
  template?: string;
  templateName?: string;
  recursive?: string;
  defaultSticker?: string;
  defaultColor?: string;
  readMode?: boolean;
};
