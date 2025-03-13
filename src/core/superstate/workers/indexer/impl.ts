

import { parseAllMetadata, parseContextTableToCache, parseMetadata } from "core/superstate/cacheParsers";
import { PathCache } from "shared/types/caches";
import { IndexMap } from "shared/types/indexMap";
import { SpaceTables } from "shared/types/mdb";
import { ContextState, PathState, SpaceState } from "shared/types/PathState";
import { MakeMDSettings } from "shared/types/settings";
import { SpaceInfo } from "shared/types/spaceInfo";

export type PathWorkerPayload = {path: string, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>, pathMetadata: PathCache, name: string, type: string, subtype: string, parent: string, oldMetadata: PathState};
export type BatchPathWorkerPayload = {pathCache: Map<string, PathCache>, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>,  oldMetadata: Map<string, PathState>};
export type BatchContextWorkerPayload = {map: Map<string, ContextWorkerPayload>, contextsIndex: Map<string, ContextState>, pathsIndex: Map<string, PathState>, spacesMap: IndexMap, settings: MakeMDSettings};
export type ContextWorkerPayload = {space: SpaceInfo, paths: string[], contextsIndex: Map<string, ContextState>, mdb: SpaceTables, dbExists: boolean, pathsIndex?: Map<string, PathState>, spacesMap: IndexMap, settings: MakeMDSettings, options: {
    force?: boolean,
    calculate?: boolean,
}};


export function parsePath (payload: PathWorkerPayload) {
    const {path, settings, spacesCache, pathMetadata, name, type, subtype, parent, oldMetadata} = payload;
    return parseMetadata(path, settings, spacesCache, pathMetadata, name, type, subtype, parent, oldMetadata);
}

export function parseContext (payload: ContextWorkerPayload, runContext: math.MathJsInstance) {
    const {space, mdb, paths, dbExists, spacesMap, pathsIndex, settings, contextsIndex, options} = payload;
    return parseContextTableToCache(space, mdb, paths, dbExists, pathsIndex, spacesMap, runContext, settings, contextsIndex, options);
}

export function parseAllContexts (payload: BatchContextWorkerPayload, runContext: math.MathJsInstance) {
    
    const {map, pathsIndex, spacesMap, settings, contextsIndex} = payload;
    const result = new Map<string, {cache: ContextState, changed: boolean}>();
    for (const [key, value] of map) {
        result.set(key, parseContext({...value, pathsIndex, spacesMap, settings, contextsIndex}, runContext, ));
    }
    return result;
}

export function parseAllPaths (payload: BatchPathWorkerPayload) {
    const {pathCache, settings, spacesCache, oldMetadata} = payload;
    return parseAllMetadata(pathCache, settings, spacesCache, oldMetadata);
}

