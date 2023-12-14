import { PathLabel } from "makemd-core";
import { SpaceInfo, SpaceProperty, SpaceTableSchema, SpaceTables } from "../../types/mdb";
import { MDBFrames } from "../../types/mframe";
import { SpaceDefinition, SpaceType } from "./space";

export type WorkerJobType = {
    type: string,
    path: string,
}
export type SpaceState = {
    name: string
    path: string
    metadata?: SpaceDefinition
    space?: SpaceInfo
    contexts?: string[]
    type: SpaceType
    sortBy?: string
    sortable?: boolean,
    defPath?: string
} & CacheState



export type ContextState = {
    path: string
    space: SpaceInfo
    schemas: SpaceTableSchema[]
    tables?: SpaceTables
    cols: SpaceProperty[]
    //outlinks contained
    outlinks: string[]
    //contexts to notify if values change
    contexts: string[]
    paths: string[]
    spaceMap: { [key: string]: { [key: string]: string[]} } 

}

export type FrameState = {
    path: string
    schemas: SpaceTableSchema[]
    frames: MDBFrames
    listitems: MDBFrames
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

    displayName: string
    name?: string
    parent?: string
    type?: string
    label: PathLabel
    metadata?: Record<string, any>
    properties?: Record<string, any>
    hidden?: boolean
    spaces?: string[]
    tags?: string[]
    inlinks?: string[]
    outlinks?: string[]
} & CacheState
