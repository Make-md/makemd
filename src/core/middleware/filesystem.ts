
import { AFile } from "shared/types/afile";
import { PathCache } from "shared/types/caches";
import { EventDispatcher, EventTypeToPayload } from "../../shared/utils/dispatchers/dispatcher";
import { FileTypeAdapter, FileTypeCache, FileTypeContent } from "./filetypes";

export type FileCache = PathCache & {
    file: AFile,
    [key: string] : FileTypeCache,
}

export interface FileSystemEventTypes extends EventTypeToPayload {
    "onCreate": { file: AFile },
    "onRename": { file: AFile, oldPath: string},
    "onModified": { file: AFile },
    "onDelete": { file: AFile },
    "onSpaceUpdated": { path: string, type: string },
    "onCacheUpdated": { path: string },
    "onFocusesUpdated": null,
    "onFilesystemIndexed": null,
}

export abstract class FileSystemAdapter {
    
    public cache: Map<string, FileCache>;
    public initiate: (middleware: FilesystemMiddleware) => void;
    public middleware: FilesystemMiddleware;
    public getRoot: () => Promise<AFile>;
    public keysForCacheType: (cacheType: string) => string[];
    public allFiles: () => AFile[];
    public allContent: () => any[];
    public resourcePathForPath: (path: string) => string;
    public copyFile: (folder: string, path: string, newName?: string) => Promise<string>;
    public parentPathForPath: (path: string) => string;
    public updateFileCache: (path: string, cache: FileTypeCache, refresh: boolean) => void;
    public writeTextToFile: (path: string, content: string) => Promise<void>
    public readTextFromFile:  (path: string) => Promise<string>;
    public writeBinaryToFile: (path: string, buffer: ArrayBuffer) => Promise<void>;
    public readBinaryToFile: (path: string) => Promise<ArrayBuffer>;
    public updateFileLabel: (path: string, key: string, value: any) => void;
    public renameFile: (path: string, newPath: string) => Promise<string>;
    public createFolder: (path: string) => Promise<AFile>
    public fileExists: (path: string) => Promise<boolean>
    public childrenForFolder: (path: string, type?: string) => Promise<string[]>
    public getFile: (path: string, source?: string) => Promise<AFile>
    public getFileCache: (path: string, source?: string) => FileCache
    public deleteFile:(path: string) => Promise<void>
    public readAllTags: () => string[];
    public addTagToFile: (path: string, tag: string) => Promise<void>
    public renameTagForFile: (path: string, oldTag: string, newTag: string) => Promise<void>
    public removeTagFromFile: (path: string, tag: string) => Promise<void>
    public filesForTag: (tag: string) => string[]
    public resolvePath: (path: string, source: string) => string;
    
}

export class FilesystemMiddleware {
    public eventDispatch: EventDispatcher<FileSystemEventTypes>;
    public primary: FileSystemAdapter;
    public filesystems: FileSystemAdapter[] = []
    public filetypes: FileTypeAdapter<FileTypeCache, FileTypeContent>[] = []
    public static create(): FilesystemMiddleware {
        return new FilesystemMiddleware();
    }
    private constructor() {
        //Initialize
        this.eventDispatch = new EventDispatcher();
        
    }

    public loadPath  = async (path: string) : Promise<void> => {
        const file = await this.getFile(path);
        if (!file) return null;
        this.filetypeAdaptersForFile(file).forEach((adapter) => {
            if (adapter.loadFile)
            adapter.loadFile(file);
        });
        return null;
    }

    public resolvePath (path: string, source: string) {
        return this.primary.resolvePath(path, source);
    }

    public keysForCacheType (cacheType: string) {
        return this.primary.keysForCacheType(cacheType);
    }

    
    public allTags () {
        return this.primary.readAllTags();
    }

    public fileFragmentChanged (file: AFile) {
        this.eventDispatch.dispatchEvent("onFileFragmentChanged", { file })
    }

    public initiateFileSystemAdapter (adapter: FileSystemAdapter, primary: boolean) {
        adapter.initiate(this);
        if (primary) {
            this.primary = adapter;
        }
        this.filesystems.push(adapter);
    }

    public initiateFiletypeAdapter (adapter: FileTypeAdapter<FileTypeCache, FileTypeContent>) {
        adapter.initiate(this);
        this.filetypes.push(adapter);
    }

    public filetypeAdaptersForFile (file: AFile) {
        if (!file) return [];
        return this.filetypes.filter(f => f.supportedFileTypes.includes(file.extension));
    }

    private filetypeAdaptersForFileFragments (file: AFile, fragmentType: string) {
        return this.filetypeAdaptersForFile(file).filter(f => f.contentTypes ? f.contentTypes(file).includes(fragmentType) : false)
    }

    public getFileCacheTypeByRefString (file: AFile, refString: string) {
        const adapters = this.filetypeAdaptersForFile(file)
            return adapters.reduce((p,c) => {
                if (p) return p;
                return c.getCacheTypeByRefString(file, refString);
            }, null)
    
    }

    public allCaches () {
        return this.primary.cache
    }
    
    public allFiles () {
        return this.primary.allFiles();
    }
    public resourcePathForPath (path: string) {
        return this.adapterForPath(path).resourcePathForPath(path);
    }
    public parentPathForPath (path: string) {

        return this.adapterForPath(path).parentPathForPath(path);
    }
    
    public async createFileCache (path: string) {
        const file = await this.getFile(path);
        for (const adapter of this.filetypeAdaptersForFile(file)) {
            if (adapter.parseCache)
            await adapter.parseCache(file, false);
        }

        
    }
    
    public getFileCache (path: string) {
        return this.adapterForPath(path).getFileCache(path);
    }
    

    public getFileContent (file: AFile, contentType: string, contentId: any) {
        const adapters = this.filetypeAdaptersForFile(file).filter(f => f.contentTypes(file).includes(contentType))
        if (adapters.length >= 1) {
            return adapters[0].readContent(file, contentType, contentId);
        }
    }

    public updateFileCache (path: string, cache: FileTypeCache, refresh: boolean) {
        this.adapterForPath(path).updateFileCache(path, cache, refresh);
    }
    

    public readFileFragments (file: AFile, fragmentType: string, query?: string) {
        const adapters = this.filetypeAdaptersForFileFragments(file, fragmentType)
        if (adapters.length >= 1) {
            return adapters[0].readContent(file, fragmentType, query);
        }
    }

    public async newFile (parent: string, name: string, type: string, content?: any) : Promise<AFile> {
        // Construct the full path: parent/name.type
        

        // Find the appropriate file type adapter for this file type
        const adapter = this.filetypes.find(f => f.supportedFileTypes.includes(type));
        if (adapter?.newFile) {
            return adapter.newFile(parent, name, type, content);
        }
    }

    public newFileFragment (file: AFile, fragmentType: string, name: string, content: any, options?: {[key: string]: any}) {
        const adapters = this.filetypeAdaptersForFileFragments(file, fragmentType)
        if (adapters.length >= 1) {
            return adapters[0].newContent(file, fragmentType, name, content, options);
        }
        
    }

    public saveFileLabel (file: AFile, key: string, value: any) {
        const adapters = this.filetypeAdaptersForFileFragments(file, 'label');
        if (adapters.length >= 1) {
            return adapters[0].saveContent(file, 'label', key, () => value)
        } else {
            return this.primary.updateFileLabel(file.path, key, value);
        }
        
    }

    public saveFileFragment (file: AFile, fragmentType: string, fragmentId: any, saveContent: (prev: any) => any) {
        
        const adapters = this.filetypeAdaptersForFileFragments(file, fragmentType)
        if (adapters.length >= 1) {
            return adapters[0].saveContent(file, fragmentType, fragmentId, saveContent)
        }
        return false;
    }

    public deleteFileFragment (file: AFile, fragmentType: string, fragmentId: any) {
        const adapters = this.filetypeAdaptersForFileFragments(file, fragmentType)
        if (adapters.length >= 1) {
            return adapters[0].deleteContent(file, fragmentType, fragmentId)
        }
    }

    public onCreate (file: AFile) {
        this.eventDispatch.dispatchEvent("onCreate", { file })
    }

    public onModify (file: AFile) {
        this.eventDispatch.dispatchEvent("onModify", { file })
    }

    public onRename (file: AFile, oldPath: string) {
        this.eventDispatch.dispatchEvent("onRename", { file, oldPath })
    }

    public onDelete (file: AFile) {
        this.eventDispatch.dispatchEvent("onDelete", { file })
    }

    public onSpaceUpdated (path: string, type: string) {
        this.eventDispatch.dispatchEvent("onSpaceUpdated", { path, type })
    }

    public onFocusesUpdated () {
        this.eventDispatch.dispatchEvent("onFocusesUpdated", null)
    }

    public adapterForPath (path?: string) {
        return this.primary;
    } 

    public async getRoot() {
        return this.adapterForPath().getRoot();
    }

    public async copyFile(path: string, folder: string, newName?: string) {
        return this.adapterForPath(path).copyFile(path, folder, newName);
    }
    public async writeTextToFile (path: string, content: string) {
        return this.adapterForPath(path).writeTextToFile(path, content);
    }
    public async readTextFromFile (path: string) {
        return this.adapterForPath(path).readTextFromFile(path);
    }

    public async writeBinaryToFile (path: string, buffer: ArrayBuffer) {
        return this.adapterForPath(path).writeBinaryToFile(path, buffer)
    }

    public async readBinaryToFile (path: string) {
        return this.adapterForPath(path).readBinaryToFile(path)
    }
    
    public async renameFile (path: string, newPath: string) {
        return this.adapterForPath(path).renameFile(path, newPath)
    }

    

    public async createFolder (path: string) {
        return this.adapterForPath(path).createFolder(path)
    }
    public async childrenForFolder (path: string, type?: string) {
        return this.adapterForPath(path).childrenForFolder(path, type);
    }
    public async fileExists (path: string) {
        return this.adapterForPath(path).fileExists(path)
    }

    public async getFile(path: string, source?: string) {
        return this.adapterForPath(path).getFile(path, source)
    }

    public async deleteFile(path: string) {
        return this.adapterForPath(path).deleteFile(path)
    }

    public async addTagToFile (path: string, tag: string) {
        return this.adapterForPath(path).addTagToFile(path, tag)
    }
    public async renameTagForFile (path: string, oldTag: string, newTag: string) {
        return this.adapterForPath(path).renameTagForFile(path, oldTag, newTag)
    }
    public async removeTagFromFile (path: string, tag: string) {
        return this.adapterForPath(path).removeTagFromFile(path, tag)
    }
    public filesForTag (tag: string) {
        return this.primary.filesForTag(tag);
    }
}