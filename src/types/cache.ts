import { Space, SpaceItem } from "schemas/spaces"
import { ContextInfo } from "types/contextInfo"
import { ContextDef } from "./context"
import { DBRows, MDBField } from "./mdb"

export type SpaceCache = {
    name: string,
    space: Space,
    spaceItems: SpaceItem[]
}

export type FolderNoteCache = {
    folderPath: string,
    folderNotePath: string
}

export type ContextsMetadataCache = {
    path: string,
    info: ContextInfo,
    name: string,
    sticker: string,
    banner: string,
    cols: MDBField[],
    files: string[],
    rows: DBRows,
    def: ContextDef[],
    //outlinks contained
    outlinks: string[],
    //contexts to notify if values change
    contexts: string[],
    defContexts: string[]
}

export type TagsCache = {
    tag: string,
    files: string[]
}

//everything needed to construct the file
export type FileMetadataCache = {
    path: string,
    name?: string,
    ctime?: number,
    mtime?: number,
    rank?: string,
    folderSort?: string,
    parent?: string,
    isFolder?: boolean,
    extension?: string,
    size?: number,
    sticker?: string,
    color?: string,
    banner?: string,
    folderNote?: FolderNoteCache,
    frontmatter?: Record<string, string>
    frontmatterTypes?: Record<string, string>
    contexts?: string[]
    spaceRanks?: Record<string, string>
    spaces?: string[],
    tags?: string[],
    fileTags?: string[],
    inlinks?: string[],
    outlinks?: string[],
}