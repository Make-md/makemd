

import { PathCache } from "core/spaceManager/spaceManager";
import { parseAllMetadata, parseContextTableToCache, parseFramesTableToCache, parseMetadata } from "core/superstate/cacheParsers";
import { MakeMDSettings } from "core/types/settings";
import { ContextState, FrameState, PathState, SpaceState } from "core/types/superstate";
import { PathLabel } from "makemd-core";
import { SpaceInfo, SpaceTables } from "types/mdb";

export type PathWorkerPayload = {path: string, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>, pathMetadata: PathCache, label: PathLabel, type: string, parent: string, oldMetadata: PathState};
export type BatchPathWorkerPayload = {pathCache: Map<string, PathCache>, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>,  oldMetadata: Map<string, PathState>};

export type ContextWorkerPayload = {space: SpaceInfo, paths: string[], mdb: SpaceTables, oldCache: ContextState};


export function parsePath (payload: PathWorkerPayload) {
    const {path, settings, spacesCache, pathMetadata, label, type, parent, oldMetadata} = payload;
    return parseMetadata(path, settings, spacesCache, pathMetadata, label, type, parent, oldMetadata);
}

export function parseContext (payload: ContextWorkerPayload) {
    const {space, mdb, paths, oldCache} = payload;
    return parseContextTableToCache(space, mdb, paths, oldCache);
}

export function parseAllPaths (payload: BatchPathWorkerPayload) {
    const {pathCache, settings, spacesCache, oldMetadata} = payload;
    return parseAllMetadata(pathCache, settings, spacesCache, oldMetadata);
}

export function parseFrames (payload: {space: SpaceInfo, mdb: SpaceTables, oldCache: FrameState}) {
    const {space, mdb, oldCache} = payload;
    return parseFramesTableToCache(space, mdb, oldCache);
}
