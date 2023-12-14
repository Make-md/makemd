
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";

import MakeMDPlugin from "main";
import { TFolder } from "obsidian";
import { getAbstractFileAtPath, uniqueFileName } from "../utils/file";

export class ObsidianCanvasFiletypeAdapter implements FileTypeAdapter<Record<string, any>, Record<string, never>> {
    public supportedFileTypes: string[] = ['canvas'];
    public id = 'canvas.obsidian.md';
    public constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
        this.cache = new Map();
    }
    
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
    }
    public middleware: FilesystemMiddleware;
    public async parseCache (file: AFile, refresh?: boolean) {
        if (!file) return;
        const label = this.middleware.getFileCache(file.path)?.label
        // const contents = safelyParseJSON(await this.plugin.app.vault.cachedRead(getAbstractFileAtPath(this.plugin.app, file.path)as TFile))
        const updatedCache = { 
            label: {
            name: file.name,
            sticker: label?.sticker.length > 0 ? label.sticker : "ui//mk-ui-canvas",
            color: label?.color,
        }}
        

        this.cache.set(file.path, updatedCache);
        this.middleware.updateFileCache(file.path, updatedCache, refresh);
    }
    public cache: Map<string, Record<string, any>>;
    public cacheTypes: (file: AFile) => string[];
    public contentTypes: (file: AFile) => string[];
    public async newFile (parent: string, name: string, type: string) {
        if (!name) {
            name = uniqueFileName('Untitled', 'Untitled', 'canvas', getAbstractFileAtPath(this.plugin.app, parent) as TFolder);
        }
        const newPath = `${parent}/${name}`;
        await this.middleware.writeTextToFile(`${parent}/${name}`, '{}')
        return this.middleware.getFile(newPath)
    }
    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: string, query?: string) => never;
    public readContent: (file: AFile, fragmentType: string, fragmentId: any) => never;
    public newContent: (file: AFile, fragmentType: string, name: string, content: never, options: { [key: string]: any; }) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: string, fragmentId: any, content: (prev: never) => any) => void;
    public deleteContent: (file: AFile, fragmentType: string, fragmentId: any) => void;

}