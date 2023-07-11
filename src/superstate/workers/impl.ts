
// import { CachedMetadata } from "obsidian";
import { AFile, VaultItem } from "schemas/spaces";
import { parseContextTableToCache, parseMetadata } from "superstate/cacheParsers";
import { ContextsMetadataCache, FileMetadataCache, FolderNoteCache, SpaceCache } from "types/cache";
import { ContextInfo } from "types/contextInfo";
import { MDBTable } from "types/mdb";
import { MakeMDPluginSettings } from "types/settings";

export function parseFile (payload: {file: AFile, settings: MakeMDPluginSettings, contextsCache: Map<string, ContextsMetadataCache>, spacesCache: Map<string, SpaceCache>, vaultItem: VaultItem, metadataCache: any, resolvedLinks: any, folderNote: FolderNoteCache, oldMetadata: FileMetadataCache}) {
    const {file, settings, contextsCache, spacesCache, vaultItem, metadataCache, resolvedLinks, folderNote, oldMetadata} = payload;
    return parseMetadata(file, settings, contextsCache, spacesCache, vaultItem, metadataCache, resolvedLinks, folderNote, oldMetadata);
}

export function parseContext (payload: {context: ContextInfo, mdbTable: MDBTable, oldCache: ContextsMetadataCache}) {
    const {context, mdbTable, oldCache} = payload;
    return parseContextTableToCache(context, mdbTable, oldCache);
}

