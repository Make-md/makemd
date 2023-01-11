export type DBRow = Record<string, string>;
export type DBRows = DBRow[];
export type DBTable = {
  uniques: string[];
  cols: string[];
  rows: DBRows;
};

export type MDBColumn = MDBField & { table: string };

export type DBTables = Record<string, DBTable>;

export type MDBTable = {
  schema: MDBSchema;
  cols: MDBField[];
  rows: DBRows;
};
export type MDBTables = Record<string, MDBTable>;
export type MDBSchema = {
  id: string;
  name: string;
  type: string;
  //used for type definition
  def?: string;
  //used for view options including filter, order and group
  predicate?: string;
  primary?: string;
};

export type MDBField = {
  name: string;
  schemaId: string;
  type: string;
  //used as constraint
  value?: string;
  hidden?: string;
  //used for styling and other metadata
  attrs?: string;
  unique?: string;
  primary?: string;
};
