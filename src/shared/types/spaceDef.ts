import { Filter } from "./predicate";

export type SpaceSort = {
  field: string;
  asc: boolean;
  group: boolean;
  recursive: boolean;
};

export type FilterDef = {
  type: string;
  fType: string;
} & Filter;
export type FilterGroupDef = {
  type: 'any' | 'all';
  trueFalse: boolean;
  filters: FilterDef[];
};
export type JoinDefGroup = {
  recursive: boolean;
  path: string;
  type: 'any' | 'all';
  groups: FilterGroupDef[];
}
export type SpaceType = 'folder' | 'tag' | 'vault' | 'default' | 'unknown';


export type SpaceDefinition = {
  contexts?: string[];
  sort?: SpaceSort;
  joins?: JoinDefGroup[];
  links?: string[];
  tags?: string[];
  template?: string;
  templateName?: string;
  defaultSticker?: string;
  defaultColor?: string;
  readMode?: boolean;
  fullWidth?: boolean;
};
