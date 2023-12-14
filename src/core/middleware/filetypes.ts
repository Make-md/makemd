import { AFile } from "core/middleware/types/afile";
import { EventTypeToPayload } from "./dispatchers/dispatcher";
import { FilesystemMiddleware } from "./filesystem";

export interface FileTypeEventTypes extends EventTypeToPayload {
    "onFileMetadataChanged": { file: AFile },
    "onFileFragmentChanged": { file: AFile },
}

export interface FileTypeCache {
    [fragmentType: string]: any
}

export interface FileTypeContent {
    [fragmentType: string]: any
}


export abstract class FileTypeAdapter<T extends FileTypeCache, C extends FileTypeContent> {
    
    public supportedFileTypes: string[];
    public id: string;
    public initiate: (middleware: FilesystemMiddleware) => void;
    public middleware: FilesystemMiddleware;
    public parseCache: (file: AFile, refresh: boolean) => Promise<void>;
    public cache: Map<string, T>;
    public cacheTypes: (file: AFile) => (keyof T)[];
    public contentTypes: (file: AFile) => (keyof C)[];
    
    public newFile: (path: string, type: string, parent: string, content?: any) => Promise<AFile>;

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, cacheType: keyof T, query?: string) => T[typeof cacheType];
    
    public readContent: (file: AFile, contentType: keyof C, contentId: any) => Promise<C[typeof contentType]>;
    public newContent: (file: AFile, contentType: keyof C, name: string, content: C[typeof contentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, contentType: keyof C, contentId: any, content: (prev: C[typeof contentType]) => any) => void;
    public deleteContent: (file: AFile, contentType: keyof C, contentId: any) =>void;
    
}

