import { PathLabel } from "./caches";
import { SpaceProperty, SpaceTable, SpaceTables, SpaceTableSchema } from "./mdb";
import { MDBFrames } from "./mframe";
import { SpaceDefinition, SpaceType } from "./spaceDef";
import { SpaceInfo } from "./spaceInfo";

export type SuperstateEvent = {
    "pathCreated": { path: string; };
    "pathChanged": { path: string; newPath: string; };
    "pathDeleted": { path: string; };
    "pathStateUpdated": { path: string; };
    "spaceChanged": { path: string; newPath: string; };
    "spaceDeleted": { path: string; };
    "spaceStateUpdated": { path: string; };
    "contextStateUpdated": { path: string; };
    "frameStateUpdated": { path: string; schemaId?: string; };
    "actionStateUpdated": { path: string; };
    "settingsChanged": null;
    "warningsChanged": null;
    "focusesChanged": null;
    "superstateUpdated": null;
    "superstateReindex": null;
};
export type WorkerJobType = {
    type: string;
    path: string;
    payload?: { [key: string]: any; };
};
export type SpaceState = {
    name: string;
    path: string;
    templates?: string[];
    metadata?: SpaceDefinition;
    dependencies?: string[];
    space?: SpaceInfo;
    contexts?: string[];
    type: SpaceType;
    sortBy?: string;
    sortable?: boolean;

    propertyTypes?: SpaceProperty[];
    properties?: Record<string, any>;
} & CacheState;



export type ContextState = {
    path: string;
    schemas: SpaceTableSchema[];
    contextTable: SpaceTable;
    //outlinks contained
    outlinks: string[];
    //contexts to notify if values change
    contexts: string[];
    paths: string[];
    spaceMap: { [key: string]: { [key: string]: string[]; }; };
    dbExists: boolean;
    mdb: SpaceTables

};

export type FrameState = {
    path: string;
    schemas: SpaceTableSchema[];
    frames: MDBFrames;
};

export type TagsCache = {
    tag: string;
    files: string[];
};

export type CacheState = {
    rank?: number;
};
//everything needed to construct the file
export type PathState = {
    //File System Metadata
    path: string;

    name?: string;
    parent?: string;
    type?: string;
    subtype?: string;
    label: PathLabel;
    metadata?: Record<string, any>;
    properties?: Record<string, any>;
    hidden?: boolean;
    spaces?: string[];
    linkedSpaces?: string[];
    liveSpaces?: string[];
    tags?: string[];
    inlinks?: string[];
    outlinks?: string[];
    readOnly: boolean;
    spaceNames?: string[];
} & CacheState;
