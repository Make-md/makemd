import { Space } from "schemas/spaces";
import { ContextDef } from "types/context";
import { DBRow } from "types/mdb";

// Joining multi-strings with commas causes issues when there's a comma in the key.
// This can happen if the value is specified as a YAML array.
// This is common with aliases, as they might include commas.
export const MULTI_STRING_DELIMITER = '🚲🐭';

//named serializers for converting values to string

export const serializeDefString = (def: ContextDef[]) => JSON.stringify(def);
export const serializeSpace = (space: Space) : DBRow => ({...space, def: JSON.stringify(space.def)});

export const serializeMultiString = (value: string[]) => value.join(MULTI_STRING_DELIMITER);
export const serializeMultiDisplayString = (value: string[]) => value.join(MULTI_STRING_DELIMITER);

export const serializeSQLValues = (value: string[]) => value.join(', ');
export const serializeSQLStatements = (value: string[]) => value.join('; ');
export const serializeSQLFieldNames = (value: string[]) => value.join(',');
