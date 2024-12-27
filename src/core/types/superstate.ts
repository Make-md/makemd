
export const pathStateTypes = {
    path: "string",
    name: "string",
    parent: "string",
    type: "string",
    subtype: "string",
    label: {
        name: "string",
        sticker: "string",
        color: "string",
        thumbnail: "string",
        preview: "string",
    },
    metadata: {
        file: {
            ctime: "date",
            mtime: "date",
            size: "number",
            path: "string",
            parent: "string",
            extension: "string",
        },
    
    },
    properties: "object",
    hidden: "boolean",
    spaces: "string[]",
    tags: "string[]",
    inlinks: "string[]",
    outlinks: "string[]"
}