import { Space } from "schemas/spaces";
import { ContextDef } from "types/context";
import { DBRow } from "types/mdb";

//named serializers for converting values to string

export const serializeDefString = (def: ContextDef[]) => JSON.stringify(def);
export const serializeSpace = (space: Space) : DBRow => ({...space, def: JSON.stringify(space.def)});

export const serializeMultiString = (value: string[]) => value.join(',');
export const serializeMultiDisplayString = (value: string[]) => value.join(', ');

export const serializeSQLValues = (value: string[]) => value.join(', ');
export const serializeSQLStatements = (value: string[]) => value.join('; ');
export const serializeSQLFieldNames = (value: string[]) => value.join(',');