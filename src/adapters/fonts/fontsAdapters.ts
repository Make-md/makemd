import MakeMDPlugin from "main";
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";

type FontTypeCache = {
    css: string;
}

type FontTypeContent = {
    css: string;
    fonts: string[];
}
export class FontsFileTypeAdapter implements FileTypeAdapter<FontTypeCache, FontTypeContent> {
    private constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
    }
    public supportedFileTypes = ['otf', 'ttf', 'woff', 'woff2'];
    public id = 'fonts.make.md';
    public middleware: FilesystemMiddleware;
    public cache: Map<string, FontTypeCache>;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }
    
    public async parseCache (file: AFile, refresh: boolean) {
        const newCache =  { css: `@font-face {
            font-family: '${file.name}';
            src: url('${this.middleware.resourcePathForPath(file.path)}');
        }`}
        this.cache.set(file.path, newCache);
        this.middleware.updateFileCache(file.path, this.cache.get(file.path), refresh);
    }
    
    public cacheTypes (file: AFile) { return ['css'] as Array<keyof FontTypeCache>}
    public contentTypes (file: AFile) { return ['css'] as Array<keyof FontTypeContent>}
    
    public newFile: (path: string, type: string, parent: string, content?: any) => Promise<AFile>;

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof FontTypeContent, query?: string) => any;
    
    public async readContent (file: AFile, fragmentType: keyof FontTypeContent, fragmentId: any) {
        if (fragmentType == 'css') {
            return this.cache.get(file.path)['css'];
        }
        if (fragmentType == 'fonts') {
            return [...this.cache.keys()];
        }
    }
    public newContent: (file: AFile, fragmentType: keyof FontTypeContent, name: string, content: FontTypeContent[typeof fragmentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: keyof FontTypeContent, fragmentId: any, content: (prev: FontTypeContent[typeof fragmentType]) => any) => Promise<boolean>;
    public deleteContent: (file: AFile, fragmentType: keyof FontTypeContent, fragmentId: any) => void
    
}
