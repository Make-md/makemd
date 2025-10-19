import { addTagToProperties, getAllFilesForTag, loadTags, removeTagFromMarkdownFile, renameTagInMarkdownFile } from "adapters/obsidian/utils/tags";
import _ from "lodash";
import MakeMDPlugin from "main";
import { AFile, FileCache, FileSystemAdapter, FileTypeCache, FilesystemMiddleware, PathLabel } from "makemd-core";
import { FileSystemAdapter as ObsidianFileSystemAdapter, Platform, TAbstractFile, TFile, TFolder, normalizePath } from "obsidian";

import { LocalStorageCache } from "adapters/mdb/localCache/localCache";
import { LocalCachePersister } from "shared/types/persister";

import { MobileCachePersister } from "adapters/mdb/localCache/localCacheMobile";
import { DEFAULT_SETTINGS } from "core/schemas/settings";
import { defaultFocusFile } from "core/spaceManager/filesystemAdapter/filesystemAdapter";
import { parsePathState } from "core/utils/superstate/parser";
import { DBRows } from "shared/types/mdb";
import { uniqueNameFromString } from "shared/utils/array";
import { removeTrailingSlashFromFolder } from "shared/utils/paths";
import { parseURI } from "shared/utils/uri";
import { excludePathPredicate } from "utils/hide";
import { getParentPathFromString, pathToString } from "utils/path";
import { urlRegex } from "utils/regex";
import { serializeMultiDisplayString } from "utils/serializers";
import { getAllFrontmatterKeys } from "../filetypes/frontmatter/fm";
import { getAbstractFileAtPath, getAllAbstractFilesInVault, tFileToAFile } from "../utils/file";


const illegalCharacters = ['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'];

export class ObsidianFileSystem implements FileSystemAdapter {
    public middleware: FilesystemMiddleware;
    public vaultDBLoaded : boolean;
    public vaultDBCache: DBRows = [];
    public tagsCache: Set<string>;

    public cache: Map<string, FileCache> = new Map();
    public persister: LocalCachePersister;
    public pathLastUpdated: Map<string, number> = new Map();

    public fileNameWarnings: Set<string> = new Set();
    
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
      this.persister = new MobileCachePersister(".makemd/fileCache.mdc", this.plugin.mdbFileAdapter, ['file']);
    } else {
        this.persister = new LocalStorageCache(".makemd/fileCache.mdc", this.plugin.mdbFileAdapter, ['file']);
    }
        
    }
    public readAllTags () {
        return loadTags(this.plugin.app, this.plugin.superstate.settings);
    }
    public async addTagToFile (path: string, tag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (!file) return;
        if (file.extension == "md") {
            addTagToProperties(this.plugin.superstate.spaceManager, tag, file.path);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiDisplayString([...vaultItem.tags, tag]))
    }
    public async renameTagForFile (path: string, oldTag: string, newTag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (file.extension == "md") {
            renameTagInMarkdownFile(this.plugin, oldTag, newTag, file);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiDisplayString([...vaultItem.tags.filter(t => t.toLowerCase() != oldTag.toLowerCase()), newTag]))
    }
    public async removeTagFromFile (path: string, tag: string) {
        const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
        if (file.extension == "md") {
            removeTagFromMarkdownFile(this.plugin, tag, file);
            return;
        }
        const vaultItem = this.cache.get(path);
        if (!vaultItem) return;
        this.updateFileLabel(path, "tags", serializeMultiDisplayString([...vaultItem.tags.filter(t => t.toLowerCase() != tag.toLowerCase())]))
    }
    public spacesDBPath  = normalizePath(
    this.plugin.app.vault.configDir + "/plugins/make-md/Spaces.mdb"
  );
  public checkIllegalCharacters (file: {name: string, path: string}) {
    if (illegalCharacters.some(f => file.name.includes(f)))
    {
            this.fileNameWarnings.add(file.path);
        } else {
            this.fileNameWarnings.delete(file.path);
        }

  }
    public async loadCacheFromObsidianCache () {
        //Load Spaces Database File
        await this.persister.initialize();
        
        
        this.vaultDBCache = getAllAbstractFilesInVault(this.plugin.app).map(file => ({
            path: file.path,
                parent: file.parent?.path,
                created: file instanceof TFile ? file.stat.ctime.toString() : undefined,
                folder: file instanceof TFolder ? "true" : "false",
        })).filter(f => !excludePathPredicate(this.plugin.superstate.settings, f.path));

        const allPaths = await this.persister.loadAll('file');
        this.fileNameWarnings = new Set();
        // this.persister.reset();
        this.vaultDBCache.forEach(f => {
            const file = tFileToAFile(getAbstractFileAtPath(this.plugin.app, f.path))
            if (file?.path == '/') {
                file.name = "Vault"
                f.name = "Vault"
            }
            this.checkIllegalCharacters(file);
            if (excludePathPredicate(this.plugin.superstate.settings, file.path)) return;
            let cache : Partial<FileCache> = {
                metadata: {},
                tags: [],
                label: {sticker: f.sticker, thumbnail: '', color: f.color, name:f.name} as PathLabel,
            };
                const h = allPaths.find(g => g.path == f.path)
                if (h)
                cache = {...cache, ...parsePathState(h.cache)}
                if (file)
                {
                    cache = {...cache,
                    file: file,
                    ctime: cache.ctime > 0 ? cache.ctime : file.ctime,
                    contentTypes: file.isFolder ? [] : ['md', 'canvas', 'folder'],
                    label: {name: file.name, 
                         thumbnail: cache.label.thumbnail ?? '', 
                         sticker: cache.label.sticker ?? '', 
                         color: cache.label.color ?? '',
                         cover: cache.label.cover ?? ''
                        } as PathLabel,
                    parent: file.parent,
                    type: file.isFolder ? "space" : 'file',
                    subtype: file.isFolder ? "folder" : file.extension
                }
            }
                this.updateFileCache(f.path, cache, false)
        })
        const start = Date.now();
        await Promise.all(this.vaultDBCache.map(f => this.middleware.createFileCache(f.path)));

        this.plugin.superstate.ui.notify(`Make.md - File Cache Loaded in ${(Date.now()-start)/1000} seconds ${this.cache.size}`, 'console')
        this.middleware.eventDispatch.dispatchEvent("onFilesystemIndexed", null);
        this.plugin.registerEvent(this.plugin.app.vault.on("create", this.onCreate));
        this.plugin.registerEvent(this.plugin.app.vault.on("modify", this.onModify));
        this.plugin.registerEvent(this.plugin.app.vault.on("delete", this.onDelete));
        this.plugin.registerEvent(this.plugin.app.vault.on("rename", this.onRename));
        this.plugin.registerEvent(this.plugin.app.vault.on("raw", this.onRaw));
        this.plugin.superstate.initialize();
      }
        public onRaw = async (path: string) => {
            
            const fileStat = await this.plugin.app.vault.adapter.stat(path);
            if (!fileStat) return;
            const currentMTime = this.pathLastUpdated.get(path) ?? 0;
            const needsUpdate = fileStat.mtime > currentMTime;
            
            if (!needsUpdate) return;

            this.pathLastUpdated.set(path, fileStat.mtime);
            const parentPath = this.parentPathForPath(path);
            if (parentPath.split('/').pop() == this.plugin.superstate.settings.spaceSubFolder) {
                if (path == `${this.plugin.superstate.settings.spaceSubFolder}/${defaultFocusFile}`) {
                    this.middleware.onFocusesUpdated();
                    return;
                }
                const type = path.split('/').pop();
                const spacePath = this.parentPathForPath(parentPath);
                this.middleware.onSpaceUpdated(spacePath, type);
                return;
            }
            
            if (path == normalizePath(this.plugin.app.vault.configDir + "/plugins/make-md/data.json")) {
                this.plugin.superstate.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
                this.plugin.superstate.dispatchEvent("settingsChanged", null);
            } 
        }

      public keysForCacheType (type: string) {
        if (type == 'frontmatter') {
            return getAllFrontmatterKeys(this.plugin);
        }
        return [];
      }
    public allContent () {
        return [...this.cache.values()].flatMap(f => f);
    }
      public allFiles (hidden?: boolean) {
        return getAllAbstractFilesInVault(this.plugin.app).map(f => tFileToAFile(f));
      }
      public getFileCache (path: string, source?: string) {
        return this.cache.get(path);
      }
    public parentPathForPath (path: string) {
        return removeTrailingSlashFromFolder(
            getParentPathFromString(path)
          );
    }
    public resolvePath (path: string, source: string) {
        if (!source || !path) return path;
        const uri = parseURI(path);
        if (uri.refStr?.length > 0)
        {
            if (uri.refType == 'block' || uri.refType == 'heading') {
            const resolvedPath =  this.plugin.app.metadataCache.getFirstLinkpathDest(uri.basePath, source)?.path;
            if (resolvedPath)
            return resolvedPath + "#" + uri.refStr
        }
        return path;
    }
        
        return this.plugin.app.metadataCache.getFirstLinkpathDest(path, source)?.path ?? path
    }
    
    public updateFileLabel (path: string, label: string, content: any) {
    
    const file = this.cache.get(path);
    this.middleware.updateFileCache(path, {label: {...file.label, [label]: content} as PathLabel}, true)

    }
    

    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware
    }

    public resourcePathForPath (path: string) {
        if (!path) return path;
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            return this.plugin.app.vault.getResourcePath(file);
        } 
        else if (path.match(urlRegex)) {
            return path;
        }
        const returnPath = this.parentPathForPath(this.plugin.app.vault.getResourcePath(this.plugin.app.vault.getRoot() as any))
        return `${returnPath}/${path}`;
    }

    onCreate = async (file: TAbstractFile) => {

        if (!file) return;
        this.checkIllegalCharacters(file);
        if (excludePathPredicate(this.plugin.superstate.settings, file.path)) return;
        const afile = tFileToAFile(file);
        
    this.cache.set(afile.path, {
        file: afile,
        ctime: afile.ctime,
        metadata: {},
        label: {sticker: "", thumbnail: "", color: "", name:(file as TFile).basename ?? file.name} as PathLabel,
        tags: [],
        parent: afile.parent,
        type: afile.isFolder ? "space" : 'file',
        subtype: afile.isFolder ? "folder" : afile.extension
    } as FileCache)
    await this.middleware.createFileCache(afile.path);
        this.middleware.onCreate(afile)
      };
    onModify = async (file: TAbstractFile) => {
        if (!file) return;
        if (excludePathPredicate(this.plugin.superstate.settings, file.path)) return;
        this.middleware.onModify(tFileToAFile(file))
    }
      onDelete = async (file: TAbstractFile) => {

        if (!file) return;

        this.fileNameWarnings.delete(file.path);
        
        this.middleware.onDelete(tFileToAFile(file))
      };
      
      onRename = async (file: TAbstractFile, oldPath: string) => {
        if (!file) return;
        this.checkIllegalCharacters(file);
        this.fileNameWarnings.delete(oldPath);
        
    const newFile = tFileToAFile(file);
const oldCache = this.cache.get(oldPath);
    this.cache.set(newFile.path, {...this.cache.get(oldPath), 
        file: newFile, 
        ctime:  oldCache.ctime > 0 ? oldCache.ctime : newFile.ctime,
        label: {...oldCache.label, name: (file as TFile).basename ?? file.name} as PathLabel, 
        parent: newFile.parent, 
        type: newFile.isFolder ? "space" : 'file',
        subtype: newFile.isFolder ? "folder" : newFile.extension
} as FileCache);
    
    this.cache.delete(oldPath);
        this.middleware.onRename(tFileToAFile(file), oldPath)
      };

    public async getRoot() {
        return tFileToAFile(this.plugin.app.vault.getRoot());
    }

    public async copyFile(path: string, folder: string, newName?: string) {

            const file = await this.getFile(path);
            
            if (!file) return;
            newName = newName ? file.extension?.length > 0 ? newName + '.' + file.extension : newName : file.filename;
            
            let newPath = folder + "/" + newName;
            let newFile: AFile;
            if (file.isFolder) {
                
                
                if (await this.fileExists(newPath)) {
                    const folders = await this.plugin.app.vault.adapter.list(folder).then(g => g.folders)
                    newName = uniqueNameFromString(file.name, folders.map(f => f.split('/').pop()))
                    newPath = folder + "/" + newName;
                }
                const recursiveCopy = async (folder: string, newPath: string) => {
                    
                    const files = await this.plugin.app.vault.adapter.list(folder);
                    for (const f of files.files) {
                        if (newName != file.name) {
                            if (folder == path && f.split('/').pop() == file.name+ '.md') {
                                await this.plugin.app.vault.adapter.copy(f, newPath + "/" + newName + '.md');
                                continue;
                            }
                            
                        }
                        await this.plugin.app.vault.adapter.copy(f, newPath + "/" + f.split('/').pop());
                    }
                    for (const f of files.folders) {
                        await this.createFolder(newPath + "/" + f.split('/').pop());
                        await recursiveCopy(f, newPath + "/" + f.split('/').pop());
                    }
                }
                newFile = await this.createFolder(newPath);
                await recursiveCopy(file.path, newFile.path);
            } else if (file) {
                if (!(await this.fileExists(folder))) {
                    await this.createFolder(folder);
                }
                try {
                    if (await this.fileExists(newPath)) {
                        const files = await this.plugin.app.vault.adapter.list(folder).then(g => g.files)
                        const newName = uniqueNameFromString(file.name, files.map(f => pathToString(f)))
                        newPath = folder + "/" + newName + "." + file.extension;
                    }
                    await this.plugin.app.vault.adapter.copy((file.path), newPath)
                } catch(e) {
                }
                newFile = tFileToAFile(this.plugin.app.vault.getAbstractFileByPath(newPath));
            }
            if (!newFile) return;
            
            this.cache.set(newFile.path, {
                ...this.cache.get(file.path),
                file: newFile,
                ctime: newFile.ctime,
                label: {...this.cache.get(path)?.label, name:newFile.name} as PathLabel,
                parent: newFile.parent,
                type: newFile.isFolder ? "space" : 'file',
        subtype: newFile.isFolder ? "folder" : newFile.extension
            } as FileCache)
            return newPath;

    }
public async writeTextToFile (path: string, content: string) {
        const newFile = this.plugin.app.vault.getAbstractFileByPath(path) as TFile
        if (!newFile)
        {await this.plugin.app.vault.adapter.write(path, content)} else 
        {await this.plugin.app.vault.modify(newFile, content)}
}
public async readTextFromFile (path: string) {
    const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
    if (file) {
        return this.plugin.app.vault.read(file)
    } 
    if (await this.fileExists(path))
    return this.plugin.app.vault.adapter.read(path);
return null
}

public async writeBinaryToFile (path: string, buffer: ArrayBuffer) {
    await this.plugin.app.vault.adapter.writeBinary(
        path,
        buffer);
    this.pathLastUpdated.set(path, Date.now());
    
}

public async readBinaryToFile (path: string) {
return (this.plugin.app.vault.adapter as ObsidianFileSystemAdapter).readBinary(path);
}
    
    public async renameFile (path: string, newPath: string) {

        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        
            let finalPath = newPath;
            try {
                if (file) {
                await this.plugin.app.fileManager.renameFile(file,
                    newPath)
                } else {
                    await this.plugin.app.vault.adapter.rename(path, newPath)
                }
            } catch {
                finalPath = null;
            }
            return finalPath
    }

    

public async createFolder (path: string) {

    if (!await this.fileExists(path))
    {
      await this.plugin.app.vault.adapter.mkdir(path);
      return this.getFile(path);
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
                  const fileStat = await this.plugin.app.vault.adapter.stat(path);
                  if (!fileStat) return null;
                  const type = fileStat?.type;
                  const extension = type == 'file' ? path.split('.').pop() : null;
                  const folder = path.split('/').slice(0, -1).join('/');
                  const filename = path.split('/').pop()
                  const name = type == 'file' ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                  aFile = {
                    path,
                    name,
                    filename,
                    parent: folder,
                    isFolder: type == "folder",
                    extension
                  }
            }
            return aFile;
    }

    public async deleteFile(path: string) {
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (!file) {
                const fileExists = await this.fileExists(path);
                if (fileExists) {
                    const stat = await this.plugin.app.vault.adapter.stat(path);
                    if (stat.type == 'folder') {
                        return this.plugin.app.vault.adapter.rmdir(path, true);
                    } else {
                    return this.plugin.app.vault.adapter.remove(path);
                    }
                }
            }
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
        
        public childrenForFolder (path: string, type?: string) {
            if (type == 'folder') {
                return this.plugin.app.vault.adapter.list(path).then(g => g.folders)
            } else if (type == 'file') {
                return this.plugin.app.vault.adapter.list(path).then(g => g.files)
            }
            return this.plugin.app.vault.adapter.list(path).then(g => [...g.files, ...g.folders])
        }
        
}