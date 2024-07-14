export const serializeMultiDisplayString = (value: string[]) => value.map(f => f.replace(',', '\\,')).join(', ');
export const serializeMultiString = (value: string[]) => JSON.stringify(value)
export const serializeSQLValues = (value: string[]) => value.join(', ');
export const serializeSQLStatements = (value: string[]) => value.join('; ');
export const serializeSQLFieldNames = (value: string[]) => value.join(',');

