import i18n from "core/i18n";
import { EventDispatcher } from "core/middleware/dispatchers/dispatcher";
import { UIManager } from "core/middleware/ui";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { fileSystemSpaceInfoFromTag } from "core/spaceManager/filesystemAdapter/spaceInfo";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { saveSpaceCache, saveSpaceMetadataValue } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { IndexMap } from "core/types/indexMap";
import { MakeMDSettings } from "core/types/settings";
import { SpaceDefinition, SpaceType, tagsPath, tagsSpace } from "core/types/space";
import { ContextState, FrameState, PathState, SpaceState } from "core/types/superstate";
import { folderForTagSpace, pathIsSpace } from "core/utils/spaces/space";
import { spacePathFromName, tagSpacePathFromTag } from "core/utils/strings";
import { parsePathState } from "core/utils/superstate/parser";
import { serializePathState } from "core/utils/superstate/serializer";
import _ from "lodash";
import { defaultContextSchemaID } from "schemas/mdb";
import { DBRows, SpaceInfo, SpaceProperty } from "types/mdb";

import { CommandsManager } from "core/middleware/commands";
import { buttonNode, cardNode, dividerNode, linkNode, progressNode, rootToFrame } from "schemas/frames";
import { MDBFrame } from "types/mframe";
import { orderArrayByArrayWithKey, uniq } from "utils/array";
import { safelyParseJSON } from "utils/parsers";
import { ensureTag, getAllParentTags } from "utils/tags";
import { insertContextItems, removeLinkInContexts, removePathInContexts, removePathsInContext, removeTagInContexts, renameLinkInContexts, renamePathInContexts, renameTagInContexts, updateContextWithProperties } from "../utils/contexts/context";
import { API } from "./api";
import { LocalCachePersister } from "./localCache/localCache";
import { Manager } from "./workers/manager";
export type PathStateWithRank = PathState & {rank?: number}
export type SuperstateEvent = {
    "pathCreated": { path: string},
    "pathChanged": { path: string, newPath: string},
    "pathDeleted": { path: string},
    "pathStateUpdated": {path: string},
    "spaceChanged": { path: string, newPath: string},
    "spaceDeleted": {path: string},
    "spaceStateUpdated": {path: string },
    "contextStateUpdated": {path: string},
    "frameStateUpdated": {path: string},
    "settingsChanged": null,
    "superstateUpdated": null,
    "superstateReindex": null,
}

export class Superstate {
    public static create( indexVersion: string, onChange: () => void, spaceManager: SpaceManager, uiManager: UIManager, commandsManager: CommandsManager, persister: LocalCachePersister): Superstate {
        return new Superstate(indexVersion, onChange, spaceManager, uiManager, commandsManager, persister);
    }
    
    public initialized: boolean;
    public eventsDispatcher: EventDispatcher<SuperstateEvent>;
public spaceManager: SpaceManager
public settings: MakeMDSettings;
public saveSettings: ()=>void;
public api: API;

    public ui: UIManager
    public commands: CommandsManager
    //Index
    public pathsIndex: Map<string, PathState>
    public spacesIndex: Map<string, SpaceState>
    public contextsIndex: Map<string, ContextState>
    public framesIndex: Map<string, FrameState>
    
    public kit : MDBFrame[] = [rootToFrame(buttonNode), rootToFrame(dividerNode), rootToFrame(progressNode), rootToFrame(cardNode), rootToFrame(linkNode)]
    
    //Persistant Cache
    public vaultDBCache: DBRows
    public iconsCache: Map<string, string>


    public spacesDBLoaded: boolean;
    
    //Maps
    public spacesMap: IndexMap //file to space mapping
    public linksMap: IndexMap //link between paths
    public tagsMap: IndexMap //file to tag mapping
    public superProperties: Map<string, SpaceProperty>
    //Workers
    private contextStateQueue: Promise<void>;
    public indexer: Manager;

    private constructor(public indexVersion: string, public onChange: () => void, spaceManager: SpaceManager, uiManager: UIManager, commandsManager: CommandsManager, private persister: LocalCachePersister) {
        this.eventsDispatcher= new EventDispatcher<SuperstateEvent>();

        //Initialize
        this.initialized = false;
        this.spaceManager = spaceManager;
        this.spaceManager.superstate = this;
        this.ui = uiManager;
        this.commands = commandsManager;
this.api = new API(this);
        //Initiate Indexes
        this.pathsIndex = new Map();
        this.spacesIndex = new Map();
        this.contextsIndex = new Map();
        this.framesIndex = new Map();

        //Initiate Maps
        this.spacesMap = new IndexMap();
        this.linksMap = new IndexMap();
        this.tagsMap = new IndexMap();
        this.superProperties = new Map();
        //Initiate Persistance
        this.iconsCache = new Map();
        this.contextStateQueue = Promise.resolve();

        this.vaultDBCache = [];

        //Intiate Workers
        this.indexer = new Manager(2, this)

        this.loadSuperProperties()
        
        // window['make'] = this;
    }

public loadSuperProperties () {
    this.superProperties.set('$commands', {name: i18n.properties.super.obsidianCommands, schemaId: '$super', type: 'option'});
    this.superProperties.set('$links', {name: i18n.properties.super.links, schemaId: '$super', type: 'option'});
}
public valueForSuperproperty (superProperty: string, property: SpaceProperty) {
    if (superProperty == '$commands') {
        return { options: this.commands.allCommands()}
    } else if (superProperty == '$links') {
        return { options: (this.spaceManager.allPaths()).map(f =>({name: f, value: f}))}
    } else {
        return parseFieldValue(property.value, property.type)
    }
}

    public async initializeIndex () {
        await this.loadFromCache()   
    }

    public addToContextStateQueue(operation: () => Promise<any>) {
        //Simple queue (FIFO) for processing context changes
        this.contextStateQueue = this.contextStateQueue.then(operation).catch(() => {
            //do nuth'ing
        });
    }
    
    public async initialize () {

        const start = Date.now();
    
        if (this.settings.spacesEnabled)
            await this.initializeSpaces();

        await this.initializeTags();
        await this.initializePaths();
        await this.initializeContexts();
        await this.initializeFrames();
        await this.initializeDefaults();
        this.cleanContexts();
        this.dispatchEvent("superstateUpdated", null)
        this.ui.notify(`Make.md - Superstate Loaded in ${(Date.now()-start)/1000} seconds`, 'console');
        
    }
public initializeDefaults () {
    if (this.settings.enableDefaultSpaces) {
        if (this.settings.enableTagSpaces) {
            this.spacesIndex.set(tagsSpace.path, tagsSpace)
            this.pathsIndex.set(tagsPath.path, tagsPath)
        }
        // if (this.settings.enableHomeSpace) {
        //     const homeSpace = createHomeSpace(this.spaceManager);
        //     this.spacesIndex.set(homeSpace.path, homeSpace)
        //     this.pathsIndex.set(homePath.path, homePath)
        // }
    }
    // const vaultSpace = createVaultSpace(this.spaceManager)
    // this.spacesIndex.set(vaultSpace.path, vaultSpace)
    //         this.pathsIndex.set(vaultPath.path, vaultPath)
    //   this.spacesIndex.set(waypointsSpace.path, waypointsSpace)
    //   this.pathsIndex.set(waypointsPath.path, waypointsPath)
}
    public async initializeSpaces() {


        const   allSpaces = [...this.spaceManager.allSpaces().values()]
        const promises = allSpaces.map(f => 

        this.reloadSpace(f, null, true));
        [...this.spacesIndex.keys()].filter(f => !allSpaces.some(g => g.path == f)).forEach(f =>
            this.onSpaceDeleted(f))
            ;
        await Promise.all(promises);

    }

    public  getSpaceItems(spacePath: string, filesOnly?: boolean) : PathStateWithRank[] {
        let items = [];
        const ranks = this.contextsIndex.get(spacePath)?.paths ?? [];
        if (spacePath == 'spaces://$tags')
        {
            items = this.allSpaces().filter(f => f.type == 'tag').filter(f => [...(this.tagsMap.getInverse(f.name) ?? [])].length > 0).map(f => f.path);
        }
        else {
            items = [...this.spacesMap.getInverse(spacePath)]
        }
        
        return items.map<PathStateWithRank>((f, i) => {

            const pathCache = this.pathsIndex.get(f);
  
            return {
              ...pathCache,
              rank: ranks.indexOf(f),
            } as PathStateWithRank;
          })
          .filter((f) => f?.hidden != true)
    }
    private async initializeFrames() {

        const promises = this.allSpaces().filter(f => f.type != 'default').map(f => f.space).map(l => 
        this.reloadFrames(l)
        );
        await Promise.all(promises);

    }

    private async initializeContexts() {
        
        const promises = this.allSpaces().filter(f => f.type != 'default').map(f => f.space).map(l => 
            this.reloadContext(l)
        );

        await Promise.all(promises);
    }

    private async cleanContexts() {
        this.contextsIndex.forEach(context => {
            const contextFiles = [...this.spacesMap.getInverse(context.path)];
            const removeFiles = context.tables?.[defaultContextSchemaID]?.rows.filter(f => !contextFiles.includes(f[PathPropertyName])) ?? [];
            if (removeFiles.length > 0)
            {
                this.addToContextStateQueue(() => removePathsInContext(this.spaceManager, removeFiles.map(f => f[PathPropertyName]), this.spacesIndex.get(context.path).space).then(f => this.reloadSpaceByPath(context.path)))
            }
        })
        this.spacesIndex.forEach(space => {
            const removeFiles = [...this.spacesMap.getInverse(space.path)]
        })
    }

    public async loadFromCache() {
        this.dispatchEvent("superstateReindex", null)
        if (this.settings.indexSVG) {
            const allIcons = await this.persister.loadAll('icon')
            this.spaceManager.allPaths(['svg']).forEach(s => {
                const row = allIcons.find(f => f.path == s);
                if (row?.cache.length > 0)
                    this.iconsCache.set(s, row.cache);
            });
        }
        const allPaths = await this.persister.loadAll('path')
        const allSpaces = await this.persister.loadAll('space');
        const allContexts = await this.persister.loadAll('context')
        const allFrames = await this.persister.loadAll('frame')

        allSpaces.forEach(s => {
            const space = safelyParseJSON(s.cache);
            if (space && space.type)
            {
                this.spacesIndex.set(s.path, space);
            }
        })
        allContexts.forEach(s =>
            {
                const space = safelyParseJSON(s.cache);
            if (space)
            {
                this.contextsIndex.set(s.path, space);

        }
        });
        allFrames.forEach(s => {
            const space = safelyParseJSON(s.cache);
            if (space)
            {
                this.framesIndex.set(s.path, space);

        }
        });
        allPaths.forEach(f => {
            const cache = parsePathState(f.cache)
            
            this.pathsIndex.set(f.path, cache);
            this.tagsMap.set(f.path, new Set(cache.tags))
            this.spacesMap.set(f.path, new Set(cache.spaces))
            this.linksMap.set(f.path, new Set(cache.outlinks))
        });
        
        this.dispatchEvent("superstateUpdated", null)
    }

    public dispatchEvent(event: keyof SuperstateEvent, payload: any) {
        this.eventsDispatcher.dispatchEvent(event, payload);
    }
    public async initializeTags() {
        const allTags = this.spaceManager.readTags().map(f => tagSpacePathFromTag(f));
        const promises = allTags.map(l => this.reloadPath(l, true));
        await Promise.all(promises);
    }
    public async initializePaths() {
        this.dispatchEvent("superstateReindex", null)
        const allFiles = this.spaceManager.allPaths()
        
        const start = Date.now();
        await this.indexer.reload<{[key: string]: {cache: PathState, changed: boolean}}>({ type: 'paths', path: ''}).then(r => {
            for (const [path, {cache, changed}] of Object.entries(r)) {
                this.pathReloaded(path, cache, changed, false);
            }
        });
        this.ui.notify(`Make.md - ${allFiles.length} Paths Cached in ${(Date.now()-start)/1000} seconds`, 'console')
        
        const allPaths = uniq([...this.spaceManager.allSpaces().map(f => f.path), ...allFiles]);
        [...this.pathsIndex.keys()].filter(f => !allPaths.some(g => g == f)).forEach(f =>
            this.onPathDeleted(f))
            ;
        this.dispatchEvent("superstateUpdated", null)
    }


    public async onTagRenamed(tag: string, newTag: string) {

        const oldPath = spacePathFromName(tag);
        const newSpaceInfo = fileSystemSpaceInfoFromTag(this.spaceManager, newTag);
        await this.onSpaceRenamed(oldPath, newSpaceInfo)
        this.dispatchEvent("spaceChanged", { path: oldPath, newPath: newSpaceInfo.path });

        const allContextsWithTag : SpaceInfo[] = [];
        for(const [contextPath, spaceCache] of this.spacesIndex) {
            const contextCache = this.contextsIndex.get(contextPath)
            if (contextCache?.contexts.includes(tag)) {
                this.addToContextStateQueue(() => renameTagInContexts(this.spaceManager, tag, newTag, allContextsWithTag));
            } 
            if (spaceCache.metadata.contexts.includes(tag)) {
                saveSpaceCache(this, spaceCache.space, {...spaceCache.metadata, contexts: spaceCache.metadata.contexts.map(f => f == tag ? newTag : f)})
            }
        }
        
    }

    
    
    public async onTagDeleted(tag: string) {

        this.tagsMap.getInverse(tag).forEach(path => {
                this.deleteTagInPath(tag, path)
        })
        const spacePath = folderForTagSpace(tag, this.settings)
    await this.spaceManager.deletePath(spacePath);
        this.onSpaceDeleted(tagSpacePathFromTag(tag));
        for(const [contextPath, spaceCache] of this.spacesIndex) {
            if (spaceCache.metadata.contexts.includes(tag)) {
                saveSpaceCache(this, spaceCache.space, {...spaceCache.metadata, contexts: spaceCache.metadata.contexts.filter(f => f != tag)})
            }
        }
        const allContextsWithTag : SpaceInfo[] = [];
        for(const [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.contexts.includes(tag)) {
                allContextsWithTag.push(this.spaceManager.spaceInfoForPath(contextCache.path))
            }
        }
        this.addToContextStateQueue(() => removeTagInContexts(this.spaceManager, tag, allContextsWithTag));
    }

    public async deleteTagInPath(tag: string, path: string) {
        let oldMetadata : PathState
        if (this.pathsIndex.has(path)) {
            oldMetadata = this.pathsIndex.get(path)
        }
        if (oldMetadata) {
            const newMetadata = {
                ...oldMetadata,
                tags: oldMetadata.tags.filter(f => f != tag),
                spaces: oldMetadata.spaces.filter(f => f != tagSpacePathFromTag(tag)),
            }
            this.pathsIndex.set(path, newMetadata);
            this.tagsMap.set(path, new Set(newMetadata.tags))
            this.spacesMap.set(path, new Set(newMetadata.spaces))
        } else {
            await this.reloadPath(path);
        }
        this.onPathReloaded(path);
        this.dispatchEvent("pathStateUpdated", { path});
    }

    
    public onMetadataChange(path: string) {
        
        const pathState = this.pathsIndex.get(path);
        if (!pathState) return;
        const allContextsWithFile = pathState.spaces.map(f => this.spacesIndex.get(f)?.space).filter(f => f);   
        this.addToContextStateQueue(() => updateContextWithProperties(this.spaceManager, path, allContextsWithFile));
        this.reloadPath(path).then(f => 
            
            {
                this.dispatchEvent("pathStateUpdated", {path: path})
            }
            );
        
    }

    public reloadSpaceByPath (path: string, metadata?: SpaceDefinition) {
        return this.reloadSpace(this.spaceManager.spaceInfoForPath(path), metadata)
    }

    public async onPathRename(oldPath: string, newPath: string) {
        //assume that space indexer has updated all records properly
        const newFilePath = newPath;
        const oldFileCache = this.pathsIndex.get(oldPath);
        const oldSpaces = oldFileCache.spaces ?? [];
        if (oldFileCache) {
            this.spacesMap.delete(oldPath)
            this.spacesMap.deleteInverse(oldPath)
            this.linksMap.delete(oldPath)
            this.linksMap.deleteInverse(oldPath)
            this.pathsIndex.delete(oldPath);

            const allContextsWithPath = oldSpaces.map(f => this.spacesIndex.get(f)).filter(f => f);
            
            await renamePathInContexts(this.spaceManager, oldPath, newFilePath, allContextsWithPath.map(f => f.space))
            for(const space of allContextsWithPath) {
                if (space.metadata?.links?.includes(oldPath)) {
                    this.addToContextStateQueue(() => saveSpaceMetadataValue(this, space.path, "links", space.metadata.links.map(f => f == oldPath ? newPath : f)))
                }
                await this.reloadContext(space.space)
            }
            const allContextsWithLink : SpaceInfo[] = [];
            for(const [contextPath, contextCache] of this.contextsIndex) {
                if (contextCache.outlinks.includes(oldPath)) {
                    allContextsWithLink.push(this.spacesIndex.get(contextCache.path).space)
                }
            }
            this.addToContextStateQueue(() => renameLinkInContexts(this.spaceManager, oldPath, newFilePath, allContextsWithLink).then(f => Promise.all(allContextsWithLink.map(c => this.reloadContext(c)))))
        }
        
        if (this.settings.waypoints.includes(oldPath)) {
            this.settings.waypoints = this.settings.waypoints.map(f => f == oldPath ? newPath : f)
            this.saveSettings();
            this.dispatchEvent("settingsChanged", null);
        }
        
        await this.reloadPath(newPath)
        
        if (this.spacesIndex.has(oldPath)) {
            await this.onSpaceRenamed(oldPath, this.spaceManager.spaceInfoForPath(newPath))
        }
        const changedSpaces = uniq([...(this.spacesMap.get(newPath) ?? []), ...oldSpaces]);
        //reload contexts to calculate proper paths
        const cachedPromises = changedSpaces.map(f => this.reloadContext(this.spacesIndex.get(f)?.space));
        await Promise.all(cachedPromises);
        changedSpaces.forEach(f => this.dispatchEvent("spaceStateUpdated", { path: f}))
        this.dispatchEvent("pathChanged", { path: oldPath, newPath: newPath});
    }

    public async onPathCreated(path: string) {
        await this.reloadPath(path, true)
        
        this.dispatchEvent("pathCreated", { path});
    }



    public onPathDeleted(path: string) {
        
        
        this.spacesMap.delete(path);
        this.linksMap.delete(path);
        this.linksMap.deleteInverse(path);
        this.persister.remove(path, 'path');
        const fileCache = this.pathsIndex.get(path)

        if (!fileCache) {
            return;
        }
        
          const allContextsWithFile = (fileCache.spaces ?? []).map(f => this.spacesIndex.get(f)?.space).filter(f => f);
          this.addToContextStateQueue(() => removePathInContexts(this.spaceManager, path, allContextsWithFile).then(f => allContextsWithFile.forEach(c => this.reloadContext(c))))
          const allContextsWithLink : SpaceInfo[] = [];
          for(const [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.outlinks.includes(path) && this.spacesIndex.has(contextCache.path)) {
                allContextsWithLink.push(this.spacesIndex.get(contextCache.path).space)
            }
        }
        this.addToContextStateQueue(() => removeLinkInContexts(this.spaceManager, path, allContextsWithLink).then(f => allContextsWithFile.forEach(c => this.reloadContext(c))));

        (fileCache.spaces ?? []).forEach(f => {
            this.dispatchEvent('spaceStateUpdated',{ path: f});
        });
        this.pathsIndex.delete(path);
        this.dispatchEvent('pathDeleted', {path});
    }
    

    public async onSpaceRenamed(oldPath: string, newSpaceInfo: SpaceInfo) {
        if (this.spacesIndex.has(oldPath)) {
            this.spacesIndex.delete(oldPath);
            this.contextsIndex.delete(oldPath)
            this.framesIndex.delete(oldPath)
            await this.reloadSpace(newSpaceInfo);
            await this.reloadContext(newSpaceInfo)
            await this.reloadFrames(newSpaceInfo)
        }
        
        this.spacesMap.rename(oldPath, newSpaceInfo.path)
        this.spacesMap.renameInverse(oldPath, newSpaceInfo.path)
        this.ui.viewsByPath(oldPath).forEach(view => {
            view.openPath(newSpaceInfo.path);
        });
    }
    public onSpaceDeleted(space: string) {

        if (this.spacesIndex.has(space)) {
            this.spacesIndex.delete(space);
            this.contextsIndex.delete(space)
            this.framesIndex.delete(space)
        }
        this.spacesMap.delete(space)
        this.spacesMap.deleteInverse(space)
            this.persister.remove(space, 'space');
            
            this.dispatchEvent('spaceDeleted', {path: space});
        
    }



    public async reloadFrames (space: SpaceInfo) {

        if (!space) return false;
        return this.indexer.reload<{cache: FrameState, changed: boolean}>({ type: 'frames', path: space.path}).then(r => {
            const { changed, cache } = r;
            if (!changed) { return false }
            this.framesIndex.set(space.path, cache)
            this.persister.store(space.path, JSON.stringify(cache), 'frame');
            this.dispatchEvent("frameStateUpdated", {path: space.path});
            return true;
        });
    }
    public async reloadContext (space: SpaceInfo) {
        if (!space) return false;
        return this.indexer.reload<{cache: ContextState, changed: boolean}>({ type: 'context', path: space.path}).then(r => {

            const { changed, cache } = r;
            if (!changed) { return false }
            
            this.contextsIndex.set(space.path, cache)

            const contextPaths = cache.tables?.[defaultContextSchemaID]?.rows.map(f => f[PathPropertyName]) ?? [];
            const missingPaths = cache.paths.filter(f => !contextPaths.includes(f));
            
            const removedPaths = contextPaths.filter(f => !cache.paths.includes(f));

            if (missingPaths.length > 0) {
                this.addToContextStateQueue(() => insertContextItems(this.spaceManager, missingPaths, space.path))
            } 
             if (removedPaths.length > 0) {
                this.addToContextStateQueue(() => removePathsInContext(this.spaceManager, removedPaths, space))
            }
       
        
            this.persister.store(space.path,  JSON.stringify(cache), 'context');
            this.dispatchEvent("contextStateUpdated", {path: space.path});
            
            return true;
        });
    }

    

    

    public allSpaces (ordered?: boolean) : SpaceState[] {
        if (ordered) {
            return orderArrayByArrayWithKey([...this.spacesIndex.values()], this.spaceOrder(), 'path');
        }
        return [...this.spacesIndex.values()]
    }
    public spaceOrder () {
        return [...this.settings.waypoints]
    }

    public allFrames () {
        return [...this.framesIndex.values()].filter(f => f).flatMap(f => f.schemas.filter(f => f.type == 'frame').map(s => ({schema: s, path: f.path})))
    }

    public allListItems () {
        return [...this.framesIndex.values()].filter(f => f).flatMap(f => f.schemas.filter(f => f.type == 'listitem').map(s => ({schema: s, path: f.path})))
    }

public async updateSpaceMetadata (spacePath: string, metadata: SpaceDefinition) {

    const space = this.spacesIndex.get(spacePath);
    if (!space) {
        return this.reloadSpaceByPath(spacePath)
    }
    let reinit = false;

    const spaceSort = metadata?.sort ?? { field: 'rank', asc: true, group: true};
        const sortable = spaceSort.field == "rank";
        if (!_.isEqual(space.metadata.links, metadata.links) || !_.isEqual(space.metadata.filters, metadata.filters)) {
            reinit = true
            
        }
        const newSpaceCache : SpaceState = {
            ...space,
            metadata: metadata,
            contexts: metadata?.contexts ?? [],
            sortable
        };
    this.spacesIndex.set(spacePath,newSpaceCache);
    
    
    if (reinit) {
        await this.initializePaths()
    }
    this.dispatchEvent("spaceStateUpdated", {path: space.path});
    return newSpaceCache;
}    

    public async reloadSpace (space: SpaceInfo, spaceMetadata?: SpaceDefinition, initialized=true) {

        if (!space) return;
        const metadata = spaceMetadata ?? await this.spaceManager.spaceDefForSpace(space.path);

        const type : SpaceType = this.spaceManager.spaceTypeByString(this.spaceManager.uriByString(space.path))
        const spaceSort = metadata?.sort ?? { field: "rank", asc: true, group: true};
        const sortable = (spaceSort.field == "rank" || !spaceSort);
        const contexts = metadata?.contexts ?? []

        if (type == 'tag' && this.settings.autoAddContextsToSubtags) {
            const parentTags = getAllParentTags(space.name);
            contexts.push(...parentTags)
        }

        const cache : SpaceState = {
            name: space.name,
            space: space,
            path: space.path,
            defPath: space.defPath,
            type,
            contexts: contexts.map(f => ensureTag(f)),
            metadata,
            sortable,
        }
        this.spacesIndex.set(space.path, cache);
        this.persister.store(space.path, JSON.stringify(cache), 'space');
        cache.metadata?.links?.forEach(f => {
            if (pathIsSpace(this, f)) {
                this.spacesMap.set(f, new Set([...this.spacesMap.get(f), space.path]))
            }
        })
        if (initialized) {
            this.dispatchEvent("spaceStateUpdated", {path: space.path});
        return cache
        }
        
    }
    private pathReloaded (path: string, cache: PathState, changed: boolean, force: boolean) {

            if (!changed && !force) { return false }

            this.pathsIndex.set(path, cache);
            this.tagsMap.set(path, new Set(cache.tags))
            this.linksMap.set(path, new Set(cache.outlinks))

            if (!_.isEqual(cache.spaces, Array.from(this.spacesMap.get(path)))) {
                this.spacesMap.set(path, new Set(cache.spaces))
                //initiate missing tags
                const promises = cache.tags.map(f => this.spacesIndex.has(tagSpacePathFromTag(f)) ? null : fileSystemSpaceInfoFromTag(this.spaceManager, f)).filter(f => f).map(async f =>  
                    {
                        await this.reloadSpace(f);
                        this.reloadContext(f);
                        await this.reloadPath(f.path);
                        return 
                    }
                );
                const allPromises = Promise.all(promises)
                allPromises.then(f => {
                    this.dispatchEvent("spaceStateUpdated", {path: "spaces://$tags"});
                })
                
            }
            if (force) {
                const allContextsWithFile = cache.spaces.map(f => this.spacesIndex.get(f)?.space).filter(f => f);   

                this.addToContextStateQueue(() => updateContextWithProperties(this.spaceManager, path, allContextsWithFile).then(g => {

                    allContextsWithFile.forEach(f => {
                        this.reloadContext(f);
                        this.dispatchEvent("spaceStateUpdated", {path: f.path})
                    })
                }));
                
            }
            
            if (cache.type == 'svg' && this.settings.indexSVG) {
                this.spaceManager.readPath(path).then(f => {
                    this.iconsCache.set(path, f)
                    this.persister.store(path,  f, 'icon')
                })
            }
            this.onPathReloaded(path);
            
}
    public async reloadPath(path: string, force?: boolean) : Promise<boolean> {

        if (!path) return false;
        
        return this.indexer.reload<{cache: PathState, changed: boolean}>({ type: 'path', path: path}).then(r => {
            this.pathReloaded(path, r.cache, r.changed, force);

            return true;
        });
    }

    public async onPathReloaded(path: string) {
        let pathState : PathState
        if (this.pathsIndex.has(path)) {
            pathState = this.pathsIndex.get(path)
        }
        if (!pathState) {
            return false;
        }
        
        // const missingContexts : SpaceInfo[] = [];
        // const removedContexts : SpaceInfo[] = [];
        // this.contextsIndex.forEach(contextCache => {
        //     if (pathState.spaces.includes(contextCache.path) && !contextCache.paths.includes(path)) {
        //         console.log('missing', contextCache.path, contextCache.paths, path)
        //         missingContexts.push(contextCache.space)
        //     } else if (!pathState.spaces.includes(contextCache.path) && contextCache.paths.includes(path)) {
        //         removedContexts.push(contextCache.space)
        //     }
        // })
        // if (missingContexts.length > 0)
        // {

        //     this.addToContextStateQueue(() => addPathInContexts(this.spaceManager, path, missingContexts).then(f => missingContexts.forEach(c => this.reloadContext(c))))
        // }
        // if (removedContexts.length > 0)
        // {
        //     console.log('removed')
        //     this.addToContextStateQueue(() => removePathInContexts(this.spaceManager, path, removedContexts).then(f => removedContexts.forEach(c => this.reloadContext(c))))
        // }
        this.persister.store(path,  serializePathState(pathState), 'path');
    }
}