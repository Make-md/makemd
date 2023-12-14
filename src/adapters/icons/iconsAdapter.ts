import MakeMDPlugin from "main";
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";

type IconTypeCache = {
    svg: string;
}

type IconTypeContent = {
    svg: string;
}
export class IconFileTypeAdapter implements FileTypeAdapter<IconTypeCache, IconTypeContent> {
    public constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
    }
    public supportedFileTypes = ['svg'];
    public id = 'icons.make.md';
    public middleware: FilesystemMiddleware;
    public cache: Map<string, IconTypeCache>;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }
    
    public async parseCache (file: AFile, refresh: boolean) {
        const newCache =  { svg: `@font-face {
            font-family: '${file.name}';
            src: url('${this.middleware.resourcePathForPath(file.path)}');
        }`}
        this.cache.set(file.path, newCache);
        this.middleware.updateFileCache(file.path, this.cache.get(file.path), refresh);
    }
    
    public cacheTypes (file: AFile) { return ['svg'] as Array<keyof IconTypeCache>}
    public contentTypes (file: AFile) { return ['svg'] as Array<keyof IconTypeContent>}
    
    public newFile: (path: string, type: string, parent: string, content?: any) => Promise<AFile>;

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof IconTypeContent, query?: string) => any;
    
    public async readContent (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any) {
        if (fragmentType == 'svg') {
            return this.cache.get(file.path)['svg'];
        }
        
    }
    public newContent:  (file: AFile, fragmentType: keyof IconTypeContent, name: string, content: IconTypeContent[typeof fragmentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any, content: (prev: IconTypeContent[typeof fragmentType]) => any) => void;
    public deleteContent: (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any) => void
    
}
