import MakeMDPlugin from "main";
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";

type ImageTypeCache = Record<never, never>

type ImageTypeContent = Record<never, never>
export class ImageFileTypeAdapter implements FileTypeAdapter<ImageTypeCache, ImageTypeContent> {
    public constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
    }
    public supportedFileTypes = ["png", "jpg", "jpeg", "webp"];
    public id = 'images.make.md';
    public middleware: FilesystemMiddleware;
    public cache: Map<string, ImageTypeCache>;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }
    
    public async parseCache (file: AFile, refresh: boolean) {
        if (!file) return;
        const label = this.middleware.getFileCache(file.path)?.label
        const updatedCache = { 
            label: {
            name: file.name,
            sticker: label?.sticker.length > 0 ? label.sticker : "ui//mk-make-image",
            color: label?.color,
        }}
        this.cache.set(file.path, updatedCache);
        this.middleware.updateFileCache(file.path, this.cache.get(file.path), refresh);
    }
    
    public cacheTypes (file: AFile) { return [] as Array<keyof ImageTypeCache>}
    public contentTypes (file: AFile) { return [] as Array<keyof ImageTypeContent>}
    
    public newFile: (path: string, type: string, parent: string, content?: any) => Promise<AFile>;

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof ImageTypeContent, query?: string) => never;
    public readContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any) => any
    public newContent: (file: AFile, fragmentType: keyof ImageTypeContent, name: string, content: ImageTypeContent[typeof fragmentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any, content: (prev: ImageTypeContent[typeof fragmentType]) => any) => void;
    public deleteContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any) => void
    
}
