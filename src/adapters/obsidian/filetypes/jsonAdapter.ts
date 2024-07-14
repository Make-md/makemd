
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";

import MakeMDPlugin from "main";
import { parseProperty, safelyParseJSON } from "utils/parsers";

type CachedMetadataContentTypes = {
    property: any;
    label: string;
}

export class JSONFiletypeAdapter implements FileTypeAdapter<Record<string, any>, CachedMetadataContentTypes> {
    public supportedFileTypes: string[] = ['json', 'mkit'];
    public id = 'json.make.md';
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
            sticker: label?.sticker?.length > 0 ? label.sticker : "ui//json",
            color: label?.color,
            preview: '',
            thumbnail: ''
        }}
        

        this.cache.set(file.path, updatedCache);
        this.middleware.updateFileCache(file.path, updatedCache, refresh);
    }
    public cache: Map<string, Record<string, any>>;
    public cacheTypes: (file: AFile) => string[];
    public contentTypes (file: AFile)  { return ["property", 'label'] as Array<keyof CachedMetadataContentTypes>;}
    public async newFile (parent: string, name: string, type: string, content: string) {
        const newPath = parent == '/' ? name+".json" : `${parent}/${name}.json`;

        if (!await this.middleware.fileExists(parent)) {
            await this.middleware.createFolder(parent);
        }
        await this.middleware.writeTextToFile(newPath, content ?? '')
        return this.middleware.getFile(newPath)
    }
    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: string, query?: string) => never;
    public async readContent (file: AFile, fragmentType: string, fragmentId: any) {
        if (fragmentType == 'property') {
            const cache = await this.middleware.readTextFromFile(file.path);
            return safelyParseJSON(cache) ?? {};
        }
        if (fragmentType == 'label') {
            const cache = await this.middleware.readTextFromFile(file.path);
            const fm = safelyParseJSON(cache) ?? {};
            const sticker = parseProperty("sticker", fm[this.plugin.superstate.settings.fmKeySticker])
               const color = parseProperty("color", fm[this.plugin.superstate.settings.fmKeyColor])
                const name = parseProperty("color", fm[this.plugin.superstate.settings.fmKeyAlias])[0]
                const rows : Record<string, any> = {};
                if (sticker?.length > 0) {
                    rows['sticker'] = sticker;
                }
                if (color?.length > 0) {
                    rows['color'] = color;
                }
                if (name?.length > 0) {
                    rows['name'] = name
                }
            return rows;
        }
        return null;
    }
    public newContent: (file: AFile, fragmentType: string, name: string, content: never, options: { [key: string]: any; }) => Promise<any>;
    public async saveContent (file: AFile, fragmentType: string, fragmentId: any, content: (prev: any) => any) {
        if (fragmentType == 'label') {
            const currentProperties = await this.readContent(file, fragmentType, fragmentId);
            
            if (fragmentId == 'sticker') {
                currentProperties[this.plugin.superstate.settings.fmKeySticker] = content(currentProperties);
            } else if (fragmentId == 'color') {
                currentProperties[this.plugin.superstate.settings.fmKeyColor] = content(currentProperties);
            } else if (fragmentId == 'name') {
                currentProperties[this.plugin.superstate.settings.fmKeyAlias] = [content(currentProperties)];
            }
        
        }
        if (fragmentType == 'property') {
            const currentProperties = await this.readContent(file, fragmentType, fragmentId);
            
            const newProperties = content(currentProperties);
            await this.middleware.writeTextToFile(file.path, JSON.stringify(newProperties));
        }
        return true;
    }
    public async deleteContent (file: AFile, fragmentType: string, fragmentId: any) {

        if (fragmentType == 'property') {
            const currentProperties = await this.readContent(file, fragmentType, fragmentId);
            delete currentProperties[fragmentId];
            await this.middleware.writeTextToFile(file.path, JSON.stringify(currentProperties));
        }
    }

}