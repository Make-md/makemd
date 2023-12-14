export const serializeMultiDisplayString = (value: string[]) => value.join(', ');export const serializeMultiString = (value: string[]) => value.join(',');
export const serializeSQLValues = (value: string[]) => value.join(', ');
export const serializeSQLStatements = (value: string[]) => value.join('; ');
export const serializeSQLFieldNames = (value: string[]) => value.join(',');

