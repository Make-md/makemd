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
    
    public async newFile(parent: string, name: string, type: string, content?: any): Promise<AFile> {
        // Ensure the file name has the correct extension
        const fileName = name.includes('.') ? name : `${name}.${type}`;
        const fullPath = parent ? `${parent}/${fileName}` : fileName;
        
        // Ensure parent directory exists
        if (parent && !(await this.middleware.fileExists(parent))) {
            await this.middleware.createFolder(parent);
        }
        
        // SVG files should be saved as text
        const textContent = typeof content === 'string' ? content : 
                           content instanceof ArrayBuffer ? new TextDecoder().decode(content) :
                           content?.toString() || '';
        await this.middleware.writeTextToFile(fullPath, textContent);
        
        // Return the created file
        return await this.middleware.getFile(fullPath);
    }

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof IconTypeContent, query?: string) => any;
    
    public async readContent (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any) {
        if (fragmentType == 'svg') {
            return this.cache.get(file.path)['svg'];
        }
        
    }
    public newContent:  (file: AFile, fragmentType: keyof IconTypeContent, name: string, content: IconTypeContent[typeof fragmentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any, content: (prev: IconTypeContent[typeof fragmentType]) => any) => Promise<boolean>;
    public deleteContent: (file: AFile, fragmentType: keyof IconTypeContent, fragmentId: any) => void
    
}
