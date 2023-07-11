import _ from "lodash";
import { AFile, Space, SpaceItem, VaultItem } from "schemas/spaces";
import { ContextsMetadataCache, FileMetadataCache, FolderNoteCache, SpaceCache } from "types/cache";
import { ContextInfo } from "types/contextInfo";
import { MDBTable } from "types/mdb";
import { MakeMDPluginSettings } from "types/settings";
import { uniq, uniqCaseInsensitive } from "utils/array";
import { detectYAMLType } from "utils/metadata/frontmatter/detectYAMLType";
import { frontMatterKeys } from "utils/metadata/frontmatter/frontMatterKeys";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { yamlTypeToMDBType } from "utils/metadata/frontmatter/yamlTypeToMDBType";
import { parseContextDefString, parseLinkString, parseMultiString } from "utils/parser";
import { fileByDef } from "utils/spaces/query";
import { contextDisplayName, spaceContextPathFromName } from "utils/strings";

type oMetadataCache = Partial<{ frontmatter: Partial<any>, tags: { tag: string }[], links: { link: string }[]}>

export const parseContextTableToCache = (context: ContextInfo, mdbTable: MDBTable, oldCache: ContextsMetadataCache) : { changed: boolean, cache: ContextsMetadataCache } => {
    if (!mdbTable) {
        return {changed: false, cache: {
            path: context.dbPath,
            info: context,
            name: contextDisplayName(context),
            sticker: '',
            banner: '',
            cols: [],
            files: [],
            rows: [],
            def: [],
            defContexts: [],
            outlinks: [],
            contexts: [],
        }}
    }
    const contextCols = mdbTable.cols?.filter(f => f.type.startsWith('context')) ?? [];
    const linkCols = mdbTable.cols?.filter(f => f.type.startsWith('link')) ?? [];
    const contexts = uniq(contextCols.map(f => f.value))
    const outlinks = uniq(mdbTable.rows.reduce((p, c) => uniq([...p, ...[...contextCols, ...linkCols].flatMap(f => parseMultiString(c[f.name]).map(f => parseLinkString(f)))]), []))
    const def = parseContextDefString(mdbTable.schema.def);
    const cache = {
        path: context.dbPath,
        info: context,
        name: contextDisplayName(context),
        sticker: '',
        banner: '',
        cols: mdbTable.cols,
        files: mdbTable.rows.map(f => f.File) ?? [],
        rows: mdbTable.rows ?? [],
        defContexts: def.filter(f => f.type=='tag').map(f => f.value),
        def,
        contexts: contexts,
        outlinks: outlinks
    }
    let changed = true;
    if (oldCache && _.isEqual(cache, oldCache)) {
        changed = true;
    }
    return {changed, cache}
}

const tagsForCachedMetadata = (fCache: oMetadataCache) : string[] => {
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
  };
export const fileMetadataToVaultItem = (cache: FileMetadataCache) : VaultItem => {
    return {
        path: cache.path,
        parent: cache.parent,
        color: cache.color,
        created: cache.ctime?.toString() ?? '',
        sticker: cache.sticker,
        folder: cache.isFolder ? 'true' : 'false',
        rank: cache.rank,
    }
}

export const parseSpaceCache = (space: Space, spaceItems: SpaceItem[]) : SpaceCache => {
return {
name: space.name,
space,
spaceItems
}
}



export const parseFileContetxs = (file: AFile, tags: string[], contextsCache: Map<string, ContextsMetadataCache>, spaces: string[]) => {
    const contexts : string[] = [];
    contexts.push(...tags.filter(t => contextsCache.has(t)))
    if (file.parent != '/')
    contexts.push(file.parent);
    spaces.forEach(space => 
    {
        if (contextsCache.has(spaceContextPathFromName(space))) {
            contexts.push(spaceContextPathFromName(space));
        }
    })
    return contexts;
}

export const parseMetadata = (file: AFile, settings: MakeMDPluginSettings, contextsCache: Map<string, ContextsMetadataCache>, spacesCache: Map<string, SpaceCache>, vaultItem: VaultItem, metadataCache: oMetadataCache, resolvedLinks: Record<string, string[]>, folderNote: FolderNoteCache, oldMetadata: FileMetadataCache) : { changed: boolean, cache: FileMetadataCache }  => {
    const cache : FileMetadataCache = { path: file.path, name: file.name };
    if (file.stat) {
        cache.ctime = file.stat.ctime;
        cache.mtime = file.stat.mtime;
        cache.size = file.stat.size;
        cache.extension = file.extension
    }
    const tags : string[] = [];
    const fileTags : string[] = tagsForCachedMetadata(metadataCache);
    
    if (contextsCache.has(file.parent)) {
        for (const def of contextsCache.get(file.parent).def) {
            if (def.type == 'tag') {
                tags.push(def.value);
            } 
        }
    }

    tags.push(...fileTags)
    let name = file.name;
    let sticker = vaultItem?.sticker ?? '';
    let color = vaultItem?.color ?? '';
    const rank = vaultItem?.rank ?? '';
    let folderSort = vaultItem?.folder ?? '';
    if (folderSort == 'true') {
        folderSort = '';
    }
    const parent = file.parent;
    const isFolder = file.isFolder
    const properties : Record<string, string> = {};
    const types : Record<string, string> = {};
    const inlinks = []
    const outlinks = []
    const fm = metadataCache?.frontmatter;
    if (metadataCache?.links) {
        outlinks.push(...metadataCache.links.map(f => f.link));
    }
    const metadataPath = folderNote && isFolder ? folderNote.folderNotePath : file.path

    for (const f of Object.keys(resolvedLinks)) {
        if (metadataPath in resolvedLinks[f]) {
            inlinks.push(f);
        }
    }
    let banner = '';
    if (fm) {
        
        const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
        const cols: Record<string, { type: string, name: string }> = fmKeys.reduce((p, c) => ({
            ...p, [c]: {
        name: c,
        type: yamlTypeToMDBType(detectYAMLType(fm[c], c)),
        }}), {});
        Object.keys(cols).forEach((c) => {
            properties[c] =  parseFrontMatter(c, fm[c]);
            types[c] = cols[c].type;
            if(cols[c].type.startsWith('link')) {
                outlinks.push(parseLinkString(properties[c]))
            }
        });
        banner = properties[settings.fmKeyBanner] ?? '';
        if (properties[settings.fmKeySticker]) {
            sticker = fm[settings.fmKeySticker];
        }
        if (properties[settings.fmKeyColor]) {
            color = fm[settings.fmKeyColor];
        }
        if (properties[settings.fmKeyAlias] && settings.spacesUseAlias) {
            name = fm[settings.fmKeyAlias];
        }
    }
    const fileCache = {
        ...cache,
        name,
        tags: uniq(tags),
        fileTags,
        folderNote,
        sticker,
        color,
        rank,
        parent,
        banner,
        isFolder,
        folderSort,
        frontmatter: properties,
        frontmatterTypes: types,
        inlinks,
        outlinks
    }
    const spaces : string[] = [];
    const spaceRanks : Record<string, string> = {}
    for (const [s, space] of spacesCache) {
        if (space.space.def.type == 'smart') {
            if (fileByDef(space.space.def, fileCache)) {
                spaces.push(s);
            }
        } else {
            if (space.space.def.folder?.length > 0) {
                if (space.space.def.folder == parent) {
                    spaces.push(s)
                    spaceRanks[s] = rank;
                }
            } else {
                const spaceItem = space.spaceItems.find(f => f.path == fileCache.path);
                if (spaceItem) {
                    spaces.push(s);
                    spaceRanks[s] = spaceItem.rank
                }
            }
        }
    }
    const contexts = parseFileContetxs(file, tags, contextsCache, spaces)
    const metadata = folderNote && !isFolder ? { ...fileCache, spaces: [] as string[], contexts: [] as string[]} : {...fileCache, spaces, contexts: uniq(contexts), spaceRanks};
    let changed = true;

    if (oldMetadata && _.isEqual(metadata, oldMetadata)) {
        
        changed = false;
    }
    return {changed, cache: metadata }
}