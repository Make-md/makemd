import { getDB, selectDB } from "adapters/mdb/db/db";
import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import { createSpace } from "core/superstate/utils/spaces";
import { SpaceDefGroup } from "core/types/space";
import { parseSortStrat } from "core/utils/parser";
import { ensureArray } from "core/utils/strings";
import MakeMDPlugin from "main";
import { TFile, TFolder } from "obsidian";
import { uniq } from "utils/array";
import { safelyParseJSON } from "utils/parsers";

export const migrate08 = async (plugin: MakeMDPlugin) => {
    const db = await getDB(plugin.mdbFileAdapter, await plugin.mdbFileAdapter.sqlJS(), plugin.obsidianAdapter.spacesDBPath);
    const currentSpaces = selectDB(db, "spaces")?.rows ?? []
    const currentSpaceItems = selectDB(db, "spaceItems")?.rows ?? []
const oldSpaceDefToSpaceMetadata = (name: string, oldDef: {
    type: 'focus' | 'smart' | 'folder' | 'tag',
    folder: string,
    value: string,
    filters: SpaceDefGroup[]
} ) : {links: string[], filters: SpaceDefGroup[], path: string} => {

    return {
        links: currentSpaceItems.filter(s => s.space == name).map(s => s.path),
        path: oldDef.type == 'focus' && oldDef.folder.length > 0 ? oldDef.folder : null,
        filters: oldDef.filters
    }
}
const homeSpaces : string[] = [];

const pinnedSpaces = plugin.superstate.settings.waypoints;
    const promises = currentSpaces.map((f => {
        const spaceIntermediary : {links: string[], filters: SpaceDefGroup[], path: string} = oldSpaceDefToSpaceMetadata(f.name, safelyParseJSON(f.def));

        if (spaceIntermediary.path) {
            const path = spaceIntermediary.path
            if (f.pinned == 'home') {
                homeSpaces.push(path)
            } else if (f.pinned == 'pinned') {   
                pinnedSpaces.push(path)
            }
            return;
        } else {
            const path = `${plugin.superstate.settings.spacesFolder}/${f.name}`;
            if (f.pinned == 'home' && homeSpaces.some(g => g != path)) {
                homeSpaces.push(path)
            } else if (f.pinned == 'pinned' && pinnedSpaces.some(g => g != path)) {
                pinnedSpaces.push(path)
            }
            if (plugin.superstate.spacesIndex.has(path))return
        return createSpace(plugin.superstate, plugin.superstate.settings.spacesFolder+'/'+f.name, {
        sort: parseSortStrat(f.sort),
        contexts: [],
        filters: spaceIntermediary.filters,
        links:  ensureArray(spaceIntermediary.links).filter(f => f)
    }
    ).then(f => {})
}}))
//convert all existing space/tag contexts
const spaceFolder = getAbstractFileAtPath(plugin.app, 'Context');
if (spaceFolder instanceof TFolder) {
    promises.push(...spaceFolder.children.map( (f) => {
    if (f instanceof TFile && f.extension == 'mdb') {
        const folderPath = `${plugin.superstate.settings.spacesFolder}/${f.basename}/.space`;

        return plugin.files.fileExists(folderPath).then(g => {
            if (!g)
            return plugin.files.createFolder(folderPath);
        }).then(g => plugin.app.vault.rename(f, folderPath + "/context.mdb"))
    }
    }))
}

//convert all existing folder contexts
const getAllFolders = (plugin: MakeMDPlugin) => {
    const folders: TFolder[] = [plugin.app.vault.getRoot()];
    const rootFolder = plugin.app.vault.getRoot();
    function recursiveFx(folder: TFolder) {
        for (const child of folder.children) {
            if (!folder.path.startsWith(plugin.superstate.settings.spacesFolder)) {
        if (child instanceof TFolder) {
            const childFolder: TFolder = child as TFolder;
            folders.push(child);
            if (childFolder.children) recursiveFx(childFolder);
            }
        }
    }
}
    recursiveFx(rootFolder);
    return folders.filter(f => f.children.some(g => g.name == 'context.mdb'));
  }
promises.push(...getAllFolders(plugin).map(f => {

const folderPath = f.path == '/' ? '.space' : `${f.path}/.space`;
        return plugin.files.createFolder(folderPath).then(g => plugin.app.vault.rename(getAbstractFileAtPath(plugin.app, f.path == '/' ? 'context.mdb' : `${f.path}/context.mdb`), folderPath + "/context.mdb"));
}));
await Promise.all(promises);

await createSpace(plugin.superstate, plugin.superstate.settings.spacesFolder+'/Home', {
    links: homeSpaces,
})
plugin.superstate.settings.waypoints = uniq([plugin.superstate.settings.spacesFolder+'/Home', '/', 'spaces://$tags',  ...pinnedSpaces]);
plugin.superstate.settings.activeView = '/'
plugin.superstate.settings.autoMigration08 = true;
plugin.saveSettings();
db.close();
}