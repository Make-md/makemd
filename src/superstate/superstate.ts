import { format } from "date-fns";
import _, { debounce } from "lodash";
import MakeMDPlugin from "main";
import { App, Component, MetadataCache, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { Space, SpaceItem, spaceItemsSchema, spaceSchema, vaultSchema } from "schemas/spaces";
import { initiateDB, insertSpaceAtIndex, rebuildIndex } from "superstate/spacesStore/spaces";
import { ContextsMetadataCache, FileMetadataCache, SpaceCache } from "types/cache";
import { ContextInfo } from "types/contextInfo";
import { IndexMap } from "types/indexMap";
import { DBRows, DBTables } from "types/mdb";
import { SpaceChange } from "types/types";
import { uniq } from "utils/array";
import { folderContextFromFolder, spaceContextFromSpace, tagContextFromTag } from "utils/contexts/contexts";
import { dbResultsToDBTables, getDB, saveDBToPath, selectDB } from "utils/db/db";
import { getAbstractFileAtPath, getAllAbstractFilesInVault, getFolderPathFromString, getParentPathFromString, tFileToAFile } from "utils/file";
import { isFolderNote } from "utils/foldernote";
import { safelyParseJSON } from "utils/json";
import { tagPathToTag } from "utils/metadata/tags";
import { parseSpace } from "utils/parser";
import { folderPathFromFolderNoteFile, spaceContextPathFromName } from "utils/strings";
import { parseFileCache } from "utils/superstate/parser";
import { serializeFileCache } from "utils/superstate/serializer";
import { addFileInContexts, onMetadataChange, removeFileInContexts, removeFilesInContext, removeLinkInContexts, removeTagInContexts, renameFileInContexts, renameLinkInContexts, renameTagInContexts } from "../dispatch/mdb";
import { dispatchSpaceDatabaseFileChanged } from "../dispatch/spaces";
import { parseSpaceCache } from "./cacheParsers";
import { LocalStorageCache } from "./localCache/localCache";
import { Manager } from "./workers/manager";

const parentChanged = (oldPath: string, newPath: string) => {
    const oldFolderPath = getParentPathFromString(oldPath);
    const newFolderPath = getParentPathFromString(newPath);
    return oldFolderPath != newFolderPath
  }

const loadContexts = (plugin: MakeMDPlugin, spaces: Space[]) : ContextInfo[] => {
    const getAllTagContextFiles = (plugin: MakeMDPlugin) : ContextInfo[] => {
    const folder =
    plugin.settings.tagContextFolder == ""
      ? app.vault.getRoot()
      : (getAbstractFileAtPath(
          app,
          getFolderPathFromString(plugin.settings.tagContextFolder)
        ) as TFolder);
        const allcontexts = folder?.children
        .filter(
          (f) =>
            f instanceof TFile && f.extension == "mdb" && f.name.charAt(0) == "#"
        ).map(f => tagContextFromTag(plugin, tagPathToTag(f.name))) as ContextInfo[] ?? [];
  return allcontexts
      }
      const getAllSpaceContextFiles = (plugin: MakeMDPlugin, spaces: Space[]) : ContextInfo[] => {
        const folder =
        plugin.settings.tagContextFolder == ""
          ? app.vault.getRoot()
          : (getAbstractFileAtPath(
              app,
              getFolderPathFromString(plugin.settings.tagContextFolder)
            ) as TFolder);
            const allcontexts = folder?.children
            .filter(
              (f) =>
                f instanceof TFile && f.extension == "mdb" && spaces.some(s => s.name == f.basename)
            ).map(f => spaceContextFromSpace(plugin, spaceContextPathFromName((f as TFile).basename))) as ContextInfo[] ?? [];
      return allcontexts
          }
      const getAllFolderContextFiles = (plugin: MakeMDPlugin) => {
        let files: TFile[] = [];
        let rootFolder = app.vault.getRoot();
        function recursiveFx(folder: TFolder) {
            for (let child of folder.children) {
            if (child instanceof TFolder) {
                let childFolder: TFolder = child as TFolder;
                if (childFolder.children) recursiveFx(childFolder);
            }
            if (child instanceof TFile && child.basename == plugin.settings.folderContextFile && child.path != '/')
                files.push(child);
            }
        }
        recursiveFx(rootFolder);
        return files.map(f => folderContextFromFolder(plugin, f.parent.path));
      }
      return [...getAllTagContextFiles(plugin), ...getAllFolderContextFiles(plugin), ...getAllSpaceContextFiles(plugin, spaces)]
}



export class Superstate extends Component {
    public static create(app: App, indexVersion: string, onChange: () => void, plugin: MakeMDPlugin): Superstate {
        return new Superstate(app, indexVersion, onChange, plugin);
    }
    public initialized: boolean;

    public plugin: MakeMDPlugin;

    //Obsidian Cache
    public vault: Vault;
    public metadataCache: MetadataCache;

    //Index
    public filesIndex: Map<string, FileMetadataCache>
    public contextsIndex: Map<string, ContextsMetadataCache>
    public spacesIndex: Map<string, SpaceCache>

    //Persistant Cache
    public vaultDBCache: DBRows
    public spacesDBCache: DBRows
    public spacesItemsDBCache: DBRows
    public persister: LocalStorageCache;
    public syncStatus: number;
    public spacesDBLoaded: boolean;

    //Maps
    public spacesMap: IndexMap //file to space mapping
    public linksMap: IndexMap //link between files
    public iconsCache: Map<string, string>
    public tagsMap: IndexMap //file to tag mapping
    public contextsMap: IndexMap //file to context mapping

    //Workers
    private contextStoreQueue: Promise<void>;
    public indexer: Manager;

    private constructor(public app: App, public indexVersion: string, public onChange: () => void, plugin: MakeMDPlugin) {
        super();

        //Initialize
        this.initialized = false;
        this.plugin = plugin;
        this.metadataCache = app.metadataCache;

        //Initiate Indexes
        this.filesIndex = new Map();
        this.spacesIndex = new Map();
        this.contextsIndex = new Map();

        //Initiate Maps
        this.spacesMap = new IndexMap();
        this.linksMap = new IndexMap();
        this.tagsMap = new IndexMap();
        this.contextsMap = new IndexMap();

        //Initiate Persistance
        this.iconsCache = new Map();
        this.contextStoreQueue = Promise.resolve();
        this.vaultDBCache = [];
        this.spacesItemsDBCache = [];
        this.spacesDBCache = [];
        this.syncStatus = 0;
        //@ts-ignore
        this.persister = new LocalStorageCache(app.appId || "shared", indexVersion);
        //Intiate Workers
        this.addChild((this.indexer = new Manager(2, this)));
    }

    public async initializeIndex () {
        await Promise.race([new Promise((resolve) => setTimeout(resolve, 1000)), this.loadFromCache()])
        this.loadSpacesDatabaseFromDisk();
    }



    private addToContextStoreQueue(operation: () => Promise<any>) {
        //Simple queue (FIFO) for processing context changes
        this.contextStoreQueue = this.contextStoreQueue.then(operation).catch(() => {});
    }

    public async resolveSpacesDatabaseSync () {
        //Wait and Resolve Conflicts in Spaces Database Update Time
        if (this.plugin.settings.spacesSyncLastUpdated.length > 0) {
            const waitIfSpacesFileStillSyncing = async (timeout: number) : Promise<boolean> => {
                const incomingSpaceTime = parseInt(await app.vault.read(getAbstractFileAtPath(app, this.plugin.settings.spacesSyncLastUpdated) as TFile));
                const currentSpaceTime = this.plugin.spacesDBLastModify;
                const spaceFileTime = (await app.vault.adapter.stat(this.plugin.spacesDBPath))?.mtime
                if (Math.floor(incomingSpaceTime/1000) != Math.floor(spaceFileTime/1000)) {
                    await sleep(timeout);
                    return false;
                }
                return true;
            }

            const resolverFile = getAbstractFileAtPath(app, this.plugin.settings.spacesSyncLastUpdated);
            if (!resolverFile) {
                await this.updateSpaceLastUpdated();
            } else {
                let counter = 0;
                let spacesReady = await waitIfSpacesFileStillSyncing(500);
                if (!spacesReady) {
                    this.syncStatus = 1;
                    this.broadcast('sync')
                }
                while (!spacesReady && counter++ <= this.plugin.settings.spacesSyncTimeoutSeconds*2) {
                    spacesReady = await waitIfSpacesFileStillSyncing(500)
                }
                this.syncStatus = 0;
                this.broadcast('sync')
            }
            // if (currentSpaceTime == 0) {
            //     //first load considerations
            //     if (incomingSpaceTime > 0 && !(await app.vault.adapter.exists(normalizePath(this.plugin.spacesDBPath)))) {
            //         //space file should exist is missing, wait or create new one
            //     }
            // } else if (currentSpaceTime < incomingSpaceTime) {
            //     console.log('current space older than incoming space')
            //     //do as normal
            // } else if (currentSpaceTime > incomingSpaceTime) {
            //     console.log('current space newer than incoming space')
            //     //synced older version
            // }
        }
    }


      public async loadSpacesDatabaseFromDisk () {
        //Load Spaces Database File
        if (this.plugin.settings.spacesEnabled) {
                await this.resolveSpacesDatabaseSync();

            const db = await getDB(await this.plugin.sqlJS(), this.plugin.spacesDBPath);
            const tables = dbResultsToDBTables(
                db.exec(
                "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
                )
            );
            if (tables.length == 0) {
                initiateDB(db);
                await saveDBToPath(this.plugin, this.plugin.spacesDBPath, {
                    vault: vaultSchema,
                    spaces: spaceSchema,
                    spaceItems: spaceItemsSchema,
                }).then(f => this.updateSpaceLastUpdated())
            }
            this.vaultDBCache = selectDB(db, "vault")?.rows ?? []
            this.spacesItemsDBCache = selectDB(db, "spaceItems")?.rows ?? []
            this.spacesDBCache = selectDB(db, "spaces")?.rows ?? []
            db.close();
            this.spacesDBLoaded = true;

            this.spacesDBCache.forEach(f => this.reloadSpace(f.name, false))
            if (!this.plugin.settings.precreateVaultSpace || this.spacesDBCache.length == 0) {
                insertSpaceAtIndex(
                    this.plugin,
                    {
                      name: this.plugin.app.vault.getName(),
                      pinned: "home",
                      def: { type: "focus", folder: '/', filters: [] },
                    },
                    this.spacesDBCache.length
                  );
                  this.plugin.settings.precreateVaultSpace = true;
                  this.plugin.saveSettings();
            }
        }
        rebuildIndex(this.plugin, true);

      }

      public async updateSpaceLastUpdated () {
        if (this.plugin.settings.spacesSyncLastUpdated.length > 0) {
            return app.vault.adapter.stat(this.plugin.spacesDBPath).then((f) => {
                if (f)
                {
                    this.plugin.spacesDBLastModify = f.mtime;
                    const resolverFile = getAbstractFileAtPath(app, this.plugin.settings.spacesSyncLastUpdated);
                    if (!resolverFile) {
                        return app.vault.create(this.plugin.settings.spacesSyncLastUpdated, f.mtime.toString()).then(f => {})
                    }
                    return app.vault.modify(getAbstractFileAtPath(app, this.plugin.settings.spacesSyncLastUpdated) as TFile, f.mtime.toString())
                }
            });
        }
      }
    public async saveSpacesDatabaseToDisk (tables: DBTables, save=true) {
        if (await app.vault.adapter.exists(normalizePath(this.plugin.spacesDBPath)) && !this.spacesDBLoaded) {
            return;
        }
        this.spacesDBLoaded = true;
        if (tables.vault) this.vaultDBCache = tables.vault.rows
            if (tables.spaceItems) this.spacesItemsDBCache = tables.spaceItems.rows
            if (tables.spaces) this.spacesDBCache = tables.spaces.rows
            if (save && this.plugin.settings.spacesEnabled && this.syncStatus == 0) {
                this.debounceSaveSpaceDatabase(tables);
            }

    }
    private debounceSaveSpaceDatabase = debounce(
        (tables: DBTables) => {
        saveDBToPath(this.plugin, this.plugin.spacesDBPath, tables).then(f => {this.updateSpaceLastUpdated(); this.backupSpaceDB(true);})
    }, 1000,
    {
        leading: false,
      })

    public async initialize () {

        const start = Date.now();
        if (this.plugin.settings.spacesEnabled)
            await this.initializeSpaces();
        await this.initializeContexts();

        await this.initalizeFiles();
        this.cleanContexts();
        console.log(`Make.md Superstate: ${Date.now()-start} ms`);
    }

    public async initializeSpaces() {
        this.spacesIndex = new Map()
        const promises = this.spacesDBCache.map(f => this.reloadSpace(f.name, true));
        await Promise.all(promises);
    }

    private async initializeContexts() {
        const allContexts = loadContexts(this.plugin, this.allSpaces());
        const promises = allContexts.map(l => this.reloadContext(l));
        await Promise.all(promises);
    }

    private async cleanContexts() {
        this.contextsIndex.forEach(context => {
            const contextFiles = [...this.contextsMap.getInverse(context.info.contextPath)];
            const removeFiles = context.files.filter(f => !contextFiles.includes(f));
            if (removeFiles.length > 0)
            this.addToContextStoreQueue(() => removeFilesInContext(this.plugin, removeFiles, context.info).then(f => this.reloadContext(context.info)))
        })
        this.spacesIndex.forEach(space => {
            const removeFiles = [...this.spacesMap.getInverse(space.name)]
        })
    }

    public async loadFromCache() {

        const allFiles = getAllAbstractFilesInVault(this.plugin, app)
        if (this.plugin.settings.stickerSVG) {
            const cacheIcons = allFiles.filter(f => (f instanceof TFile) && f.extension == 'svg').map(s => this.persister.load(s.path, 'icon').then(string => {
                if (string?.length > 0)
                    this.iconsCache.set(s.path, string);
            }));
            await Promise.all(cacheIcons);
        }
        const cachePromises = allFiles.map(file => this.persister.load(file.path, 'file').then(f => {
            if (!f) return;

            const cache = parseFileCache(f)
            this.filesIndex.set(file.path, cache);
            this.tagsMap.set(file.path, new Set(cache.tags))
            this.contextsMap.set(file.path, new Set(cache.contexts))
            this.spacesMap.set(file.path, new Set(cache.spaces))
            this.linksMap.set(file.path, new Set(cache.outlinks))
            this.broadcast('file', 'change', file.path)
        }))
        await Promise.all(cachePromises);
        const allSpaces = this.plugin.settings.cachedSpaces;
        const cacheSpacePromises = allSpaces.map(s => this.persister.load(s, 'space').then(serializedSpace => {
            const space = safelyParseJSON(serializedSpace);
            if (space)
            {
                this.spacesIndex.set(s, space);
            this.broadcast('space', 'change', s)
        }
        }));
        await Promise.all(cacheSpacePromises);
        this.broadcast('vault')
    }

    public async initalizeFiles() {
        const allFiles = getAllAbstractFilesInVault(this.plugin, app)
        const promises = allFiles.map(l => this.reloadFile(l, true));
        await Promise.all(promises);
        this.broadcast('vault')
    }


    public async renameTag(tag: string, newTag: string) {
        const contextCache = this.contextsIndex.get(tag);
        const existingContext = this.contextsIndex.get(newTag);
        if (existingContext) {
            await this.reloadContext(existingContext.info);
            this.tagsMap.getInverse(tag).forEach(file => this.renameTagInFile(tag, newTag, getAbstractFileAtPath(app, file)))
        } else {
            this.contextsIndex.set(newTag, contextCache);
            this.contextsIndex.delete(tag);
            this.tagsMap.getInverse(tag).forEach(file => this.renameTagInFile(tag, newTag, getAbstractFileAtPath(app, file)))
        }
        let allContextsWithTag : ContextInfo[] = [];
        for(let [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.contexts.includes(tag) || contextCache.defContexts.includes(tag)) {
                allContextsWithTag.push(contextCache.info)
            }
        }
        this.addToContextStoreQueue(() => renameTagInContexts(this.plugin, tag, newTag, allContextsWithTag));
    }

    public renameTagInFile(tag: string, newTag: string, file: TAbstractFile) {
        let oldMetadata : FileMetadataCache
        if (this.filesIndex.has(file.path)) {
            oldMetadata = this.filesIndex.get(file.path)
        }
        if (oldMetadata) {
            const newMetadata = {
                ...oldMetadata,
                tags: oldMetadata.tags.map(f => f == tag ? newTag : f),
                fileTags: oldMetadata.fileTags.map(f => f == tag ? newTag : f),
                contexts: oldMetadata.contexts.map(f => f == tag ? newTag : f),
            }
            this.filesIndex.set(file.path, newMetadata);
            this.tagsMap.set(file.path, new Set(newMetadata.tags))
            this.contextsMap.set(file.path, new Set(newMetadata.contexts))
        } else {
            this.reloadFile(file);
        }
        this.fileReloaded(file.path);
        this.broadcast('file', 'change', file.path)
    }

    public deleteTag(tag: string) {
        const contextCache = this.contextsIndex.get(tag);
        this.contextsIndex.delete(tag);
        this.tagsMap.getInverse(tag).forEach(file => {
            this.deleteTagInFile(tag, getAbstractFileAtPath(app, file))
        })
        let allContextsWithTag : ContextInfo[] = [];
        for(let [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.contexts.includes(tag) || contextCache.defContexts.includes(tag)) {
                allContextsWithTag.push(contextCache.info)
            }
        }
        this.addToContextStoreQueue(() => removeTagInContexts(this.plugin, tag, allContextsWithTag));
    }

    public deleteTagInFile(tag: string, file: TAbstractFile) {
        let oldMetadata : FileMetadataCache
        if (this.filesIndex.has(file.path)) {
            oldMetadata = this.filesIndex.get(file.path)
        }
        if (oldMetadata) {
            const newMetadata = {
                ...oldMetadata,
                tags: oldMetadata.tags.filter(f => f != tag),
                fileTags: oldMetadata.fileTags.filter(f => f != tag),
                contexts: oldMetadata.contexts.filter(f => f != tag),
            }
            this.filesIndex.set(file.path, newMetadata);
            this.tagsMap.set(file.path, new Set(newMetadata.tags))
            this.contextsMap.set(file.path, new Set(newMetadata.contexts))
        } else {
            this.reloadFile(file);
        }
        this.fileReloaded(file.path);
        this.broadcast('file', 'change', file.path)
    }

    public metadataChange(file: TAbstractFile) {
        let fileCache = this.filesIndex.get(file.path)
        let afile = file;
        if (!fileCache) {
            const folderNotePath = folderPathFromFolderNoteFile(this.plugin.settings, tFileToAFile(file));
            fileCache = this.filesIndex.get(folderNotePath)
            if (fileCache)
                afile = getAbstractFileAtPath(app, fileCache.path)
        }
        if (fileCache)
        {
            const allContextsWithFile = fileCache.contexts.map(f => this.contextsIndex.get(f)?.info).filter(f => f);
            this.addToContextStoreQueue(() => onMetadataChange(this.plugin, afile, allContextsWithFile));
            this.reloadFile(afile);
        }
    }

    public renameFile(oldPath: string, newPath: string) {
        //assume that space indexer has updated all records properly
        const oldParentPath = getParentPathFromString(oldPath);
        const newParentPath = getParentPathFromString(newPath);
        let newFilePath = newPath;
        const newTFile = getAbstractFileAtPath(app, newPath);
        const oldFileCache = this.filesIndex.get(oldPath);
        if (!oldFileCache) {

        this.spacesMap.rename(oldPath, newPath)
        this.linksMap.rename(oldPath, newPath)
        this.linksMap.renameInverse(oldPath, newPath)
        this.spacesMap.get(newPath).forEach(f => this.reloadSpace(f));
        this.reloadFile(newTFile).then(f => this.broadcast('space'));
        return;
        }

        const fileCache = { ...this.filesIndex.get(oldPath), path: newPath, parent: newParentPath }
        this.filesIndex.set(newPath, fileCache);
        this.filesIndex.delete(oldPath);
        if (this.plugin.settings.enableFolderNote) {
            if (isFolderNote(this.plugin.settings, tFileToAFile(getAbstractFileAtPath(app, newPath)))) {
                newFilePath = folderPathFromFolderNoteFile(this.plugin.settings, tFileToAFile(getAbstractFileAtPath(app, newPath)));
                this.filesIndex.delete(newPath);
            }
        }
        // if (this.contextsIndex.get(oldPath)) {
        //     this.reloadContext()
        // }
        this.spacesMap.rename(oldPath, newFilePath)
        //update context rows for tags and folders
        const allContextsWithFile = (oldFileCache.contexts ?? []).map(f => this.contextsIndex.get(f)?.info).filter(f => f);
        if (oldParentPath != newParentPath) {
            const newFolderPath = getFolderPathFromString(newFilePath);
            const newFolderContext = this.contextsIndex.get(newFolderPath);
            const newTags = uniq([...oldFileCache.fileTags, ...(newFolderContext?.contexts ?? [])]);
            const sameContexts = allContextsWithFile.filter(f => newTags.includes(f));
            if (sameContexts.length > 0)
            this.addToContextStoreQueue(() => renameFileInContexts(this.plugin, oldPath, newFilePath, sameContexts).then(f => sameContexts.forEach(c => this.reloadContext(c))))
            const newContexts = newTags.filter(f => !sameContexts.includes(f)).map(f => this.contextsIndex.get(f)?.info)
            if (newContexts.length > 0)
            this.addToContextStoreQueue(() => addFileInContexts(this.plugin, newFilePath, newContexts).then(f => newContexts.forEach(c => this.reloadContext(c))))
            const removedContexts = allContextsWithFile.filter(f => !sameContexts.includes(f))
            if (removedContexts.length > 0)
                this.addToContextStoreQueue(() => removeFileInContexts(this.plugin, oldPath, removedContexts).then(f => removedContexts.forEach(c => this.reloadContext(c))))
        } else {
            this.addToContextStoreQueue(() => renameFileInContexts(this.plugin, oldPath, newFilePath, allContextsWithFile).then(f => {
                allContextsWithFile.forEach(c => this.reloadContext(c))
            }))
        }
        let allContextsWithLink : ContextInfo[] = [];
          for(let [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.outlinks.includes(oldPath)) {
                allContextsWithLink.push(contextCache.info)
            }
        }
        this.spacesMap.get(newFilePath).forEach(f => this.reloadSpace(f));
        this.reloadFile(getAbstractFileAtPath(app, newFilePath)).then(f => this.broadcast('space'));

        this.addToContextStoreQueue(() => renameLinkInContexts(this.plugin, oldPath, newFilePath, allContextsWithLink).then(f => allContextsWithFile.forEach(c => this.reloadContext(c))))
    }

    public async createFile(path: string) {
        await this.reloadFile(getAbstractFileAtPath(app, path))
        this.broadcast('space')
    }

    public deleteFile(path: string) {
        const fileCache = this.filesIndex.get(path)
        if (!fileCache)
            return;
        this.filesIndex.delete(path);
        this.spacesMap.delete(path);
        this.linksMap.delete(path);
        this.linksMap.deleteInverse(path);
          const allContextsWithFile = fileCache.contexts.map(f => this.contextsIndex.get(f)?.info).filter(f => f);
          this.addToContextStoreQueue(() => removeFileInContexts(this.plugin, path, allContextsWithFile).then(f => allContextsWithFile.forEach(c => this.reloadContext(c))))
          let allContextsWithLink : ContextInfo[] = [];
          for(let [contextPath, contextCache] of this.contextsIndex) {
            if (contextCache.outlinks.includes(path)) {
                allContextsWithLink.push(contextCache.info)
            }
        }
        this.addToContextStoreQueue(() => removeLinkInContexts(this.plugin, path, allContextsWithLink).then(f => allContextsWithFile.forEach(c => this.reloadContext(c))))
        this.broadcast('space')
    }

    public async renameSpace(oldSpace: string, newSpace: string) {
        if (this.spacesIndex.has(oldSpace)) {
            this.spacesIndex.delete(oldSpace);
            await this.reloadSpace(newSpace);
        }
        this.spacesMap.renameInverse(oldSpace, newSpace)
        this.broadcast('space', 'rename', oldSpace)
    }

    public deleteSpace(space: string) {
        if (this.spacesIndex.has(space)) {
            this.spacesIndex.delete(space);
        }
        this.spacesMap.deleteInverse(space)
            this.persister.remove(space, 'space');
            this.plugin.settings.cachedSpaces = this.allSpaces().map(f => f.name)
            this.plugin.saveSettings();
        this.broadcast('space')

    }

    public async spacesSynced() {
        const incomingSpaceTime = parseInt(await app.vault.read(getAbstractFileAtPath(app, this.plugin.settings.spacesSyncLastUpdated) as TFile));
        const currentSpaceTime = this.plugin.spacesDBLastModify;
        if (incomingSpaceTime != currentSpaceTime) {
            this.loadSpacesDatabaseFromDisk();
        }
    }

    public async reloadContext (context: ContextInfo) {
        if (!context) return false;
        return this.indexer.reload<{cache: ContextsMetadataCache, changed: boolean}>({ type: 'context', path: context.contextPath}).then(r => {
            const { changed, cache } = r;
            if (!changed) { return false }
            this.contextsIndex.set(context.contextPath, cache)
            this.broadcast('context', 'change', context.contextPath)
            return true;
        });
    }

    public broadcast(type: SpaceChange, action?: string, name?: string, newName?: string) {
        // console.log('broadcast', type, name)
        dispatchSpaceDatabaseFileChanged(type, action, name, newName)
    }

    public async reloadVault () {
        this.broadcast('vault')
    }

    public allSpaces () {
        return [...this.spacesIndex.values()].filter(f => f).map(f => f.space).sort((a, b) =>
        (a.rank ?? '').localeCompare(b.rank ?? '', undefined, { numeric: true })
      )
    }

    public async backupSpaceDB (auto: boolean) {
        if (auto) {
            if (!this.plugin.settings.spacesAutoBackup) {
                return;
            }
            if (Date.now() - this.plugin.settings.spacesAutoBackupLast > this.plugin.settings.spacesAutoBackupInterval*60*24) {
                this.plugin.settings.spacesAutoBackupLast = Date.now();
                this.plugin.saveSettings();
            } else {
                return;
            }

        }
        const spaceBackupFolder = normalizePath(
            `${app.vault.configDir}/plugins/make-md/backups`
          );
        if (
            !(await this.app.vault.adapter.exists(
              spaceBackupFolder
            ))
          ) {
            await this.app.vault.createFolder(spaceBackupFolder);
          }
          const backupPath = normalizePath(
            `${spaceBackupFolder}/Spaces ${format(Date.now(), 'yyyy-MM-dd HH-mm')}.mdb`
          );
          const dbPathExists = await this.app.vault.adapter.exists(this.plugin.spacesDBPath)
          const backupPathExists = await this.app.vault.adapter.exists(backupPath)
          if (dbPathExists && !backupPathExists)
        app.vault.adapter.copy(this.plugin.spacesDBPath, backupPath)
    }

    public async loadSpaceDBFromBackup (fileName: string) {
        const filePath = normalizePath(
            `${app.vault.configDir}/plugins/make-md/backups/${fileName}.mdb`
          );
          if (
            this.app.vault.adapter.exists(
              filePath
            )
          ) {
            await app.vault.adapter.remove(this.plugin.spacesDBPath);
        await app.vault.adapter.copy(filePath, this.plugin.spacesDBPath)
        await this.updateSpaceLastUpdated();
        this.loadSpacesDatabaseFromDisk();
        }
    }

    public reloadSpace (spaceName: string, initialized=true) {
        const spaceDB = this.spacesDBCache.find(f => f.name == spaceName)
        if (spaceDB) {
            const space = parseSpace(spaceDB);
            const spaceItems = this.spacesItemsDBCache.filter(f => f.space == spaceName)
            const cache = parseSpaceCache(space, spaceItems as SpaceItem[]);
            this.spacesIndex.set(spaceName, cache);
            this.persister.store(spaceName, JSON.stringify(cache), 'space');
            if (initialized) {
            this.plugin.settings.cachedSpaces = this.allSpaces().map(f => f.name)
            this.plugin.saveSettings();
            this.broadcast('space', 'change', spaceName)
            }
        }


    }

    public async reloadFile(file: TAbstractFile, force?: boolean) : Promise<boolean> {
        if (!file) return false;

        return this.indexer.reload<{cache: FileMetadataCache, changed: boolean}>({ type: 'file', path: file.path}).then(r => {

            const { changed, cache } = r;
            if (!changed && !force) { return false }

            this.filesIndex.set(file.path, cache);
            this.tagsMap.set(file.path, new Set(cache.tags))
            this.contextsMap.set(file.path, new Set(cache.contexts))
            this.linksMap.set(file.path, new Set(cache.outlinks))
            if (!_.isEqual(cache.spaces, Array.from(this.spacesMap.get(file.path)))) {
                this.spacesMap.set(file.path, new Set(cache.spaces))
                this.broadcast('space')
            }
            if (force) {
                const allContextsWithFile = cache.contexts.map(f => this.contextsIndex.get(f)?.info).filter(f => f);
            this.addToContextStoreQueue(() => onMetadataChange(this.plugin, file, allContextsWithFile));
            }

            if (cache.extension == 'svg' && this.plugin.settings.stickerSVG) {
                app.vault.read(file as TFile).then(f => {
                    this.iconsCache.set(file.path, f)
                    this.persister.store(file.path, f, 'icon')
                })
            }

            this.fileReloaded(file.path);


            this.broadcast('file', 'change', file.path)
        return true;
        });
    }

    public async fileReloaded(path: string) {
        let metadata : FileMetadataCache
        if (this.filesIndex.has(path)) {
            metadata = this.filesIndex.get(path)
        }
        if (!metadata) {
            return false;
        }

        let missingContexts : ContextInfo[] = [];
        let removedContexts : ContextInfo[] = [];
        this.contextsIndex.forEach(contextCache => {
            if (metadata.contexts.includes(contextCache.info.contextPath) && !contextCache.files.includes(path)) {
                missingContexts.push(contextCache.info)
            } else if (contextCache.files.includes(path) && !metadata.contexts.includes(contextCache.info.contextPath) ) {
                removedContexts.push(contextCache.info)
            }
        })
        if (missingContexts.length > 0)
        {
            this.addToContextStoreQueue(() => addFileInContexts(this.plugin, path, missingContexts).then(f => missingContexts.forEach(c => this.reloadContext(c))))
        }
        if (removedContexts.length > 0)
        {
            this.addToContextStoreQueue(() => removeFileInContexts(this.plugin, path, removedContexts).then(f => removedContexts.forEach(c => this.reloadContext(c))))
        }
        this.persister.store(path, serializeFileCache(metadata), 'file');
    }
}
