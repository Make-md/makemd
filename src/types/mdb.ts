
export type DBRow = Record<string, string>;
export type DBRows = DBRow[];
export type DBTable = {
  uniques: string[];
  cols: string[];
  rows: DBRows;
};

export enum ContextSchemaType {
  SpaceType = 0,
  ContextType = 1,
  FrameType = 2,
  TableType = 3,
  CommandType = 4,
}

export type FilesystemSpaceInfo = SpaceInfo & {
  folderPath: string;
  dbPath: string;
  framePath: string;
  commandsPath: string;
}

export type SpaceInfo = {
  name: string,
  path: string,
  isRemote: boolean;
  readOnly: boolean;
  defPath: string;
  notePath: string;
}

export type SpaceTableColumn = SpaceProperty & { table?: string };

export type DBTables = Record<string, DBTable>;

export type MDB = {
  schemas: SpaceTableSchema[];
  fields: SpaceProperty[];
  tables: {[key: string]: DBTable };
};

export type SpaceTable = {
  schema: SpaceTableSchema;
  cols: SpaceProperty[];
  rows: DBRows;
};
export type SpaceTables = Record<string, SpaceTable>;
export type SpaceTableSchema = {
  id: string;
  name: string;
  type: string;
  //used for type definition
  def?: string;
  //used for view options including filter, order and group
  predicate?: string;
  primary?: string;
};

export type SpaceProperty = {
  name: string;
  //schema that the fields in
  schemaId?: string;
  type: string;
  //metadata for field
  value?: string;
  hidden?: string;
  //styling for field
  attrs?: string;
  //constraints at the db level
  unique?: string;
  primary?: string;
};
