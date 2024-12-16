import { PathCache } from "core/spaceManager/spaceManager";
import { MakeMDSettings } from "core/types/settings";
import { ContextState, PathState, SpaceState } from "core/types/superstate";
import _ from "lodash";
import { SpaceInfo, SpaceProperty, SpaceTable, SpaceTables } from "types/mdb";
import { orderStringArrayByArray, uniq } from "utils/array";

import { PathPropertyName } from "core/types/context";
import { IndexMap } from "core/types/indexMap";
import { builtinSpacePathPrefix, builtinSpaces, tagsSpacePath } from "core/types/space";
import { linkContextRow, propertyDependencies } from "core/utils/contexts/linkContextRow";
import { pathByDef } from "core/utils/spaces/query";
import { ensureArray, tagSpacePathFromTag } from "core/utils/strings";
import { defaultContextDBSchema, defaultContextFields, defaultContextSchemaID } from "schemas/mdb";
import { excludePathPredicate } from "utils/hide";
import { parseLinkString, parseMultiString } from "utils/parsers";
import { pathToString } from "utils/path";



export const parseContextTableToCache = (space: SpaceInfo, mdb: SpaceTables, paths: string[], dbExists: boolean, pathsIndex: Map<string, PathState>, spacesMap: IndexMap, runContext: math.MathJsInstance) : { changed: boolean, cache: ContextState } => {

    const spaceMap : { [key: string] : { [key: string] : string[] } } = {};

    if (!space) return {changed: false, cache: null}
    if (!mdb) {
        return {changed: false, cache: {

            path: space.path,
            schemas: [],
            outlinks: [],
            contexts: [],
            paths: [],
            contextTable: null,
            spaceMap,
            dbExists: false
        }}
    }
    const schemas = Object.values(mdb).map(f => f.schema);
    let cols = mdb[defaultContextSchemaID]?.cols;
    if (!cols || cols.length == 0) {
        cols = defaultContextFields.rows as SpaceProperty[];
    }
    const schema = mdb[defaultContextSchemaID]?.schema ?? defaultContextDBSchema;
    const contextPaths = mdb[defaultContextSchemaID]?.rows?.map(f => f[PathPropertyName]) ?? [];
    
    const missingPaths = paths.filter(f => !contextPaths.includes(f));
    const newPaths = [...orderStringArrayByArray(paths ?? [], contextPaths), ...missingPaths];
    const dependencies = propertyDependencies(cols);
    const rows = [...(mdb[defaultContextSchemaID]?.rows ?? []).filter(f => paths.includes(f[PathPropertyName])), ...missingPaths.map(f => ({[PathPropertyName]: f}))].map(f => linkContextRow(runContext, pathsIndex, spacesMap, f, cols, pathsIndex.get(space.path), dependencies))
    const contextTable : SpaceTable =  {
        schema,
        cols, 
        rows: rows
    } as SpaceTable;

    const contextCols = contextTable.cols?.filter(f => f.type.startsWith('context')) ?? [];
    const linkCols = contextTable.cols?.filter(f => f.type.startsWith('link')) ?? [];
    const contexts = uniq(contextCols.map(f => f.value))
    contextCols.forEach(f => {
        spaceMap[f.name] = {};
        contextTable.rows.forEach(g => {
            parseMultiString(g[f.name]).forEach(h =>
                spaceMap[f.name][h] = [...(spaceMap[f.name][h] ?? []), g[PathPropertyName]]
                )
        });

    })
    
    const outlinks = uniq(contextTable.rows.reduce((p, c) => uniq([...p, ...[...contextCols, ...linkCols].flatMap(f => parseMultiString(c[f.name]).map(f => parseLinkString(f)))]), []))
    const cache : ContextState = {
        contextTable,
        path: space.path,
        contexts: contexts,
        outlinks: outlinks,
        paths: newPaths,
        schemas,
        spaceMap,
        dbExists
    }
    let changed = false;
    if (!_.isEqual(contextTable, mdb[defaultContextSchemaID])) {

        changed = true;
    }
    return {changed, cache}
}


export const parseAllMetadata = (fileCache: Map<string, PathCache>, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>,  oldCache: Map<string, PathState>) : {[key: string]: { changed: boolean, cache: PathState }} => {
    const cache : {[key: string]: { changed: boolean, cache: PathState }} = {};
    for (const [path, _pathCache] of fileCache) {
        const cachePath = settings.enableFolderNote ? spacesCache.get(path)?.space.notePath ?? path : path;
        
        const pathCache = fileCache.get(cachePath) ?? _pathCache;
        if (!_pathCache)
            continue;

        const parent = _pathCache?.parent ?? '';
        const type = _pathCache?.type ?? '';
        const subtype = _pathCache?.subtype ?? '';
        const name = spacesCache.has(path) ? spacesCache.get(path).space.name : _pathCache?.label?.name;
        const oldMetadata = oldCache?.get(path);
        const {changed, cache: metadata} = parseMetadata(path, settings, spacesCache, pathCache, name, type, subtype, parent, oldMetadata);
        cache[path] = { changed, cache: metadata };
    }
    return cache;

}

export const parseMetadata = (path: string, settings: MakeMDSettings, spacesCache: Map<string, SpaceState>,  pathCache: PathCache, name: string, type: string, subtype: string, parent: string, oldMetadata: PathState) : { changed: boolean, cache: PathState }  => {
    const defaultSticker = (
        sticker: string,
        type: string,
        path: string,
      ): string => {
        if (sticker?.length > 0) return sticker;
        if (sticker?.length > 0) return sticker;
        if (type == 'space')
        {
            if (path == 'Spaces/Home') return 'ui//home';
            if (path == "/") return 'ui//vault';
            if (path.startsWith('spaces://')) return "ui//tags";
            return "ui//folder";
        }
      return "ui//file";
      
      };

    const cache : PathState = {  label: pathCache?.label, path: path, name: pathToString(path), readOnly: pathCache?.readOnly };

    const tags : string[] = [];
    const fileTags : string[] = pathCache?.tags?.map(f => f.toLowerCase()) ?? [];
    let hidden = excludePathPredicate(settings, path);
    if (path.startsWith(builtinSpacePathPrefix)) {
        const builtin = path.replace(builtinSpacePathPrefix, '');
        hidden = builtinSpaces[builtin]?.hidden;
        cache.readOnly = builtinSpaces[builtin]?.readOnly;
    }
    const getTagsFromCache = (map: Map<string, SpaceState>, spaces: string[], seen = new Set()) =>{
        const keys : string[] = [];
        
    for (const space of spaces) {
        const valList = (map.get(space)?.contexts as string[] ?? []).map(f => f.toLowerCase());

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
            tags.push(def.toLowerCase());
        }
    }

    

    tags.push(...fileTags)
    if (path == '/') {
        name = settings.systemName;
    }
    const aliases = pathCache?.property ? ensureArray(pathCache.property[settings.fmKeyAlias]) : [];
    const sticker = defaultSticker(pathCache?.label?.sticker, type, path);
    const color = pathCache?.label?.color ?? '';
    
    const outlinks = pathCache?.resolvedLinks ?? []
    
    
    let isSpaceNote = false;
    let spacePath;
    const pathState : PathState = {
        ...cache,
        name,
        tags: uniq(tags),
        type: type, 
        subtype,
        parent,
        label: {
            name: settings.spacesUseAlias && aliases?.length > 0 ? aliases[0] : name,
            sticker,
            color,
            thumbnail: pathCache?.label?.thumbnail ?? '',
            preview: pathCache?.label?.preview ?? '',
        },
        metadata: {
            ...pathCache,
        },
        outlinks
    }

    const spaces : string[] = [];
    const linkedSpaces : string[] = [];
    const liveSpaces : string[] = [];
    if (subtype == 'tag') {
        spaces.push(tagsSpacePath)
    }
    for (const s of tags) {
        spaces.push(tagSpacePathFromTag(s))
    }
    const evaledSpaces = new Set<string>();
    const evalSpace = (s: string, space: SpaceState) => {
        if (evaledSpaces.has(s)) return;
        evaledSpaces.add(s);
        if (space.dependencies?.length > 0) {
            for (const dep of space.dependencies) {
                if (spacesCache.has(dep)) {
                    evalSpace(dep, spacesCache.get(dep))
                }
            }
        }
        if (space.metadata.recursive?.length > 0) {
            if (pathState.path.startsWith(space.path+'/')) {
                if (space.metadata.recursive == 'all') {
                    spaces.push(s);
                    return;
                } else if(space.metadata.recursive == 'file') {
                    if (pathState.type != 'space') {
                        spaces.push(s);
                        return;
                    }
                }

            }
        }
        if (space.space.notePath == path && space.path != space.space.notePath) {
            isSpaceNote = true;
            spacePath = space.path;
            if (settings.enableFolderNote)
                hidden = true;
        }
        if (subtype != 'tag' && subtype != 'default') {
            if (space.space && space.space.path == parent) {
                spaces.push(s)
                return;
            }
        }
        if (space.metadata?.filters?.length > 0) {
            if (pathByDef(space.metadata.filters, {...pathState, spaces}, space.properties)) {
                spaces.push(s);
                liveSpaces.push(s);
                return;
            }
        }
         if (space.metadata?.links?.length  > 0) {
            const spaceItem = (space.metadata?.links ?? []).find(f => f == pathState.path);
            if (spaceItem) {
                spaces.push(s);
                linkedSpaces.push(s);
                return;
            }
        }
    }
    for (const [s, space] of spacesCache) {
        
        evalSpace(s, space);
    }

    const newTags = getTagsFromCache(spacesCache, spaces)
    spaces.push(...newTags.map(f => tagSpacePathFromTag(f)));
    
    
    pathState.tags.push(...newTags)
    if (isSpaceNote)
        {
            pathState.metadata.spacePath = spacePath;
        }
    const metadata : PathState = hidden ? {...pathState, spaces: [], hidden: hidden} : {...pathState, spaces: uniq(spaces), linkedSpaces, liveSpaces, hidden };
    let changed = true;

    if (oldMetadata && _.isEqual(metadata, oldMetadata)) {
        
        changed = false;
    }
    return {changed, cache: metadata }
}