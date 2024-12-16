

import { PathCache } from "core/spaceManager/spaceManager";
import { parseAllMetadata, parseContextTableToCache, parseMetadata } from "core/superstate/cacheParsers";
import { IndexMap } from "core/types/indexMap";
import { MakeMDSettings } from "core/types/settings";
import { ContextState, PathState, SpaceState } from "core/types/superstate";
import { SpaceInfo, SpaceTables } from "types/mdb";

export type PathWorkerPayload = {path: string, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>, pathMetadata: PathCache, name: string, type: string, subtype: string, parent: string, oldMetadata: PathState};
export type BatchPathWorkerPayload = {pathCache: Map<string, PathCache>, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>,  oldMetadata: Map<string, PathState>};
export type BatchContextWorkerPayload = {map: Map<string, ContextWorkerPayload>, pathsIndex: Map<string, PathState>, spacesMap: IndexMap};
export type ContextWorkerPayload = {space: SpaceInfo, paths: string[], mdb: SpaceTables, dbExists: boolean, pathsIndex?: Map<string, PathState>, spacesMap: IndexMap};


export function parsePath (payload: PathWorkerPayload) {
    const {path, settings, spacesCache, pathMetadata, name, type, subtype, parent, oldMetadata} = payload;
    return parseMetadata(path, settings, spacesCache, pathMetadata, name, type, subtype, parent, oldMetadata);
}

export function parseContext (payload: ContextWorkerPayload, runContext: math.MathJsInstance) {
    const {space, mdb, paths, dbExists, spacesMap, pathsIndex} = payload;
    return parseContextTableToCache(space, mdb, paths, dbExists, pathsIndex, spacesMap, runContext);
}

export function parseAllContexts (payload: BatchContextWorkerPayload, runContext: math.MathJsInstance) {
    
    const {map, pathsIndex, spacesMap} = payload;
    const result = new Map<string, {cache: ContextState, changed: boolean}>();
    for (const [key, value] of map) {
        result.set(key, parseContext({...value, pathsIndex, spacesMap}, runContext));
    }
    return result;
}

export function parseAllPaths (payload: BatchPathWorkerPayload) {
    const {pathCache, settings, spacesCache, oldMetadata} = payload;
    return parseAllMetadata(pathCache, settings, spacesCache, oldMetadata);
}

