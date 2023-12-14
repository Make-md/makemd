import { AFile, FileTypeAdapter, FilesystemMiddleware, PathLabel } from "makemd-core";
import { App, CachedMetadata, TFile, TFolder } from "obsidian";
import { uniq } from "utils/array";
import { parseMultiString, parseProperty } from "utils/parsers";
import { getAbstractFileAtPath, tFileToAFile } from "../utils/file";
import { frontMatterForFile } from "./frontmatter/fm";
import { frontMatterKeys } from "./frontmatter/frontMatterKeys";

type CachedMetadataContentTypes = {
    links: string;
    embeds: string;
    tags: string[];
    headings: string;
    sections: string;
    listItems: string;
    frontmatter: any;
    property: any;
    frontmatterLinks: string;
    blocks: string;
    label: string;
}

type CleanCachedMetadata = Omit<CachedMetadata, 'tags'> & { tags: string[], label: PathLabel }

export class ObsidianMarkdownFiletypeAdapter implements FileTypeAdapter<CleanCachedMetadata, CachedMetadataContentTypes> {
    
    public id = "metadata.obsidian.md"
    public cache : Map<string, CleanCachedMetadata>;
    public supportedFileTypes = ['md'];
    public middleware: FilesystemMiddleware;

    public constructor (public app: App) {
        this.app = app;
    }
    
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
        
    }
    public metadataChange (file: TFile) {
        this.parseCache(tFileToAFile(file), true);
        
    }
    public async parseCache (file: AFile, refresh?: boolean) {
        if (!file) return;
        const fCache = this.app.metadataCache.getCache(file.path);
        if (!fCache) return;
            const rt = [];
                if (fCache && fCache.tags)
                rt.push(...(fCache.tags?.map((f) => f.tag) ?? []));
                if (fCache && fCache.frontmatter?.tags)
                rt.push(
                    ...(typeof fCache.frontmatter?.tags === "string"
                    ? parseMultiString(fCache.frontmatter.tags.replace(/ /g, ""))
                    : Array.isArray(fCache.frontmatter?.tags)
                    ? fCache.frontmatter?.tags ?? []
                    : []
                    )
                    .filter((f) => typeof f === "string")
                    .map((f) => "#" + f)
                );
                if (fCache && fCache.frontmatter?.tag)
                rt.push(
                    ...(typeof fCache.frontmatter?.tag === "string"
                    ? parseMultiString(fCache.frontmatter.tag.replace(/ /g, ""))
                    : Array.isArray(fCache.frontmatter?.tag)
                    ? fCache.frontmatter?.tag ?? []
                    : []
                    )
                    .filter((f) => typeof f === "string")
                    .map((f) => "#" + f)
                );
        const updatedCache = {...fCache, 
            tags: rt,
            property: fCache.frontmatter,
            label: {
            name: file.name,
            
            sticker: fCache.frontmatter?.[this.middleware.plugin.superstate.settings.fmKeySticker],
            color: fCache.frontmatter?.[this.middleware.plugin.superstate.settings.fmKeyColor],
        }}

        this.cache.set(file.path, updatedCache);
        this.middleware.updateFileCache(file.path, updatedCache, refresh);
    }
    private metadataKeys = ['property', 'links', 'embeds', 'tags', 'headings', 'sections', 'listItems', 'frontmatter', 'frontmatterPostion', 'frontmatterLinks', 'blocks'] as Array<keyof CachedMetadata>;
    public cacheTypes (file: AFile) : (keyof CleanCachedMetadata)[] {
        return this.metadataKeys;
    }
    public contentTypes (file: AFile) {
        return ["tags", 'frontmatter', 'property', 'label'] as Array<keyof CachedMetadataContentTypes>;
    }
    public getCacheTypeByRefString (file: AFile, refString: string) {
        const refType = refString.charAt(0);
        if (refType == '^') {
            return "blocks"
        } else {
            return 'headings'
        }
    }
    public getCache (file: AFile, fragmentType: keyof CleanCachedMetadata, query?: any) {
        return this.cache.get(file.path)?.[fragmentType] as CleanCachedMetadata[typeof fragmentType]
    }

    public async readContent (file: AFile, fragmentType: keyof CachedMetadataContentTypes, fragmentId: any) {
        if (fragmentType == 'tags') {
            const fCache = this.app.metadataCache.getFileCache(getAbstractFileAtPath(this.app, file.path) as TFile)
            const rt = [];
                if (fCache && fCache.tags)
                rt.push(...(fCache.tags?.map((f) => f.tag) ?? []));
                if (fCache && fCache.frontmatter?.tags)
                rt.push(
                    ...(typeof fCache.frontmatter?.tags === "string"
                    ? parseMultiString(fCache.frontmatter.tags.replace(/ /g, ""))
                    : Array.isArray(fCache.frontmatter?.tags)
                    ? fCache.frontmatter?.tags ?? []
                    : []
                    )
                    .filter((f) => typeof f === "string")
                    .map((f) => "#" + f)
                );
                if (fCache && fCache.frontmatter?.tag)
                rt.push(
                    ...(typeof fCache.frontmatter?.tag === "string"
                    ? parseMultiString(fCache.frontmatter.tag.replace(/ /g, ""))
                    : Array.isArray(fCache.frontmatter?.tag)
                    ? fCache.frontmatter?.tag ?? []
                    : []
                    )
                    .filter((f) => typeof f === "string")
                    .map((f) => "#" + f)
                );
            return uniq(rt) ?? [];
        }
        if (fragmentType == 'frontmatter' || fragmentType == 'property' || fragmentType == 'label') {
            const tfile = getAbstractFileAtPath(this.app, file.path);
            const fm = frontMatterForFile(this.app, tfile);
            const fmKeys = frontMatterKeys(fm);
            const rows = fmKeys.reduce(
                (p, c) => ({ ...p, [c]: parseProperty(c, fm[c]) }),
                {}
            );
            return rows;
            
        }
    }

    public async newFile (parent: string, name: string, type: string)  {

        let parentFolder = getAbstractFileAtPath(this.app, parent);
        if (!parentFolder) {
            await this.middleware.createFolder(parent);
            parentFolder = getAbstractFileAtPath(this.app, parent);
        }
        return this.app.fileManager.createNewMarkdownFile(
        parentFolder ? (parentFolder instanceof TFolder) ? parentFolder : parentFolder.parent : this.app.vault.getRoot(),
        name).then(f => tFileToAFile(f))
    }
    public newContent: (file: AFile, fragmentType: keyof CachedMetadataContentTypes, fragmentId: string, content: CachedMetadataContentTypes[keyof CachedMetadataContentTypes], options: { [key: string]: any; }) => Promise<any>;
    
    public async saveContent (file: AFile, fragmentType: keyof CachedMetadataContentTypes, fragmentId: string, content: (prev: any) => any) {
        if (fragmentType == 'label') {
            const afile = this.app.vault.getAbstractFileByPath(file.path);
            if (afile && afile instanceof TFile) {
                if (this.app.fileManager.processFrontMatter) {
                await this.app.fileManager.processFrontMatter(afile, (frontmatter: any) => {
                    if (fragmentId == 'sticker') {
                        frontmatter[this.middleware.plugin.superstate.settings.fmKeySticker] = content(frontmatter);
                    } else if (fragmentId == 'color') {
                        frontmatter[this.middleware.plugin.superstate.settings.fmKeyColor] = content(frontmatter);
                    }
                    
                    
                });
                await this.parseCache(file, true);
                }
            }
        }
        if (fragmentType == 'frontmatter' || fragmentType == 'property') {
            
            const afile = this.app.vault.getAbstractFileByPath(file.path);
            if (afile && afile instanceof TFile) {
                if (this.app.fileManager.processFrontMatter) {
                await this.app.fileManager.processFrontMatter(afile, (frontmatter: any) => {
                    const newFrontmatter = content(frontmatter);

                    Object.keys(newFrontmatter).forEach((f) => {
                            frontmatter[f] = newFrontmatter?.[f];
                    })

                });
                await this.parseCache(file, true);
                }
            }
        }
        
        return;
    }
    public async deleteContent (file: AFile, fragmentType: keyof CachedMetadataContentTypes, fragmentId: any) {
        if (fragmentType == 'frontmatter' || fragmentType == 'property') {
            const afile = this.app.vault.getAbstractFileByPath(file.path);
            if (afile && afile instanceof TFile) {
                if (this.app.fileManager.processFrontMatter) {
                return this.app.fileManager.processFrontMatter(afile, (frontmatter: any) => {
                    delete frontmatter[fragmentId]
                });
                }
            }
        }
        
        return;
    }
    
}