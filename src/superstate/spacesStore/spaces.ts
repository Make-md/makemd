import { VaultChangeModal } from "components/ui/modals/vaultChangeModals";
import i18n from "i18n";
import _ from "lodash";
import MakeMDPlugin from "main";
import { Notice, TAbstractFile, TFile, TFolder } from "obsidian";
import {
  Space,
  SpaceItem,
  VaultItem,
  spaceItemsSchema,
  spaceSchema,
  vaultSchema
} from "schemas/spaces";
import { Database } from "sql.js";
import { fileMetadataToVaultItem } from "superstate/cacheParsers";
import { FileMetadataCache } from "types/cache";
import { DBRows, DBTables } from "types/mdb";
import { MakeMDPluginSettings } from "types/settings";
import { Path } from "types/types";
import { insert } from "utils/array";
import { deleteSpaceContext, renameSpaceContextFile } from "utils/contexts/mdb";
import { saveFrontmatterValue } from "utils/metadata/frontmatter/fm";
import { parseSortStrat } from "utils/parser";
import { serializeSpace } from "utils/serializer";
import { compareByField, excludeVaultItemPredicate } from "utils/tree";
import {
  replaceDB
} from "../../utils/db/db";
import {
  createNewCanvasFile,
  createNewMarkdownFile,
  defaultNoteFolder,
  getAbstractFileAtPath,
  getAllAbstractFilesInVault,
  getFolderFromPath,
  moveFile,
  platformIsMobile
} from "../../utils/file";

export const rebuildIndex = async (plugin: MakeMDPlugin, save?: boolean) => {
  console.time("Make.md Vault Index");
  const newTables = indexCurrentFileTree(plugin, plugin.index.vaultDBCache ?? [], plugin.index.spacesItemsDBCache ?? []);
  if (save && (!_.isEqual(newTables.vault.rows, plugin.index.vaultDBCache) || !_.isEqual(newTables.spaceItems.rows, plugin.index.spacesItemsDBCache))) {    
    await plugin.index.saveSpacesDatabaseToDisk(newTables, save);
  }
  plugin.index.initialize();
  console.timeEnd("Make.md Vault Index");
};

export interface TreeNode {
  id: string;
  parentId: string;
  depth: number;
  index: number;
  space: string;
  sortable?: boolean;
  path: string;
  item?: FileMetadataCache;
  file?: TAbstractFile;
  spaceItem?: Space;
  childrenCount: number;
  collapsed: boolean;
}
export const spaceToTreeNode = (
  space: Space,
  collapsed: boolean,
  sortable: boolean,
): TreeNode => {
  return {
    id: space.name,
    spaceItem: space,
    parentId: null,
    depth: 0,
    index: 0,
    space: space.name,
    path: space.name+'//',
    item: null,
    collapsed: collapsed,
    sortable: sortable,
    childrenCount: 0,
  };
};
export const vaulItemToTreeNode = (
  item: FileMetadataCache,
  space: string,
  path: string,
  depth: number,
  i: number,
  collapsed: boolean,
  sortable: boolean,
  childrenCount: number
) : TreeNode => ({
  item: item,
  file: getAbstractFileAtPath(app, item.path),
  space,
  id: (space == "/" ? "" : space) + "//" + item.path,
  parentId: (space == "/" ? "" : space) + "//" + path,
  depth: depth,
  path,
  index: i,
  collapsed,
  sortable,
  childrenCount,
});

export const spaceRowHeight = (plugin: MakeMDPlugin) => {
  return platformIsMobile() ? 40 : plugin.settings.spaceRowHeight;
}

export const folderSortFn =
  (sortStrategy: string, direction: boolean) =>
  (a: FileMetadataCache, b: FileMetadataCache) => {
    if (sortStrategy == "rank") {
      return (a.rank ?? '').localeCompare(b.rank ?? '', undefined, { numeric: true });
    }
    const sortFns = [
      compareByField("isFolder", false),
      compareByField(sortStrategy, direction),
    ];
    return sortFns.reduce((p, c) => {
      return p == 0 ? c(a, b) : p;
    }, 0);
  };
export const flattenedTreeFromVaultItems = (
  root: string,
  space: string,
  vaultItems: Record<string, FileMetadataCache[]>,
  openNodes: string[],
  depth: number,
  sortStrategy: string,
  direction: boolean
): TreeNode[] => {
  if (!vaultItems[root]) {
    return [];
  }

  const flattenTree = (
    path: string,
    vaultItems: Record<string, FileMetadataCache[]>,
    openNodes: string[],
    depth: number,
    index: number,
    folderSort: string
  ) => {
    const items: TreeNode[] = [];
    let i = index;
    
    const [sortStrat, dir] = folderSort.length > 0 ? parseSortStrat(folderSort) : [sortStrategy, direction];
    vaultItems[path]
      .sort(folderSortFn(sortStrat, dir))
      .forEach((item) => {
        const collapsed = !openNodes.includes(item.path);
        i = i + 1;
        const newItems = [];
        if (vaultItems[item.path] && !collapsed) {
          newItems.push(
            ...flattenTree(item.path, vaultItems, openNodes, depth + 1, i, item.folderSort)
          );
        }
        const node = vaulItemToTreeNode(
          item,
          space,
          path,
          depth,
          i,
          collapsed,
          sortStrategy == "rank",
          newItems.length
        );
        if (node.file) newItems.splice(0, 0, node);
        items.push(...newItems);
      });
    return items;
  };
  return flattenTree(root, vaultItems, openNodes, depth, 0, '');
};

export const vaultItemForPath = (
  plugin: MakeMDPlugin,
  path: string
): VaultItem => {
  if (!path) return null;
  return plugin.index.vaultDBCache.find(f => f.path == path) as VaultItem;
};

export const saveFileSticker = async (
  plugin: MakeMDPlugin,
  path: string,
  sticker: string
) => {
  if (plugin.settings.spacesEnabled)
  {
    const newVaultDB = plugin.index.vaultDBCache.map(f => f.path == path ? {...f, sticker } : f)
    await plugin.index.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: newVaultDB}})
  } 
    saveFrontmatterValue(
      plugin,
      path,
      plugin.settings.fmKeySticker,
      sticker,
      "text",
      true
    )
  plugin.index.reloadFile(getAbstractFileAtPath(app, path)).then(f => plugin.index.broadcast('space'));
};

export const saveFolderSort = async (
  plugin: MakeMDPlugin,
  path: string,
  sort: string
) => {
  if (plugin.settings.spacesEnabled)
  {
    const newVaultDB = plugin.index.vaultDBCache.map(f => f.path == path ? {...f, folder: sort } : f)
  await plugin.index.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: newVaultDB}})
  plugin.index.reloadFile(getAbstractFileAtPath(app, path)).then(f => plugin.index.broadcast('vault'));
}
}

export const saveFileColor = async (
  plugin: MakeMDPlugin,
  path: string,
  color: string
) => {
  if (plugin.settings.spacesEnabled)
  {
    const newVaultDB = plugin.index.vaultDBCache.map(f => f.path == path ? {...f, color } : f)
  await plugin.index.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: newVaultDB}})
}
saveFrontmatterValue(
  plugin,
  path,
  plugin.settings.fmKeyColor,
  color,
  "text",
  true
)
  plugin.index.reloadFile(getAbstractFileAtPath(app, path)).then(f => plugin.index.broadcast('space'));
};

export const saveSpaceSticker = async (
  plugin: MakeMDPlugin,
  name: string,
  sticker: string
) => {
  const newSpaceDB = plugin.index.spacesDBCache.map(f => f.name == name ? {...f, sticker } : f)
  await plugin.index.saveSpacesDatabaseToDisk({spaces: { ...spaceSchema, rows: newSpaceDB}})
  plugin.index.reloadSpace(name);
};

export const updateFileRank = async (
  plugin: MakeMDPlugin,
  item: FileMetadataCache,
  rank: number
) => {
    let fixedRank = rank;
    if (parseInt(item.rank) > rank) fixedRank = rank + 1;
    const newItems = insert(
      plugin.index.vaultDBCache.filter((f) => f.parent == item.parent).filter((f) => f.path != item.path).map((f, i) => f.rank ? f : {...f, rank: i.toString()} ).sort((a, b) =>
      (a.rank).localeCompare(b.rank, undefined, { numeric: true })
    ),
      fixedRank,
      item
    ).map((f, index) => ({ path: f.path, rank: index.toString() }));
    const newVaultDB = plugin.index.vaultDBCache.map(f => {
      const newItem = newItems.find(g => g.path == f.path)
      if (newItem) {
        return {...f, ...newItem}
      }
       return f
    })
    await plugin.index.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: newVaultDB}})
    const promises = newItems.map(f => plugin.index.reloadFile(getAbstractFileAtPath(app, f.path)));
    await Promise.all(promises)
    // const promises = newItems.map(f => plugin.index.filesIndex.set(f.path, { ...plugin.index.filesIndex.get(f.path), rank: f.rank}));
    // await Promise.all(promises)
    plugin.index.broadcast('space');
};

export const moveAFileToNewParentAtIndex = async (
  plugin: MakeMDPlugin,
  item: FileMetadataCache,
  newParent: string,
  index: number
) => {
  
  //pre-save before vault change happens so we can save the rank
  const currFile = getAbstractFileAtPath(app, item.path);
  const newPath =
    newParent == "/" ? currFile.name : newParent + "/" + currFile.name;
  const newItem = {
    ...fileMetadataToVaultItem(item),
    path: newPath,
    parent: newParent,
    rank: index.toString(),
  };
  if (getAbstractFileAtPath(app, newPath)) {
    new Notice(i18n.notice.fileExists);
    return;
  }
    const allRows = plugin.index.vaultDBCache.filter(f => f.parent == newParent)
    const rows = insert(
      allRows.sort((a, b) =>
        (a.rank ?? '').localeCompare(b.rank ?? '', undefined, { numeric: true })
      ) ?? [],
      index,
      newItem
    ).map((f, i) => ({ ...f, rank: i.toString() })) as VaultItem[];
    const newVaultTable = [...plugin.index.vaultDBCache, newItem].filter(f => f.path != item.path).map(f => {
      const newItem = rows.find(g => g.path == f.path)
      if (newItem) {
        return {...f, ...newItem}
      }
       return f
    });
    await plugin.index.saveSpacesDatabaseToDisk({vault: {...vaultSchema, rows: newVaultTable}});
    const afile = getAbstractFileAtPath(app, item.path);
    
    await moveFile(getAbstractFileAtPath(app, newParent) as TFolder, afile);
    const promises = rows.map(f => plugin.index.reloadFile(getAbstractFileAtPath(app, f.path)));
    await Promise.all(promises)
    plugin.index.broadcast('space');
  
};

export const insertSpaceAtIndex = async (
  plugin: MakeMDPlugin,
  newSpace: Space,
  rank: number,
) => {
  
  const spaces = plugin.index.allSpaces();
  const spaceExists = spaces.find((f) => f.name == newSpace.name);
  let fixedRank = rank;
  let newSpaceRows = plugin.index.spacesDBCache;
  if (spaceExists) {
    const newRow = { ...serializeSpace(spaceExists), ...serializeSpace(newSpace) };
    newSpaceRows = newSpaceRows.map(f => f.name == newRow.name ? newRow : f);
    if (parseInt(spaceExists.rank) < rank) fixedRank = rank - 1;
  } else {
    const newRow = serializeSpace(newSpace);
    newSpaceRows.push(newRow);
  }
  const newSpaces = insert(
    spaces.filter((f) => f.name != newSpace.name),
    fixedRank,
    newSpace
  ).map((f, index) => ({ name: f.name, rank: index.toString() }));
  newSpaceRows = newSpaceRows.map(f => {
    const foundSpace = newSpaces.find(s => s.name == f.name)
    if (foundSpace) {
      return {
        ...f,
        rank: foundSpace.rank
      }
    }
    return f;
  });
  
  await plugin.index.saveSpacesDatabaseToDisk({ spaces: { ...spaceSchema, rows: newSpaceRows} });

  plugin.index.initializeSpaces().then(f => plugin.index.initalizeFiles());
};

export const insertSpaceItemAtIndex = async (
  plugin: MakeMDPlugin,
  spaceName: string,
  path: string,
  rank: number
) => {
  const space = plugin.index.spacesIndex.get(spaceName)?.space;
  if (!space) return;
  const newSpace: SpaceItem = {
    space: space.name,
    path: path,
    rank: rank.toString(),
  };
  const spaceExists = plugin.index.spacesItemsDBCache.filter(f => f.space == space.name)
  const pathExists = spaceExists.find((f) => f.path == path);
  let fixedRank = rank;
  let newSpaceItemsRows = plugin.index.spacesItemsDBCache;
  if (!pathExists) {
    newSpaceItemsRows.push(newSpace)
    fixedRank = rank + 1;
  } else {
    if (parseInt(pathExists.rank) > rank) fixedRank = rank + 1;
  }
  const newSpaceItems = insert(
    spaceExists.filter((f) => f.path != path),
    fixedRank,
    newSpace
  ).map((f, index) => ({
    space: f.space,
    path: f.path,
    rank: index.toString(),
  }));
  newSpaceItemsRows = newSpaceItemsRows.map(f => {
    if (f.space != space.name)
    return f;
    const foundItem = newSpaceItems.find(s => s.path == f.path)
    if (foundItem) {
      return {
        ...f,
        ...foundItem
      }
    }
    return f;
  });
  await plugin.index.saveSpacesDatabaseToDisk({ spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  await plugin.index.reloadSpace(space.name)
  const promises = newSpaceItemsRows.map(f => plugin.index.reloadFile(getAbstractFileAtPath(app, f.path)));
    await Promise.all(promises)
    plugin.index.broadcast('vault');
};

export const saveSpace = async (
  plugin: MakeMDPlugin,
  space: string,
  newSpace: Space
) => {
  const newSpaceRows = plugin.index.spacesDBCache.map(f => f.name == space ? serializeSpace(newSpace) : f);
  const newSpaceItemsRows = plugin.index.spacesItemsDBCache.map(f => f.space == space ? {...f, space: newSpace.name} : f);
  await plugin.index.saveSpacesDatabaseToDisk({ spaces: {...spaceSchema, rows: newSpaceRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  
  plugin.settings.expandedSpaces = plugin.settings.expandedSpaces.map((f) =>
    f == space ? newSpace.name : f
  );
  plugin.saveSettings();
  if (space != newSpace.name) {
    renameSpaceContextFile(plugin, space, newSpace.name);
    plugin.index.renameSpace(space, newSpace.name)
  }
    plugin.index.reloadSpace(space)
    plugin.index.initalizeFiles()
  
};

export const removeSpace = async (plugin: MakeMDPlugin, space: string) => {
  const newSpaceRows = plugin.index.spacesDBCache.filter(f => f.name != space);
  const newSpaceItemsRows = plugin.index.spacesItemsDBCache.filter(f => f.space != space);
  await plugin.index.saveSpacesDatabaseToDisk({ spaces: {...spaceSchema, rows: newSpaceRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  deleteSpaceContext(plugin, space);
  plugin.index.deleteSpace(space);
};

export const updateSpaceSort = (
  plugin: MakeMDPlugin,
  spaceName: string,
  sort: [string, boolean]
) => {
  const space = plugin.index.spacesIndex.get(spaceName)?.space;
  if (space)
  saveSpace(plugin, spaceName, {
    ...space,
    sort: JSON.stringify(sort)
  })
};

export const toggleSpacePin = (
  plugin: MakeMDPlugin,
  spaceName: string,
  type: "home" | "pinned" | 'none'
) => {
  const space = plugin.index.spacesIndex.get(spaceName)?.space;
  if (space)
  saveSpace(plugin, spaceName, {
    ...space,
    pinned: type
  })
};

export const addPathsToSpace = async (
  plugin: MakeMDPlugin,
  space: string,
  paths: string[]
) => {
  const newSpaceItemsRows = [...plugin.index.spacesItemsDBCache, ...paths.map((p) => ({ space: space, path: p }))]
  await plugin.index.saveSpacesDatabaseToDisk({ spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  await plugin.index.reloadSpace(space)
  const promises = paths.map(f => plugin.index.reloadFile(getAbstractFileAtPath(app, f)));
    await Promise.all(promises)
    plugin.index.broadcast('vault');
};

export const removePathsFromSpace = async (
  plugin: MakeMDPlugin,
  space: string,
  paths: string[]
) => {
  const newSpaceItemsRows = plugin.index.spacesItemsDBCache.filter(f => !(f.space == space && paths.includes(f.path)))
  await plugin.index.saveSpacesDatabaseToDisk({ spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  await plugin.index.reloadSpace(space)
  const promises = paths.map(f => plugin.index.reloadFile(getAbstractFileAtPath(app, f)));
    await Promise.all(promises)
    plugin.index.broadcast('vault');
};



export const retrieveSpaceItems = (plugin: MakeMDPlugin, spaces: Space[]) => {
  
  const retrievedSpaces: Record<string, SpaceItem[]> = {};
  spaces.forEach((space) => {
    const rows = plugin.index.spacesItemsDBCache.filter(f => f.space == space.name)
    retrievedSpaces[space.name] = rows.sort((a, b) =>
      (a.rank ?? '').localeCompare(b.rank ?? '', undefined, { numeric: true })
    ) as SpaceItem[];
  });
  return retrievedSpaces;
};

export const retrieveFolders = async (
  plugin: MakeMDPlugin,
  paths: string[]
) => {
  const retrievedFolders: Record<string, FileMetadataCache[]> = {};
  paths.forEach((folder) => {
    const files : FileMetadataCache[] = [];
    for (const k of plugin.index.filesIndex.values()) {
      if (k.parent == folder)
        files.push(k);
    }
    retrievedFolders[folder] = files.filter(
      excludeVaultItemPredicate(plugin.settings)
    ).map(f => plugin.index.filesIndex.get(f.path)).filter(f => f);
  });
  return retrievedFolders;
};

export const retrieveAllRecursiveChildren = (
  vaultDB: DBRows,
  settings: MakeMDPluginSettings,
  folder: string
) => {
    return vaultDB.filter(f => f['parent'].startsWith(folder)).filter(
      excludeVaultItemPredicate(settings)
    ) as VaultItem[];
};

export const retrieveAllFiles =  (
  vaultDB: DBRows,
  settings: MakeMDPluginSettings,
) => {
      return vaultDB.filter(
        excludeVaultItemPredicate(settings)
      ) as VaultItem[];
};


export const initiateDB = (db: Database) => {
  replaceDB(db, {
    vault: vaultSchema,
    spaces: spaceSchema,
    spaceItems: spaceItemsSchema,
  });
};

export const indexCurrentFileTree = (plugin: MakeMDPlugin, vaultDB: DBRows, spaceItemsDB: DBRows) : DBTables => {
  const treeItems: DBRows = getAllAbstractFilesInVault(plugin, app).map(file => ({
    path: file.path,
    parent: file.parent?.path,
    created: file instanceof TFile ? file.stat.ctime.toString() : undefined,
    folder: file instanceof TFolder ? "true" : "false",
  }));
  
  // Vault.recurseChildren(app.vault.getRoot(), (file) => {
  //   if (file.path != '/')
  //   treeItems.push({
  //     path: file.path,
  //     parent: file.parent?.path,
  //     created: file instanceof TFile ? file.stat.ctime.toString() : undefined,
  //     folder: file instanceof TFolder ? "true" : "false",
  //   });
  // });

  const currentPaths = vaultDB;
  const deleteRows = currentPaths.filter(
    (item) => !treeItems.some((i) => i.path == item.path)
  );
  const fixRows = currentPaths
    .filter((item) =>
      treeItems.some((i) => i.path == item.path && i.parent != item.parent)
    )
    .map((item) => ({
      ...item,
      ...treeItems.find((i) => i.path == item.path),
    }));
  const newRows = treeItems.filter(
    (item) => !currentPaths.some((i) => i.path == item.path)
  );
  const newVaultRows = [...vaultDB.map(f => {
    const newItem = fixRows.find(g => g.path == f.path)
    if (newItem) {
      return {...f, ...newItem}
    }
     return f
  }).filter(f => !deleteRows.some(g => g.path == f.path)), ...newRows]
  const newSpaceItemsRows = spaceItemsDB.filter(f => !deleteRows.some(g => g.path == f.path))
  return {
    vault: {
      ...vaultSchema,
      rows: newVaultRows
    },
    spaceItems: {
      ...spaceItemsSchema,
      rows: newSpaceItemsRows
    }
  }

};



export const newFolderInVault = (plugin: MakeMDPlugin, activeFile: Path) => {
  const vaultChangeModal = new VaultChangeModal(
    plugin,
    plugin.app.vault.getRoot(),
    "create folder",
    "/"
  );
  vaultChangeModal.open();
};
export const newFileInVault = async (
  plugin: MakeMDPlugin,
  activeFile: Path,
  canvas?: boolean
) => {
  let newFile: TFile;
  if (canvas) {
    newFile = await createNewCanvasFile(plugin, plugin.app.vault.getRoot(), "");
  } else {
    newFile = await createNewMarkdownFile(
      plugin,
      plugin.app.vault.getRoot(),
      ""
    );
  }
};

export const newFolderInSpace = (
  plugin: MakeMDPlugin,
  space: Space,
  activeFile: Path
) => {
  const vaultChangeModal = new VaultChangeModal(
    plugin,
    space?.def.folder.length > 0
      ? getFolderFromPath(app, space.def.folder)
      : defaultNoteFolder(plugin, activeFile),
    "create folder",
    space.name
  );
  vaultChangeModal.open();
};
export const newFileInSpace = async (
  plugin: MakeMDPlugin,
  space: Space,
  activeFile: Path,
  canvas?: boolean
) => {
  let newFile: TFile;
  if (canvas) {
    newFile = await createNewCanvasFile(
      plugin,
      space?.def.folder.length > 0
        ? getFolderFromPath(app, space.def.folder)
        : defaultNoteFolder(plugin, activeFile),
      ""
    );
  } else {
    newFile = await createNewMarkdownFile(
      plugin,
      space?.def.folder.length > 0
        ? getFolderFromPath(app, space.def.folder)
        : defaultNoteFolder(plugin, activeFile),
      ""
    );
  }

  if (space.name != "/") addPathsToSpace(plugin, space.name, [newFile.path]);
};
