import { PathLabel } from "makemd-core";
import { SpaceInfo, SpaceProperty, SpaceTable, SpaceTableSchema } from "../../types/mdb";
import { MDBFrames } from "../../types/mframe";
import { SpaceDefinition, SpaceType } from "./space";

export type WorkerJobType = {
    type: string,
    path: string,
    payload?:{[key: string]: any}
}
export type SpaceState = {
    name: string
    path: string
    templates?: string[]
    metadata?: SpaceDefinition,
    dependencies?: string[],
    space?: SpaceInfo
    contexts?: string[]
    type: SpaceType
    sortBy?: string
    sortable?: boolean,

    propertyTypes?: SpaceProperty[],
    properties?: Record<string, any>
} & CacheState



export type ContextState = {
    path: string
    schemas: SpaceTableSchema[]
    contextTable: SpaceTable
    //outlinks contained
    outlinks: string[]
    //contexts to notify if values change
    contexts: string[]
    paths: string[]
    spaceMap: { [key: string]: { [key: string]: string[]} },
    dbExists: boolean 

}

export type FrameState = {
    path: string
    schemas: SpaceTableSchema[]
    frames: MDBFrames
}

export type TagsCache = {
    tag: string
    files: string[]
}

export type CacheState = {
    rank?: number
}
//everything needed to construct the file

export type PathState = {
    //File System Metadata
    path: string

    name?: string
    parent?: string
    type?: string
    subtype?: string
    label: PathLabel
    metadata?: Record<string, any>
    properties?: Record<string, any>
    hidden?: boolean
    spaces?: string[]
    linkedSpaces?: string[]
    liveSpaces?: string[]
    tags?: string[]
    inlinks?: string[]
    outlinks?: string[]
    readOnly: boolean
} & CacheState

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