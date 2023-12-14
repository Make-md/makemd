import { PathCache } from "core/spaceManager/spaceManager";
import { ContextState, FrameState, PathState, SpaceState } from "core/types/superstate";
import _ from "lodash";

import { MakeMDSettings } from "core/types/settings";
import { SpaceInfo, SpaceTable, SpaceTables } from "types/mdb";
import { MDBFrame } from "types/mframe";
import { orderStringArrayByArray, uniq } from "utils/array";

import { PathPropertyName } from "core/types/context";
import { pathByDef } from "core/utils/spaces/query";
import { ensureArray, tagSpacePathFromTag } from "core/utils/strings";
import { PathLabel } from "makemd-core";
import { defaultContextSchemaID } from "schemas/mdb";
import { excludePathPredicate } from "utils/hide";
import { parseLinkString, parseMultiString } from "utils/parsers";
import { pathToString } from "utils/path";



export const parseFramesTableToCache = (space: SpaceInfo, mdb: SpaceTables, oldCache: FrameState) : { changed: boolean, cache: FrameState } => {
    if (!space) return {changed: false, cache: null}
    if (!mdb) {
        return {changed: false, cache: {
            path: space.path,
            frames: {},
            schemas: [],
            listitems: {}
        }}
    }
    const schemas = Object.values(mdb).map(f => f.schema);
    const frames = schemas.filter(f => f.type == 'frame').reduce((p,c) => ({...p, [c.id]: mdb[c.id] as MDBFrame}), {})

    const listitems = schemas.filter(f => f.type == 'listitem').reduce((p,c) => ({...p, [c.id]: mdb[c.id] as MDBFrame}), {})
    const cache : FrameState = {
        path: space.path,
        frames,
        schemas,
        listitems
    }
    let changed = true;
    if (oldCache && _.isEqual(cache, oldCache)) {
        changed = false;
    }
    return {changed, cache}
}

export const parseContextTableToCache = (space: SpaceInfo, mdb: SpaceTables, paths: string[], oldCache: ContextState) : { changed: boolean, cache: ContextState } => {

    const spaceMap : { [key: string] : { [key: string] : string[] } } = {};
    if (!space) return {changed: false, cache: null}
    if (!mdb) {
        return {changed: false, cache: {
            cols: [],
            path: space.path,
            schemas: [],
            outlinks: [],
            contexts: [],
            paths: [],
            tables: {},
            space,
            spaceMap
        }}
    }
    const schemas = Object.values(mdb).map(f => f.schema);
    const dbSchema = schemas.find(f => f.primary == 'true');
    const mdbTable : SpaceTable = mdb[dbSchema.id] as SpaceTable;
    
    const tables : SpaceTables = mdb;
    const contextCols = mdbTable.cols?.filter(f => f.type.startsWith('context')) ?? [];
    const linkCols = mdbTable.cols?.filter(f => f.type.startsWith('link')) ?? [];
    const contexts = uniq(contextCols.map(f => f.value))
    contextCols.forEach(f => {
        spaceMap[f.name] = {};
        mdbTable.rows.forEach(g => {
            parseMultiString(g[f.name]).forEach(h =>
                spaceMap[f.name][h] = [...(spaceMap[f.name][h] ?? []), g[PathPropertyName]]
                )
        });

    })
    const contextPaths = tables[defaultContextSchemaID]?.rows?.map(f => f[PathPropertyName]) ?? [];
    const newPaths = orderStringArrayByArray(paths ?? [], contextPaths)
    const outlinks = uniq(mdbTable.rows.reduce((p, c) => uniq([...p, ...[...contextCols, ...linkCols].flatMap(f => parseMultiString(c[f.name]).map(f => parseLinkString(f)))]), []))
    const cache : ContextState = {
        cols: mdbTable.cols,
        path: space.path,
        contexts: contexts,
        outlinks: outlinks,
        paths: newPaths,
        tables, schemas,
        space,
        spaceMap
    }
    let changed = true;
    if (oldCache && _.isEqual(cache, oldCache)) {
        changed = true;
    }
    return {changed, cache}
}


export const parseAllMetadata = (fileCache: Map<string, PathCache>, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>, oldCache: Map<string, PathState>) : {[key: string]: { changed: boolean, cache: PathState }} => {
    const cache : {[key: string]: { changed: boolean, cache: PathState }} = {};
    for (const [path, _pathCache] of fileCache) {
        const cachePath = spacesCache.get(path)?.defPath ?? path;
        
        const pathCache = fileCache.get(cachePath) ?? _pathCache;

        const parent = _pathCache?.parent ?? '';
        const type = _pathCache?.type ?? '';
        const label = pathCache?.label;
        const oldMetadata = oldCache?.get(path);
        const {changed, cache: metadata} = parseMetadata(path, settings, spacesCache, pathCache, label, type, parent, oldMetadata);
        cache[path] = { changed, cache: metadata };
    }
    return cache;

}

export const parseMetadata = (path: string, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>, pathCache: PathCache, label: PathLabel, type: string, parent: string, oldMetadata: PathState) : { changed: boolean, cache: PathState }  => {

    const defaultSticker = (
        sticker: string,
        type: string,
        path: string,
      ): string => {
        if (sticker?.length > 0) return sticker;
        if (sticker?.length > 0) return sticker;
        if (type == 'space')
        {
            if (path == 'Spaces/Home') return 'ui//mk-ui-home';
            if (path == "/") return 'lucide//vault';
            if (path.startsWith('spaces://#')) return "lucide//tags";
            return "ui//mk-ui-folder";
        }
      return "ui//mk-ui-file";
      
      };

    const cache : PathState = {  label: pathCache?.label, path: path, name: pathToString(path), displayName: pathToString(path) };

    const tags : string[] = [];
    const fileTags : string[] = pathCache?.tags?.map(f => f) ?? [];
    let hidden = excludePathPredicate(settings, path);
    const getTagsFromCache = (map: Map<string, SpaceState>, spaces: string[], seen = new Set()) =>{
        const keys : string[] = [];
        
    for (const space of spaces) {
        const valList = (map.get(space)?.contexts as string[] ?? []);

        for (const key of valList){
        // If the current key is already seen, skip it to prevent infinite loops
        if (seen.has(key)) continue;

        // Check if any value from valuesList exists in the current key's value list

            keys.push(key);
            seen.add(key); // Mark the key as seen

            // Recursively search for this key in the map
            keys.push(...getTagsFromCache(map, [tagSpacePathFromTag(key)], seen));}

    }
    return keys;
    }
    
    if (spacesCache.has(parent)) {
        for (const def of spacesCache.get(parent).contexts ?? []) {
            tags.push(def);
        }
    }

    tags.push(...fileTags)
    const name = label.name;
    const aliases = pathCache?.properties ? ensureArray(pathCache.properties[settings.fmKeyAlias]) : [];
    const sticker = defaultSticker(label.sticker, type, path);
    const color = label.color ?? '';
    
    const inlinks = pathCache?.inlinks ?? [];
    const outlinks = pathCache?.links ?? []
    
    

    const displayName = settings.spacesUseAlias ? aliases[0] ?? name : name;

    const pathState : PathState = {
        ...cache,
        name,
        tags: uniq(tags),
        type: type,
        displayName,
        parent,
        label: {
            name,
            sticker,
            color
        },
        metadata: {
            ...pathCache,
        },
        inlinks,
        outlinks
    }

    const spaces : string[] = [];
    
    for (const s of tags) {
        spaces.push(tagSpacePathFromTag(s))
    }
    for (const [s, space] of spacesCache) {
        if (space.defPath == path) {
            hidden = true;
        }
        if (space.space && space.space.path == parent) {
            spaces.push(s)
            continue;
        }
        if (space.metadata?.filters?.length > 0) {
            if (pathByDef(space.metadata.filters, pathState)) {
                spaces.push(s);
                continue;
            }
        }
         if (space.metadata?.links?.length  > 0) {
            const spaceItem = (space.metadata?.links ?? []).find(f => f == pathState.path);
            if (spaceItem) {
                spaces.push(s);
                
                continue;
            }
        }
    }

        const newTags = getTagsFromCache(spacesCache, spaces)
        spaces.push(...newTags.map(f => tagSpacePathFromTag(f)));
        
        pathState.tags.push(...newTags)
        
    const metadata : PathState = hidden ? {...pathState, spaces: [], hidden: hidden} : {...pathState, spaces: uniq(spaces), hidden };
    let changed = true;

    if (oldMetadata && _.isEqual(metadata, oldMetadata)) {
        
        changed = false;
    }
    return {changed, cache: metadata }
}