import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";


import { SpaceFragmentSchema } from "shared/types/spaceFragment";
import { ISuperstate } from "shared/types/superstate";

export const uriToSpaceFragmentSchema = async (
  superstate: ISuperstate,
  path: string
): Promise<SpaceFragmentSchema> => {
  const uri = superstate.spaceManager.uriByString(path);
  if (uri.refType == "context") {
    const schema = superstate.contextsIndex
      .get(uri.basePath)
      ?.schemas.find((s) => s.id == uri.ref);
    if (schema) {
      return {
        id: schema.id,
        name: schema.name,
        type: "context",
        path: uri.basePath,
      };
    }
  }
  if (uri.refType == "frame") {
    return superstate.spaceManager.readFrame(uri.basePath, uri.ref).then((s) => {

      const schema = s?.schema;
      if (schema) {
        const frameSchema = mdbSchemaToFrameSchema(schema);
        return {
          id: schema.id,
          name: frameSchema.name,
          sticker: frameSchema.def?.icon,
          type: "frame",
          frameType: frameSchema.type,
          path: uri.basePath,
        };
      }
      return null;
    });
  }
  if (uri.refType == "action") {
    const schema = superstate.actionsIndex
      .get(uri.path)
      ?.find((s) => s.schema.id == uri.ref)?.schema;
    if (schema) {
      return {
        id: schema.id,
        name: schema.name,
        sticker: schema.def?.icon,
        type: "action",
        path: uri.basePath,
      };
    }
  }
  return null;
};
