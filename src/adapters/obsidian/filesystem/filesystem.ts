import { dbResultsToDBTables, getDB, saveDBToPath, selectDB } from "adapters/mdb/db/db";
import { initiateDB } from "adapters/mdb/utils/mdb";
import { rebuildIndex } from "adapters/obsidian/filesystem/rebuildIndex";
import { vaultSchema } from "adapters/obsidian/filesystem/schemas/vaultSchema";
import { addTagToProperties, getAllFilesForTag, loadTags, removeTagFromMarkdownFile, renameTagInMarkdownFile } from "adapters/obsidian/utils/tags";
import _, { debounce } from "lodash";
import MakeMDPlugin from "main";
import { AFile, FileCache, FileSystemAdapter, FileTypeCache, FilesystemMiddleware, PathLabel } from "makemd-core";
import { FileSystemAdapter as ObsidianFileSystemAdapter, Platform, TAbstractFile, TFile, TFolder, normalizePath } from "obsidian";

import { LocalCachePersister, LocalStorageCache } from "core/superstate/localCache/localCache";

import { MobileCachePersister } from "core/superstate/localCache/localCacheMobile";
import { parsePathState } from "core/utils/superstate/parser";
import { DBRows, DBTables } from "types/mdb";
import { serializeMultiString } from "utils/serializers";
import { getAbstractFileAtPath, getAllAbstractFilesInVault, tFileToAFile } from "../utils/file";




export class ObsidianFileSystem implements FileSystemAdapter {
    public middleware: FilesystemMiddleware;
    public vaultDBLoaded : boolean;
    public vaultDBCache: DBRows = [];
    public tagsCache: Set<string>;

    public cache: Map<string, FileCache> = new Map();
    private vaultQueue = Promise.resolve();
    public persister: LocalCachePersister;
    public addToVaultQueue(operation: () => Promise<any>) {
        //Simple queue (FIFO) for processing context changes
        this.vaultQueue = this.vaultQueue.then(operation).catch(() => {
            //do nuth'ing
        });
    }
    public updateFileCache(path: string, cache: FileTypeCache, refresh: boolean) {
        if (!cache) return;
        const oldCache = this.cache.get(path);
        const newCache = {...oldCache, ...cache};
        if (oldCache && _.isEqual(newCache, oldCache)) {
            return;
        }

        this.cache.set(path, newCache);
        
        this.persister.store(path,JSON.stringify(newCache), 'file');
        if (refresh)
        this.middleware.eventDispatch.dispatchEvent("onCacheUpdated", {path: path});
    }
    public constructor (public plugin: MakeMDPlugin, middleware: FilesystemMiddleware, public vaultDBPath: string) {
        this.middleware = middleware
        this.plugin = plugin;
    if (Platform.isMobile) {
      this.persister = new MobileCachePersister(".makemd/fileCache.mdb", this.plugin.mdbFileAdapter, ['file']);
    } else {
        this.persister = new LocalStorageCache(".makemd/fileCache.mdb", this.plugin.mdbFileAdapter, ['file']);
    }
        
    }
    public readAllTags () {
        return loadTags(this.plugin.app, this.plugin.superstate.settings);
    }
    public async addTagToFile (path: string, tag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (file.extension == "md") {
            addTagToProperties(this.plugin.superstate.spaceManager, tag, file.path);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiString([...vaultItem.tags, tag]))
    }
    public async renameTagForFile (path: string, oldTag: string, newTag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (file.extension == "md") {
            renameTagInMarkdownFile(this.plugin, oldTag, newTag, file);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiString([...vaultItem.tags.filter(t => t != oldTag), newTag]))
    }
    public async removeTagFromFile (path: string, tag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (file.extension == "md") {
            removeTagFromMarkdownFile(this.plugin, tag, file);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiString([...vaultItem.tags.filter(t => t != tag)]))
    }
    public spacesDBPath  = normalizePath(
    this.plugin.app.vault.configDir + "/plugins/make-md/Spaces.mdb"
  );
    public async loadCacheFromObsidianCache () {
        //Load Spaces Database File
        await this.persister.initialize();
        const db = await getDB(this.plugin.mdbFileAdapter, await this.plugin.mdbFileAdapter.sqlJS(), this.vaultDBPath);
        let tables;
        try {
            tables =  dbResultsToDBTables(
                db.exec(
                    "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
                    )
            );
            } catch (e) {
            console.log(e)
            tables = [];
            }
        if (tables.length == 0) {
            initiateDB(db);
            await saveDBToPath(this.plugin.mdbFileAdapter, this.spacesDBPath, {
                vault: vaultSchema,
            })
        }
        this.vaultDBCache = selectDB(db, "vault")?.rows ?? []
        db.close();
        this.vaultDBLoaded = true;
        await rebuildIndex(this, true);
        const allPaths = await this.persister.loadAll('file')
        this.vaultDBCache.forEach(f => {
            const file = tFileToAFile(getAbstractFileAtPath(this.plugin.app, f.path))
            if (file)
            this.cache.set(f.path, {
            file: file,
            metadata: {},
            label: {sticker: f.sticker, color: f.color, name:file.name} as PathLabel,
            tags: [],
            parent: file.parent,
            type: file.isFolder ? "space" : file.extension,
        } as FileCache)
        const h = allPaths.find(g => g.path == f.path)
                if (!h) return;
                const cache = parsePathState(h.cache)
                this.updateFileCache(f.path, cache, false)
        })
        const start = Date.now();
        await Promise.all(this.vaultDBCache.map(f => this.middleware.createFileCache(f.path)));
        this.plugin.superstate.ui.notify(`Make.md - File Cache Loaded in ${(Date.now()-start)/1000} seconds`, 'console')
        this.middleware.eventDispatch.dispatchEvent("onFilesystemIndexed", null);
        this.plugin.registerEvent(this.plugin.app.vault.on("create", this.onCreate));
        this.plugin.registerEvent(this.plugin.app.vault.on("modify", this.onModify));
        this.plugin.registerEvent(this.plugin.app.vault.on("delete", this.onDelete));
        this.plugin.registerEvent(this.plugin.app.vault.on("rename", this.onRename));
        this.plugin.superstate.initialize();
      }
    
      public allFiles () {
        return getAllAbstractFilesInVault(this.plugin).map(f => tFileToAFile(f));
      }
      public getFileCache (path: string, source?: string) {
        return this.cache.get(path);
      }
    public parentForPath (path: string) {
        return this.getFile(path).then(file => {
            if (!file?.parent) return null
            return this.getFile(file.parent)
        })
    }
    public resolvePath (path: string, source: string) {
        return this.plugin.app.metadataCache.getFirstLinkpathDest(path, source)?.path ?? path
    }
    
    public updateFileLabel (path: string, label: string, content: any) {
  {
    
    const newVaultDB = this.vaultDBCache.map(f => f.path == path ? {...f, [label]: content } : f)
    this.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: newVaultDB}})
    const file = this.cache.get(path);
    this.middleware.updateFileCache(path, {label: {...file.label, [label]: content} as PathLabel}, true)

}
    }
    public async saveSpacesDatabaseToDisk (tables: DBTables, save=true) {
        if (await this.plugin.files.fileExists(normalizePath(this.spacesDBPath)) && !this.vaultDBLoaded) {
            return;
        }
        this.vaultDBLoaded = true;
        if (tables.vault) this.vaultDBCache = tables.vault.rows
            if (save && this.plugin.superstate.settings.spacesEnabled) {
                this.debounceSaveSpaceDatabase(tables);
            }
        
    }
    private debounceSaveSpaceDatabase = debounce(
        (tables: DBTables) => {
        saveDBToPath(this.plugin.mdbFileAdapter, this.spacesDBPath, tables)
    }, 1000,
    {
        leading: false,
      })
    

    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware
    }

    public resourcePathForPath (path: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile)
            return this.plugin.app.vault.getResourcePath(file);
        return path;
    }

    onCreate = async (file: TAbstractFile) => {

        if (!file) return;
        this.addToVaultQueue(async () => {
        const folder = file instanceof TFolder
        const parent = file.parent
        
        await this.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: [...this.vaultDBCache, {
            path: file.path,
            parent: parent?.path,
            created: Math.trunc(Date.now() / 1000).toString(),
            folder: folder ? "true" : "false",
        }]}})
        });
        const afile = tFileToAFile(file);
        
    this.cache.set(afile.path, {
        file: afile,
        metadata: {},
        label: {sticker: null, color: null, name:(file as TFile).basename ?? file.name} as PathLabel,
        tags: [],
        parent: afile.parent,
            type: afile.isFolder ? "space" : afile.extension
    } as FileCache)
        this.middleware.onCreate(afile)
      };
    onModify = async (file: TAbstractFile) => {
        if (!file) return;
        this.middleware.onModify(tFileToAFile(file))
    }
      onDelete = async (file: TAbstractFile) => {

        if (!file) return;

        this.addToVaultQueue(async () => {
        if (file instanceof TFolder) {
            const newVaultRows = this.vaultDBCache.filter(f => f.path != file.path && !f.parent.startsWith(file.path));
            await this.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}});
        } else {
            const newVaultRows = this.vaultDBCache.filter(f => f.path != file.path);
        await this.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows} });
        }
    });
        this.middleware.onDelete(tFileToAFile(file))
      };
      
      onRename = async (file: TAbstractFile, oldPath: string) => {
        if (!file) return;
       
        this.addToVaultQueue(async () => {
        if (file instanceof TFolder) {
            const newVaultRows = this.vaultDBCache.map(f => f.path == oldPath ?
                {
                ...f,
                path: file.path,
                parent: file.parent.path
            } : f.parent.startsWith(oldPath) || f.path.startsWith(oldPath) ? {
                ...f,
                path: f.path.replace(oldPath, file.path),
                parent: f.parent.replace(oldPath, file.path),
            } : f);
            
            await this.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}});
        
        } else {
            const newVaultRows = this.vaultDBCache.map(f => f.path == oldPath ?
                {
                    ...f,
                    path: file.path,
                    parent: file.parent.path
                  }
                  : f);

            await this.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}});
        }
    });
    const newFile = tFileToAFile(file);
    this.cache.set(newFile.path, {...this.cache.get(oldPath), file: newFile, label: {...this.vaultDBCache.find(f => f.path == oldPath), name: (file as TFile).basename ?? file.name} as PathLabel, parent: newFile.parent, type: newFile.isFolder ? "space" : newFile.extension} as FileCache);
    
    this.cache.delete(oldPath);
        this.middleware.onRename(tFileToAFile(file), oldPath)
      };

    public async getRoot() {
        return tFileToAFile(this.plugin.app.vault.getRoot());
    }

    public async copyFile(path: string, folder: string) {

            const file = await this.getFile(path);
            if (!file) return;
            const newPath = folder + "/" + file.filename;
            let newFile: AFile;
            if (file.isFolder) {
                newFile = await this.createFolder(newPath);
            } else if (file) {
                newFile = tFileToAFile(await this.plugin.app.vault.copy(this.plugin.app.vault.getAbstractFileByPath(file.path) as TFile, folder + "/" + file.filename));
            }
            if (!newFile) return;
            
            this.cache.set(newFile.path, {
                ...this.cache.get(file.path),
                file: newFile,
                label: {...this.cache.get(path).label, name:newFile.name} as PathLabel,
                parent: newFile.parent,
                type: newFile.isFolder ? "space" : newFile.extension
            } as FileCache)


    }
public async writeTextToFile (path: string, content: string) {
        const newFile = this.plugin.app.vault.getAbstractFileByPath(path) as TFile
        if (!newFile)
        {await this.plugin.app.vault.adapter.write(path, content)} else 
        {await this.plugin.app.vault.modify(newFile, content)}
}
public async readTextFromFile (path: string) {
    return this.plugin.app.vault.read(this.plugin.app.vault.getAbstractFileByPath(path) as TFile)
}

public async writeBinaryToFile (path: string, buffer: ArrayBuffer) {
    return this.plugin.app.vault.adapter.writeBinary(
        path,
        buffer)
}

public async readBinaryToFile (path: string) {
return (this.plugin.app.vault.adapter as ObsidianFileSystemAdapter).readBinary(path);
}
    
    public async renameFile (path: string, newPath: string) {

            return this.plugin.app.fileManager.renameFile(
            this.plugin.app.vault.getAbstractFileByPath(path),
            newPath
        );
    }

    

public async createFolder (path: string) {
    if (!await this.fileExists(path))
    {
      const newFolder = await this.plugin.app.vault.createFolder(path);
      return tFileToAFile(newFolder);
    } else {
        return this.getFile(path)
    }
}
    public async fileExists (path: string) {
            return this.plugin.app.vault.adapter.exists(path)
    }

    public async getFile(path: string, source?: string) {
        let aFile : AFile;
            if (source) {
                aFile = tFileToAFile(this.plugin.app.metadataCache.getFirstLinkpathDest(path, source))
            } else {
                aFile = tFileToAFile(this.plugin.app.vault.getAbstractFileByPath(path))
            }
            if (!aFile) {
                if (!(await this.fileExists(path))) {
                    return null;
                  }
                  const extension = path.split('.').pop();
                  const folder = path.split('/').slice(0, -1).join('/');
                  const filename = path.split('/').pop()
                  const name = filename.split('.')[0];
                  aFile = {
                    path,
                    name,
                    filename,
                    parent: folder,
                    isFolder: false,
                    extension
                  }
            }
            return aFile;
    }

    public async deleteFile(path: string) {
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            const deleteOption = this.plugin.superstate.settings.deleteFileOption;
            if (!file) return;
            if (deleteOption === "permanent") {
                return this.plugin.app.vault.delete(file, true);
            } else if (deleteOption === "system-trash") {
                return this.plugin.app.vault.trash(file, true);
            } else if (deleteOption === "trash") {
                return this.plugin.app.vault.trash(file, false);
            }
        }
        public filesForTag (tag: string) {
            return getAllFilesForTag(this.plugin, tag);
        }
}