import { SpaceTableSchema } from "shared/types/mdb";

export const defaultContextSchemaID = "files";
export const defaultContextDBSchema: SpaceTableSchema = {
  id: defaultContextSchemaID,
  name: "Items",
  type: "db",
  primary: "true",
};
