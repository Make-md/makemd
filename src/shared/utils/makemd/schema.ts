import { SpaceTableSchema } from "shared/types/mdb";
import { FrameSchema } from "shared/types/mframe";
import { safelyParseJSON } from "shared/utils/json";


export const frameSchemaToTableSchema = (frameSchema: FrameSchema) => {
  return {
    ...frameSchema,
    def: JSON.stringify(frameSchema.def)
  };
};
export const mdbSchemaToFrameSchema = (schema: SpaceTableSchema): FrameSchema => {
  if (!schema) return null;
  return {
    ...schema,
    def: safelyParseJSON(schema.def)
  };
};
