import { ContextDef } from "core/types/context";

//named serializers for converting values to string

export const serializeDefString = (def: ContextDef[]) => JSON.stringify(def);

