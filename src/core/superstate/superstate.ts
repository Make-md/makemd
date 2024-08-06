import { CLIManager } from "core/middleware/commands";
import { EventDispatcher } from "core/middleware/dispatchers/dispatcher";
import { LocalCachePersister } from "core/middleware/types/persister";
import { UIManager } from "core/middleware/ui";
import { fileSystemSpaceInfoFromTag } from "core/spaceManager/filesystemAdapter/spaceInfo";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { saveProperties, saveSpaceCache, saveSpaceMetadataValue } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import { Focus } from "core/types/focus";
import { IndexMap } from "core/types/indexMap";
import { MakeMDSettings } from "core/types/settings";
import { SpaceDefinition, SpaceType, builtinSpaces, tagsSpacePath } from "core/types/space";
import { ContextState, PathState, SpaceState } from "core/types/superstate";
import { buildRootFromMDBFrame } from "core/utils/frames/ast";
import { mdbSchemaToFrameSchema } from "core/utils/frames/nodes";
import { pathByDef } from "core/utils/spaces/query";
import { folderForTagSpace, pathIsSpace } from "core/utils/spaces/space";
import { spacePathFromName, tagSpacePathFromTag } from "core/utils/strings";
import { parsePathState } from "core/utils/superstate/parser";
import { serializePathState } from "core/utils/superstate/serializer";
import _ from "lodash";
import * as math from 'mathjs';
import { rootToFrame } from "schemas/frames";
import { calendarView, dateGroup, eventItem } from "schemas/kits/calendar";
import { cardListItem, cardsListItem, columnGroup, columnView, coverListItem, detailItem, fieldsView, flowListItem, gridGroup, imageListItem, listGroup, listItem, listView, masonryGroup, newItemNode, overviewItem, rowGroup } from "schemas/kits/list";
import { buttonNode, callout, circularProgressNode, dividerNode, fieldNode, linkNode, previewNode, progressNode, ratingNode, tabsNode, toggleNode } from "schemas/kits/ui";
import { mainFrameID } from "schemas/mdb";
import { Command } from "types/commands";
import { Kit } from "types/kits";
import { DBRows, SpaceInfo, SpaceProperty } from "types/mdb";
import { FrameExecutable, FrameRoot, MDBFrames, defaultFrameEditorProps } from "types/mframe";
import { orderArrayByArrayWithKey, uniq } from "utils/array";
import { parseMultiString, safelyParseJSON } from "utils/parsers";
import { ensureTag, getAllParentTags } from "utils/tags";
import { removeLinkInContexts, removePathInContexts, removeTagInContexts, renameLinkInContexts, renamePathInContexts, renameTagInContexts, updateContextWithProperties } from "../utils/contexts/context";
import { API } from "./api";
import { SpacesCommandsAdapter } from "./commands";

import { Metadata } from "core/types/metadata";
import { linkContextRow } from "core/utils/contexts/linkContextRow";
import { formulas } from "core/utils/formula/formulas";
import { allMetadata } from "core/utils/metadata";
import { Indexer } from "./workers/indexer/indexer";

import { Loadout } from "core/react/components/System/SystemSettings";
import { getParentPathFromString } from "utils/path";
import { Searcher } from "./workers/search/search";
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
    "frameStateUpdated": {path: string, schemaId?: string},
    "actionStateUpdated": {path: string},
    "settingsChanged": null,
    "warningsChanged": null,
    "focusesChanged": null,
    "superstateUpdated": null,
    "superstateReindex": null,
}

export type SuperProperty = {
    id: string,
    name: string,
}
export class Superstate {
    public static create( indexVersion: string, onChange: () => void, spaceManager: SpaceManager, uiManager: UIManager, commandsManager: CLIManager): Superstate {
        return new Superstate(indexVersion, onChange, spaceManager, uiManager, commandsManager);
    }
    public formulaContext: math.MathJsInstance;
    public initialized: boolean;
    public eventsDispatcher: EventDispatcher<SuperstateEvent>;
public spaceManager: SpaceManager
public settings: MakeMDSettings;
public saveSettings: ()=>void;
public api: API;

    public ui: UIManager
    public cli: CLIManager
    //Index
    public pathsIndex: Map<string, PathState>
    public spacesIndex: Map<string, SpaceState>
    public contextsIndex: Map<string, ContextState>
    public actionsIndex: Map<string, Command[]>
    public kits: Map<string, Kit>
    public actions: Map<string, Command[]>
    public selectedKit: Kit;
    public kitFrames : Map<string, FrameExecutable>
    public templateCache: Map<string, MDBFrames>

    public loadouts: Loadout[] = []

    public kit : FrameRoot[] = [
        buttonNode, 
        dividerNode, 
        progressNode,
        callout,
        toggleNode,
        eventItem,
        circularProgressNode,
        previewNode,
         linkNode, 
         imageListItem,
        detailItem,
        overviewItem, 
        flowListItem, 
        cardListItem, 
        cardsListItem,
        listItem,
        listGroup, 
        columnGroup,
        masonryGroup,
        listView,
        calendarView,
        dateGroup,
        tabsNode,
        fieldNode,
        gridGroup,
        newItemNode,
        ratingNode,
        fieldsView,
        rowGroup,
        coverListItem,
    columnView]
    
    //Persistant Cache
    public vaultDBCache: DBRows
    public iconsCache: Map<string, string>
    public imagesCache: Map<string, string>


    public spacesDBLoaded: boolean;
    
    //Maps
    public spacesMap: IndexMap //file to space mapping
    public linksMap: IndexMap //link between paths
    public tagsMap: IndexMap //file to tag mapping
    public liveSpaceLinkMap: IndexMap
    //Workers
    public allMetadata: Record<string, {
        name: string,
        properties: Metadata[]
    }>
    private contextStateQueue: Promise<void>;
    public indexer: Indexer;

    public searcher: Searcher;
    public focuses: Focus[];
    private constructor(public indexVersion: string, public onChange: () => void, spaceManager: SpaceManager, uiManager: UIManager, commandsManager: CLIManager) {
        this.eventsDispatcher= new EventDispatcher<SuperstateEvent>();

        const all = {
            ...math.all,
            createAdd: math.factory('add', [], () => function add (a: any, b: any) {
                return a + b
              }),
            createEqual: math.factory('equal', [], () => function equal (a: any, b: any) {
                return a == b
              }),
              createUnequal: math.factory('unequal', [], () => function unequal (a: any, b: any) {
                return a != b
              })
            
        }
        const config :math.ConfigOptions = {
            matrix: "Array"
        }
        const runContext = math.create(all, config)
        runContext.import(formulas, { override: true })
        this.formulaContext = runContext;
        //Initialize
        this.initialized = false;
        this.spaceManager = spaceManager;
        this.spaceManager.superstate = this;
        this.ui = uiManager;
        this.ui.superstate = this;
        this.cli = commandsManager;
        const spaceCommands = new SpacesCommandsAdapter(this.cli, this);
        this.cli.superstate = this;
        this.cli.terminals.splice(0, 0, spaceCommands);
        this.cli.mainTerminal = spaceCommands;
        
        this.allMetadata = {};
        this.api = new API(this);
        //Initiate Indexes
        this.pathsIndex = new Map();
        this.spacesIndex = new Map();
        this.contextsIndex = new Map();
        this.actionsIndex = new Map();
        this.kitFrames = new Map();
        this.kits = new Map();
        this.actions = new Map();
        this.templateCache = new Map();
        this.focuses = [];
        //Initiate Maps
        this.spacesMap = new IndexMap();
        this.linksMap = new IndexMap();
        this.tagsMap = new IndexMap();
        this.liveSpaceLinkMap = new IndexMap();

        //Initiate Persistance
        this.iconsCache = new Map();
        this.imagesCache = new Map();
        this.contextStateQueue = Promise.resolve();

        this.vaultDBCache = [];

        //Intiate Workers
        this.indexer = new Indexer(2, this)

        this.searcher = new Searcher(1, this);
        
        // window['make'] = this;
    }


    public refreshMetadata() {
        this.allMetadata = allMetadata(this)
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
    public persister: LocalCachePersister;
    public async initialize () {
        if (!this.persister) {
            console.log('Cache Persister Not Found');
            return 
        }
        const start = Date.now();
        
        this.initializeActions();
        this.initializeFocuses();
        this.initializeKits();
        this.initializeTemplates();
        if (this.settings.spacesEnabled)
                await this.initializeSpaces();
            
        await this.initializeBuiltins();
        await this.initializeTags();
        await this.initializePaths();
        await this.initializeContexts();
        await this.initializeFrames();
        
        
        this.refreshMetadata();
        this.dispatchEvent("superstateUpdated", null)
        this.ui.notify(`Make.md - Superstate Loaded in ${(Date.now()-start)/1000} seconds`, 'console');
        this.persister.cleanType('space')
        this.persister.cleanType('path')
        this.persister.cleanType('context')
        this.persister.cleanType('frame')
        
    }
    
    public async reloadSystemActions () {
        const libraries = await this.spaceManager.readSystemCommands();
        libraries.forEach(f => this.actions.set(f.name, f.commands));
        this.dispatchEvent("actionStateUpdated", {path: "spaces://$actions"})
    }
    public async initializeActions () {
        await this.reloadSystemActions();
        const promises = this.allSpaces().filter(f => f.type != 'default').map(f => f.space).map(l => 
            this.reloadActions(l)
            );
            await Promise.all(promises);
        
    }
    public async initializeKits () {
        const kits = await this.spaceManager.readAllKits();
        kits.forEach(f => this.kits.set(f.id, f));
        if (kits.length == 0) {
            this.kits.set('default', {
                id: 'default',
                name: 'Default',
                colors: {
                },
                frames: []
            })
        }
        this.selectedKit = this.kits.get(this.settings.selectedKit) ?? this.kits.get('default');
        this.selectedKit.frames = [...this.selectedKit.frames, ...this.kit.map(f => (rootToFrame(f))).filter(f => !this.selectedKit.frames.some(g => g.schema.id == f.schema.id))]
        for (const v of this.selectedKit.frames) {
            const kitID = mdbSchemaToFrameSchema(v.schema).def.id;
            const frame = await buildRootFromMDBFrame(this, v, {...defaultFrameEditorProps, screenType: this.ui.getScreenType()})
            this.kitFrames.set(kitID, frame)
            
        }
        this.dispatchEvent("frameStateUpdated", {path: `spaces://$kit`})
    }

    public async initializeTemplates () {
        const allTemplates = await this.spaceManager.readAllTemplates()
        Object.keys(allTemplates).forEach(f => {
            this.templateCache.set(f, allTemplates[f])
        });
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
        const items = [...this.spacesMap.getInverse(spacePath)]
        const ranks = this.contextsIndex.get(spacePath)?.paths ?? [];
        
        
        return items.map<PathStateWithRank>((f, i) => {

            const pathCache = this.pathsIndex.get(f);
  
            return {
              ...pathCache,
              rank: ranks.indexOf(f),
            } as PathStateWithRank;
          })
          .filter((f) => f?.hidden != true && f.path != spacePath)
    }
    private async initializeFrames() {
        await this.initializeTemplates();
    }

    private async initializeContexts() {
        
        await this.indexer.reload<Map<string, {cache: ContextState, changed: boolean}>>({ type: 'contexts', path: ''}).then(async r => {
            const promises = [...r.entries()].map(([path, {cache, changed}]) => this.contextReloaded(path, cache, changed));
            await Promise.all(promises);
        });

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

    public async initializeBuiltins() {
        const allBuiltins = builtinSpaces;
        const promises = Object.keys(allBuiltins).map(f => this.reloadPath("spaces://$"+f, true));
        await Promise.all(promises);
    }
    
    public async initializeTags() {

        const allTags = this.spaceManager.readTags().map(f => tagSpacePathFromTag(f));
        const promises = [...allTags].map(l => this.reloadPath(l, true));
        await Promise.all(promises);
    }

    public async onSpaceDefinitionChanged (space: SpaceState, oldDef?: SpaceDefinition) {
        if (space.space.readOnly) return;
        const currentPaths = this.spacesMap.getInverse(space.path);
        const newPaths : string[] = [];
        if (space.metadata?.links && !_.isEqual(space.metadata.links, oldDef?.links)) {
            newPaths.push(...(space.metadata.links))
        }
        if (space.metadata?.filters?.length > 0) {

            const hasProps = space.metadata.filters.some(f => f.filters.some(g => g.fType == 'property'))
            
            if (!_.isEqual(space.metadata?.filters, oldDef?.filters) || hasProps)
            {
                for (const [k, f] of this.pathsIndex) {
                if (!f.hidden && pathByDef(space.metadata?.filters, f, space.properties)) {
                  newPaths.push(k);
                }
              }
            }
        }
        const diff = [..._.difference(newPaths, [...currentPaths]), ..._.difference([...currentPaths], newPaths)];
        const cachedPromises = diff.map(f => this.reloadPath(f, true).then(g => this.dispatchEvent("pathStateUpdated", {path: f})));
        await Promise.all(cachedPromises)
        
    }

    public async initializeFocuses() {
        const allFocuses = await this.spaceManager.readFocuses();
        if (allFocuses.length == 0) {
            this.spaceManager.saveFocuses([{name: "Home", sticker: "ui//home", paths: ['/']}]);
            return;
        }
        this.focuses = allFocuses;
        this.dispatchEvent("focusesChanged", null);
    }

    public async initializePaths() {
        this.dispatchEvent("superstateReindex", null)
        const allFiles = this.spaceManager.allPaths()
        
        const start = Date.now();
        await this.indexer.reload<{[key: string]: {cache: PathState, changed: boolean}}>({ type: 'paths', path: ''}).then(async r => {
            for await (const [path, {cache, changed}] of Object.entries(r)) {
                await this.pathReloaded(path, cache, changed, false);
                
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
        await this.onPathRename(oldPath, newSpaceInfo.path)
        this.dispatchEvent("spaceChanged", { path: oldPath, newPath: newSpaceInfo.path });

        const allContextsWithTag : SpaceInfo[] = [];
        for(const [contextPath, spaceCache] of this.spacesIndex) {
            const contextCache = this.contextsIndex.get(contextPath)
            if (contextCache?.contexts.includes(tag)) {
                this.addToContextStateQueue(() => renameTagInContexts(this.spaceManager, tag, newTag, allContextsWithTag));
            } 
            if (spaceCache.metadata?.contexts.includes(tag)) {
                saveSpaceCache(this, spaceCache.space, {...spaceCache.metadata, contexts: spaceCache.metadata.contexts.map(f => f == tag ? newTag : f)})
            }
        }
        this.dispatchEvent("spaceStateUpdated", { path: tagsSpacePath});
        
    }

    
    
    public async onTagDeleted(tag: string) {

        this.tagsMap.getInverse(tag).forEach(path => {
                this.deleteTagInPath(tag, path)
        })
        const spacePath = folderForTagSpace(tag, this.settings)
    await this.spaceManager.deletePath(spacePath);
        this.onSpaceDeleted(tagSpacePathFromTag(tag));
        for(const [contextPath, spaceCache] of this.spacesIndex) {
            if (spaceCache.metadata?.contexts.includes(tag)) {
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
        this.dispatchEvent("spaceStateUpdated", { path: tagsSpacePath});
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
        
        
        
        if (!this.pathsIndex.has(path)) {return}
        this.reloadPath(path).then(f => 
            
            {
                const pathState = this.pathsIndex.get(path);
                const spaceState = this.spacesIndex.get(path);
                if (spaceState) {
                    this.reloadSpace(spaceState.space).then(f => this.onSpaceDefinitionChanged(f, spaceState.metadata))

                }
                const allContextsWithFile = pathState.spaces.map(f => this.spacesIndex.get(f)?.space).filter(f => f);   
        this.addToContextStateQueue(() => updateContextWithProperties(this, path, allContextsWithFile).then(() => {
            allContextsWithFile.forEach(f => {
                this.dispatchEvent("contextStateUpdated", {path: f.path})
            })
        }));
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
        const oldSpaces = oldFileCache?.spaces ?? [];
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
                await this.reloadContext(space.space, true)
            }
            const allContextsWithLink : SpaceInfo[] = [];
            for(const [contextPath, contextCache] of this.contextsIndex) {
                if (contextCache.outlinks.includes(oldPath)) {
                    allContextsWithLink.push(this.spacesIndex.get(contextCache.path).space)
                }
            }
            this.addToContextStateQueue(() => renameLinkInContexts(this.spaceManager, oldPath, newFilePath, allContextsWithLink).then(f => Promise.all(allContextsWithLink.map(c => this.reloadContext(c, true)))))
        }
        
        let focusChanged = false;
        this.focuses.forEach(focus => {
            if (focus.paths.includes(oldPath)) {
                focus.paths = focus.paths.map(f => f == oldPath ? newPath : f)
                focusChanged = true;
            }
        })
        if (focusChanged) {
            await this.spaceManager.saveFocuses(this.focuses);
            this.dispatchEvent("focusesChanged", null)
        }
        
        
        await this.reloadPath(newPath, true)
        
        
        const changedSpaces = uniq([...(this.spacesMap.get(newPath) ?? []), ...oldSpaces]);
        //reload contexts to calculate proper paths
        const cachedPromises = changedSpaces.map(f => this.reloadContext(this.spacesIndex.get(f)?.space));
        await Promise.all(cachedPromises);

        changedSpaces.forEach(f => this.dispatchEvent("spaceStateUpdated", { path: f}))
        this.dispatchEvent("pathChanged", { path: oldPath, newPath: newPath});

        this.ui.viewsByPath(oldPath).forEach(view => {
            view.openPath(newPath);
        });
    }

    public async onPathCreated(path: string) {
        
        await this.reloadPath(path, true)
        const parent = getParentPathFromString(path);
        if (this.spacesIndex.has(parent) && this.spacesIndex.get(parent).space.notePath == path) {
            await this.reloadSpace(this.spacesIndex.get(parent).space)
        }
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
            const oldmetadata = this.spacesIndex.get(oldPath).metadata;
            this.spacesIndex.set(newSpaceInfo.path, {
                ...this.spacesIndex.get(oldPath),
                path: newSpaceInfo.path,
                name: newSpaceInfo.name,
                space: newSpaceInfo
            });
            this.spacesMap.rename(oldPath, newSpaceInfo.path);
            this.spacesMap.renameInverse(oldPath, newSpaceInfo.path);
            this.spacesIndex.delete(oldPath);
            this.contextsIndex.delete(oldPath);
            this.actionsIndex.delete(oldPath);
            await this.reloadSpace(newSpaceInfo, oldmetadata).then(f => this.onSpaceDefinitionChanged(f, oldmetadata))
            await this.reloadContext(newSpaceInfo, true);
            await this.reloadActions(newSpaceInfo);
        }
        
        
    }
    public onSpaceDeleted(space: string) {

        if (this.spacesIndex.has(space)) {
            this.spacesIndex.delete(space);
            this.contextsIndex.delete(space)
        }
        this.spacesMap.delete(space)
        this.spacesMap.deleteInverse(space)
            this.persister.remove(space, 'space');
            
            this.dispatchEvent('spaceDeleted', {path: space});
        
    }

    public async reloadActions (space: SpaceInfo) {
        if (!space) return false;
            this.spaceManager.commandsForSpace(space.path).then(r => {
                this.actionsIndex.set(space.path, r);
                this.dispatchEvent("actionStateUpdated", {path: space.path});
            });
    }

    
    public async reloadContextByPath (path: string, force?: boolean) {
        return this.reloadContext(this.spaceManager.spaceInfoForPath(path), force)
    }
    public async reloadContext (space: SpaceInfo, force?: boolean) {
        
        if (!space) return false;

        return this.indexer.reload<{cache: ContextState, changed: boolean}>({ type: 'context', path: space.path}).then(r => {

            return this.contextReloaded(space.path, r.cache, r.changed, force);
        });
    }

    

    public async contextReloaded(path: string, cache: ContextState, changed: boolean, force?: boolean) {
            if (!changed && !force) { return false }
            this.contextsIndex.set(path, cache);
            const pathState = this.pathsIndex.get(path);
            if (pathState && cache.dbExists && !pathState.readOnly) {
                if (this.settings.syncFormulaToFrontmatter) {
                    const allRows = cache.contextTable?.rows ?? [];
                    const allColumns = cache.contextTable?.cols ?? [];
                    const updatedValues = allRows.filter(f => {
                        const path = f[PathPropertyName];
                        const pathCache = this.pathsIndex.get(path);
                        
                        if (!pathCache) {
                            return false;
                        }
                        if (pathCache.type == 'file' && pathCache.subtype != 'md') return false
                        return allColumns.reduce((acc, col, i) => {
                                if (acc) return acc;
                                if (col.type  != 'fileprop' || col.primary == 'true') return acc;
                                if (f[col.name]?.length > 0 && pathCache.metadata?.property?.[col.name] != f[col.name]) return true;
                                return acc;
                            }, false)
                        })
                    if (updatedValues.length > 0) {

                        updatedValues.forEach(f => saveProperties(this, f[PathPropertyName], allColumns.reduce((acc, col, i) => {
                            if (col.type  == 'fileprop' && col.primary != 'true') {
                                return {...acc, [col.name]: f[col.name]};
                            }
                            return acc;
                        }, {})));
                    }    
                }

            }
            if (cache.dbExists && changed)
                await this.spaceManager.saveTable(path, cache.contextTable);
            this.persister.store(path,  JSON.stringify(cache), 'context');
            this.dispatchEvent("contextStateUpdated", {path: path});
            
            return true;
    }

    public allSpaces (ordered?: boolean) : SpaceState[] {
        if (ordered) {
            return orderArrayByArrayWithKey([...this.spacesIndex.values()], this.spaceOrder(), 'path');
        }
        return [...this.spacesIndex.values()]
    }
    public spaceOrder () {
        return [...this.focuses.flatMap(f => f.paths)]
    }

    

    

public async updateSpaceMetadata (spacePath: string, metadata: SpaceDefinition) {

    const space = this.spacesIndex.get(spacePath);
    const oldDef = space?.metadata
    if (!space) {
        return this.reloadSpaceByPath(spacePath)
    }
    let spaceDefChanged = false;

    const spaceSort = metadata?.sort ?? { field: 'rank', asc: true, group: true};
        const sortable = spaceSort.field == "rank";
        if (!_.isEqual(space.metadata.links, metadata.links) || !_.isEqual(space.metadata.filters, metadata.filters)) {
            spaceDefChanged = true
            
        }
        const newSpaceCache : SpaceState = {
            ...space,
            metadata: metadata,
            contexts: metadata?.contexts ?? [],
            sortable
        };
    this.spacesIndex.set(spacePath,newSpaceCache);
    
    
    if (spaceDefChanged) {
        await this.onSpaceDefinitionChanged(newSpaceCache, oldDef)
    }
    this.dispatchEvent("spaceStateUpdated", {path: space.path});
    return newSpaceCache;
}    

    public async reloadSpace (space: SpaceInfo, spaceMetadata?: SpaceDefinition, initialized=true) {
        
        if (!space) return;
        
        const metadata = spaceMetadata ?? await this.spaceManager.spaceDefForSpace(space.path);

        let pathState = this.pathsIndex.get(space.path);
        const type : SpaceType = this.spaceManager.spaceTypeByString(this.spaceManager.uriByString(space.path))
        if (type == 'default' || type == 'tag') {
            metadata.filters = [];
            metadata.links = [];
        }
        const propertyTypes : SpaceProperty[] = [];
        let properties = {};
        
        const frameProps = await this.spaceManager.readFrame(space.path, mainFrameID).then(f => f?.cols ?? []);
        propertyTypes.push(...frameProps)
        
        if(propertyTypes.length > 0)
        {
            if (!pathState) {
                if (!this.settings.enableFolderNote) {
                    const pathCache = await this.spaceManager.readPathCache(space.path);
                pathState = {
                    path: space.path,
                    name: space.name,
                    tags: [],
                    spaces: [],
                    outlinks: [],
                    readOnly: space.readOnly,
                    hidden: false,
                    metadata: pathCache?.metadata,
                    type: 'space',
                    subtype: type,
                    label: pathCache?.label,
                }
                } else {

                const pathCache = await this.spaceManager.readPathCache(space.notePath);
                pathState = {
                    path: space.path,
                    name: space.name,
                    tags: [],
                    spaces: [],
                    outlinks: [],
                    readOnly: space.readOnly,
                    hidden: false,
                    metadata: pathCache?.metadata,
                    type: 'space',
                    subtype: type,
                    label: pathCache?.label,
                }
            }
            }
            properties = await this.spaceManager.readProperties(space.notePath).then(f => linkContextRow(this.formulaContext, this.pathsIndex, f, propertyTypes, pathState));
        }
   
        [...this.spacesMap.get(space.path)].map(f => this.contextsIndex.get(f)).forEach((f) => {
            if (f) {
                const contextProps = f.contextTable?.cols ?? [];
                propertyTypes.push(...contextProps)
                properties = {...properties, ...f.contextTable?.rows.find(g => g[PathPropertyName] == space.path) ?? {}}
            }
        })

        const spaceSort = metadata?.sort ?? { field: "rank", asc: true, group: true};
        const sortable = (spaceSort.field == "rank" || !spaceSort);
        const contexts : string[] = metadata?.contexts ?? []

        const dependencies = uniq((metadata.filters ?? []).flatMap(f => f.filters).flatMap(f =>  f.type == 'context' ? [f.field.split('.')[0]] : f.type == 'path' && f.field == 'space' ? parseMultiString(f.value) : []));
        const linkDependencies = uniq((metadata.filters ?? []).flatMap(f => f.filters).flatMap(f =>  f.type.startsWith('link') ? parseMultiString(f.value) : []));
        if (type == 'tag' && this.settings.autoAddContextsToSubtags) {
            const parentTags = getAllParentTags(space.name);
            contexts.push(...parentTags)
        }

        const templates = await this.spaceManager.readTemplates(space.path)
        const cache : SpaceState = {
            name: space.name,
            space: space,
            path: space.path,
            type,
            templates,
            contexts: contexts.map(f => ensureTag(f)),
            metadata,
            dependencies,
            sortable,
            properties,
            propertyTypes
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
    private async pathReloaded (path: string, cache: PathState, changed: boolean, force: boolean) {

            this.pathsIndex.set(path, cache);
            await this.onPathReloaded(path);
            if (cache.subtype == 'image' || cache.metadata?.file?.extension == 'svg') {
                this.imagesCache.set(cache.metadata.file.filename, path);
            }
            if (!changed && !force) { return false }
            
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
                    this.dispatchEvent("spaceStateUpdated", {path: tagsSpacePath});
                })
                
            }
            if (force) {

                const allContextsWithFile = cache.spaces.map(f => this.spacesIndex.get(f)?.space).filter(f => f);   

                this.addToContextStateQueue(() => updateContextWithProperties(this, path, allContextsWithFile).then(g => {

                    allContextsWithFile.forEach(f => {
                        this.reloadContext(f);
                        this.dispatchEvent("spaceStateUpdated", {path: f.path})
                    })
                }));
                
            }
            
            if (cache.metadata?.file?.extension == 'svg' && this.settings.indexSVG) {
                this.spaceManager.readPath(path).then(f => {
                    this.iconsCache.set(path, f)
                    this.persister.store(path,  f, 'icon')

                })
            }
            
            
}
    public async reloadPath(path: string, force?: boolean) : Promise<boolean> {

        if (!path) return false;
        
        return this.indexer.reload<{cache: PathState, changed: boolean}>({ type: 'path', path: path}).then(async r => {

            await this.pathReloaded(path, r.cache, r.changed, force);

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
        
        await this.persister.store(path,  serializePathState(pathState), 'path');
    }
}