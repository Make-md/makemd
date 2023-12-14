export const PathPropertyName = "File"
export const PathPropertyCreated = "Created"

export type ContextDefType = 'tag'
export type ContextDef = {
    type: ContextDefType,
    value: string
}

export type ContextLookup = {
    field: string;
    property: string;
}