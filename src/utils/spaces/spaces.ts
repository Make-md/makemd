import { dispatchSpaceDatabaseFileChanged } from "dispatch/spaces";
import MakeMDPlugin from "main";
import { TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import {
  Space,
  SpaceItem,
  spaceItemsSchema,
  spaceSchema,
  VaultItem,
  vaultSchema
} from "schemas/spaces";
import { Database } from "sql.js";
import { DBRows } from "types/mdb";
import { SectionTree, StringTree } from "types/types";
import { insert } from "utils/array";
import { sanitizeSQLStatement } from "utils/sanitize";
import {
  compareByField,
  excludeVaultItemPredicate
} from "utils/tree";
import {
  deleteFromDB, insertIntoDB, replaceDB, selectDB, updateDB
} from "../db/db";
import {
  getAbstractFileAtPath
} from "../file";

export const rebuildIndex = async (plugin: MakeMDPlugin) => {
  console.time("Reindex Spaces Data");
  const db = plugin.spaceDBInstance();

  indexCurrentFileTree(db);
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
  console.timeEnd("Reindex Spaces Data");
};

export interface TreeNode {
  id: string;
  parentId: string;
  depth: number;
  index: number;
  space: string;
  sortable?: boolean;
  item?: VaultItem;
  file?: TAbstractFile;
  spaceItem?: Space;
  collapsed: boolean;
}
export const spaceItemToTreeNode = (
  space: Space,
  collapsed: boolean,
  sortable: boolean
): TreeNode => {
  return {
    id: space.name,
    spaceItem: space,
    parentId: null,
    depth: 0,
    index: 0,
    space: space.name,
    item: null,
    collapsed: collapsed,
    sortable: sortable,
  };
};
export const vaulItemToTreeNode = (
  item: VaultItem,
  space: string,
  path: string,
  depth: number,
  i: number,
  collapsed: boolean,
  sortable: boolean
) => ({
  item: item,
  file: getAbstractFileAtPath(app, item.path),
  space,
  id: (space == "/" ? "" : space) + "//" + item.path,
  parentId: (space == "/" ? "" : space) + "//" + path,
  depth: depth,
  index: i,
  collapsed,
  sortable,
});
export const folderSortFn =
  (sortStrategy: string, direction: boolean) =>
  (a: VaultItem, b: VaultItem) => {
    if (sortStrategy == "rank") {
      return a.rank.localeCompare(b.rank, undefined, { numeric: true });
    }
    const sortFns = [
      compareByField("folder", false),
      compareByField(sortStrategy, direction),
    ];
    return sortFns.reduce((p, c) => {
      return p == 0 ? c(a, b) : p;
    }, 0);
  };
export const flattenedTreeFromVaultItems = (
  root: string,
  space: string,
  vaultItems: Record<string, VaultItem[]>,
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
    vaultItems: Record<string, VaultItem[]>,
    openNodes: string[],
    depth: number,
    index: number
  ) => {
    let items: TreeNode[] = [];
    let i = index;
    vaultItems[path]
      .sort(folderSortFn(sortStrategy, direction))
      .forEach((item) => {
        const collapsed = !openNodes.includes(item.path);
        const node = vaulItemToTreeNode(
          item,
          space,
          path,
          depth,
          i,
          collapsed,
          sortStrategy == "rank"
        );
        if (node.file) items.push(node);
        i = i + 1;
        if (vaultItems[item.path] && !collapsed) {
          items.push(
            ...flattenTree(item.path, vaultItems, openNodes, depth + 1, i)
          );
        }
      });
    return items;
  };
  return flattenTree(root, vaultItems, openNodes, depth, 0);
};

export const vaultItemForPath = (
  plugin: MakeMDPlugin,
  path: string
): VaultItem => {
  if (!path) return null;
  const db = plugin.spaceDBInstance();
  const table = selectDB(db, "vault", `path='${sanitizeSQLStatement(path)}'`);
  return table?.rows?.[0] as VaultItem;
};

export const fileStickerForPath = (plugin: MakeMDPlugin, path: string) => {
  return vaultItemForPath(plugin, path)?.sticker;
};

export const saveFileSticker = (
  plugin: MakeMDPlugin,
  path: string,
  sticker: string
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      vault: {
        ...vaultSchema,
        cols: ["path", "sticker"],
        rows: [{ path, sticker }],
      },
    },
    "path",
    "path"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("sticker");
};

export const saveFileColor = (
  plugin: MakeMDPlugin,
  path: string,
  color: string
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      vault: {
        ...vaultSchema,
        cols: ["path", "color"],
        rows: [{ path, color }],
      },
    },
    "path",
    "path"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("sticker");
};

export const saveSpaceSticker = (
  plugin: MakeMDPlugin,
  name: string,
  sticker: string
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      spaces: {
        ...spaceSchema,
        cols: ["name", "sticker"],
        rows: [{ name, sticker }],
      },
    },
    "name",
    "name"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const updateFileRank = (
  plugin: MakeMDPlugin,
  item: VaultItem,
  vaultTree: Record<string, VaultItem[]>,
  rank: number
) => {
  const db = plugin.spaceDBInstance();
  if (Object.keys(vaultTree).includes(item.parent)) {
    let fixedRank = rank;
    if (parseInt(item.rank) > rank) fixedRank = rank + 1;
    const newItems = insert(
      vaultTree[item.parent].filter((f) => f.path != item.path),
      fixedRank,
      item
    ).map((f, index) => ({ path: f.path, rank: index.toString() }));
    updateDB(
      db,
      {
        vault: {
          ...vaultSchema,
          cols: ["path", "rank"],
          rows: newItems,
        },
      },
      "path",
      "path"
    );
    plugin.saveSpacesDB();
    dispatchSpaceDatabaseFileChanged("vault");
  }
};

export const moveAFileToNewParentAtIndex = (
  plugin: MakeMDPlugin,
  item: VaultItem,
  newParent: string,
  vaultTree: Record<string, VaultItem[]>,
  index: number
) => {
  //pre-save before vault change happens so we can save the rank
  const currFile = getAbstractFileAtPath(app, item.path);
  const newPath =
    newParent == "/" ? currFile.name : newParent + "/" + currFile.name;
  const newItem = {
    ...item,
    path: newPath,
    parent: newParent,
    rank: index.toString(),
  };
  if (Object.keys(vaultTree).includes(newParent)) {
    vaultTree[newParent] = insert(vaultTree[newParent], index, newItem);
    const db = plugin.spaceDBInstance();
    const table = selectDB(
      db,
      "vault",
      `parent='${sanitizeSQLStatement(newParent)}'`
    );
    const rows = insert(
      table?.rows.sort((a, b) =>
        a.rank.localeCompare(b.rank, undefined, { numeric: true })
      ) ?? [],
      index,
      newItem
    ).map((f, index) => ({ ...f, rank: index.toString() })) as VaultItem[];
    insertIntoDB(db, {
      vault: {
        ...vaultSchema,
        rows: [newItem],
      },
    });
    deleteFromDB(db, "vault", `path='${sanitizeSQLStatement(item.path)}'`);
    updateDB(
      db,
      {
        vault: {
          ...vaultSchema,
          cols: ["path", "rank"],
          rows: rows,
        },
      },
      "path",
      "path"
    );
    plugin.saveSpacesDB();
    const afile = getAbstractFileAtPath(app, item.path);
    app.fileManager.renameFile(afile, newPath);
  } else {
    const afile = getAbstractFileAtPath(app, item.path);
    app.fileManager.renameFile(afile, newPath);
  }
};

export const insertSpaceAtIndex = (
  plugin: MakeMDPlugin,
  space: string,
  pinned: boolean,
  rank: number,
  def?: string
) => {
  const db = plugin.spaceDBInstance();
  let newSpace = { name: space, pinned: pinned ? "true" : "false", def };
  const spaces = retrieveSpaces(plugin);
  const spaceExists = spaces.find((f) => f.name == space);
  let fixedRank = rank;
  if (spaceExists) {
    updateDB(
      db,
      {
        spaces: {
          ...spaceSchema,
          rows: [{ ...spaceExists, ...newSpace }],
        },
      },
      "name",
      "name"
    );
    if (parseInt(spaceExists.rank) < rank) fixedRank = rank - 1;
  } else {
    insertIntoDB(db, {
      spaces: {
        ...spaceSchema,
        rows: [newSpace],
      },
    });
  }
  const newSpaces = insert(
    spaces.filter((f) => f.name != space),
    fixedRank,
    newSpace
  ).map((f, index) => ({ name: f.name, rank: index.toString() }));

  updateDB(
    db,
    {
      spaces: {
        ...spaceSchema,
        cols: ["name", "rank"],
        rows: newSpaces,
      },
    },
    "name",
    "name"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const insertSpaceItemAtIndex = (
  plugin: MakeMDPlugin,
  spaceName: string,
  path: string,
  rank: number
) => {
  const db = plugin.spaceDBInstance();
  const space = retrieveSpaces(plugin).find((f) => f.name == spaceName);
  if (!space) return;
  let newSpace: SpaceItem = {
    space: space.name,
    path: path,
    rank: rank.toString(),
  };
  const spaceItems = retrieveSpaceItems(plugin, [space]);
  const spaceExists = spaceItems[space.name] ?? [];
  const pathExists = spaceExists.find((f) => f.path == path);
  let fixedRank = rank;
  if (!pathExists) {
    insertIntoDB(db, {
      spaceItems: {
        ...spaceItemsSchema,
        rows: [newSpace],
      },
    });
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
  updateDB(
    db,
    {
      spaceItems: {
        ...spaceItemsSchema,
        rows: newSpaceItems,
      },
    },
    `space='${space.name}' AND path`,
    "path"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const renameSpace = (
  plugin: MakeMDPlugin,
  space: string,
  newName: string
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      spaces: {
        ...spaceSchema,
        cols: ["name"],
        rows: [{ oldName: space, name: newName }],
      },
    },
    "name",
    "oldName"
  );
  updateDB(
    db,
    {
      spaceItems: {
        ...spaceItemsSchema,
        cols: ["space"],
        rows: [{ oldSpace: space, space: newName }],
      },
    },
    "space",
    "oldSpace"
  );
  plugin.saveSpacesDB();
  plugin.settings.expandedSpaces = plugin.settings.expandedSpaces.map((f) =>
    f == space ? newName : f
  );
  plugin.saveSettings();
  dispatchSpaceDatabaseFileChanged("space");
};

export const removeSpace = (plugin: MakeMDPlugin, space: string) => {
  const db = plugin.spaceDBInstance();
  deleteFromDB(db, "spaces", `name='${sanitizeSQLStatement(space)}'`);
  deleteFromDB(db, "spaceItems", `space='${sanitizeSQLStatement(space)}'`);
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const updateSpaceSort = (
  plugin: MakeMDPlugin,
  space: string,
  sort: [string, boolean]
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      spaces: {
        ...spaceSchema,
        cols: ["name", "sort"],
        rows: [{ name: space, sort: JSON.stringify(sort) }],
      },
    },
    "name",
    "name"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const toggleSpacePin = (
  plugin: MakeMDPlugin,
  space: string,
  state: boolean
) => {
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      spaces: {
        ...spaceSchema,
        cols: ["name", "pinned"],
        rows: [{ name: space, pinned: state ? "true" : "false" }],
      },
    },
    "name",
    "name"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const addPathsToSpace = (
  plugin: MakeMDPlugin,
  space: string,
  paths: string[]
) => {
  const db = plugin.spaceDBInstance();
  insertIntoDB(db, {
    spaceItems: {
      ...spaceItemsSchema,
      rows: [...paths.map((p) => ({ space: space, path: p }))],
    },
  });
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const removePathsFromSpace = (
  plugin: MakeMDPlugin,
  space: string,
  paths: string[]
) => {
  const db = plugin.spaceDBInstance();
  paths.forEach((path) =>
    deleteFromDB(
      db,
      "spaceItems",
      `space='${sanitizeSQLStatement(space)}' AND path='${sanitizeSQLStatement(
        path
      )}'`
    )
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("space");
};

export const retrieveSpaces = (plugin: MakeMDPlugin) => {
  const db = plugin.spaceDBInstance();
  const table = selectDB(db, "spaces");
  if (table) {
    return table.rows.sort((a, b) =>
      a.rank.localeCompare(b.rank, undefined, { numeric: true })
    ) as Space[];
  }
  return [];
};

export const retrieveSpaceItems = (plugin: MakeMDPlugin, spaces: Space[]) => {
  const db = plugin.spaceDBInstance();
  let retrievedSpaces: Record<string, SpaceItem[]> = {};
  spaces.forEach((space) => {
    const table = selectDB(
      db,
      "spaceItems",
      `space='${sanitizeSQLStatement(space.name)}'`
    );
    let rows = table?.rows ?? [];
    if (space.def?.length > 0) {
      const spaceItems = (
        selectDB(db, "vault", `parent='${sanitizeSQLStatement(space.def)}'`)
          ?.rows ?? []
      ).filter(excludeVaultItemPredicate(plugin));
      const extraItems = rows.filter(
        (f) => !spaceItems.some((g) => g.path == f.path)
      );
      rows = rows.filter((f) => !extraItems.some((g) => f.path == g.path));

      extraItems.forEach((row) =>
        deleteFromDB(
          db,
          "spaceItems",
          `space='${sanitizeSQLStatement(
            space.name
          )}' AND path='${sanitizeSQLStatement(row.path)}'`
        )
      );
      spaceItems.forEach((row) => {
        if (!rows.some((f) => f.path == row.path)) {
          const newItem = { space: space.name, path: row.path, rank: "0" };
          insertIntoDB(db, {
            spaceItems: {
              ...spaceItemsSchema,
              rows: [newItem],
            },
          });
          rows.push(newItem);
        }
      });
    }
    retrievedSpaces[space.name] = rows.sort((a, b) =>
      a.rank.localeCompare(b.rank, undefined, { numeric: true })
    ) as SpaceItem[];
  });
  return retrievedSpaces;
};

export const retrieveFolders = async (
  plugin: MakeMDPlugin,
  paths: string[]
) => {
  const db = plugin.spaceDBInstance();
  let retrievedFolders: Record<string, VaultItem[]> = {};
  paths.forEach((folder) => {
    const table = selectDB(
      db,
      "vault",
      `parent='${sanitizeSQLStatement(folder)}'`
    );
    if (table) {
      retrievedFolders[folder] = table.rows.filter(
        excludeVaultItemPredicate(plugin)
      ) as VaultItem[];
    }
  });
  return retrievedFolders;
};

export const migrateIndex = async (plugin: MakeMDPlugin) => {
  console.time("Migrate Spaces Data");
  const db = plugin.spaceDBInstance();
  initiateDB(db);
  indexCurrentFileTree(db);
  mergeCurrentRanks(db, plugin.settings.folderRank);
  mergeExistingFileIcons(db, plugin.settings.fileIcons);
  mergeSpaces(db, plugin.settings.spaces);
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
  plugin.settings.folderRank = null;
  plugin.settings.fileIcons = null;
  plugin.settings.spaces = null;
  plugin.saveSettings();
  console.timeEnd("Migrate Spaces Data");
};

export const initiateDB = (db: Database) => {
  replaceDB(db, {
    vault: vaultSchema,
    spaces: spaceSchema,
    spaceItems: spaceItemsSchema,
  });
};

export const indexCurrentFileTree = (db: Database) => {
  let treeItems: DBRows = [];
  Vault.recurseChildren(app.vault.getRoot(), (file) => {
    treeItems.push({
      path: file.path,
      parent: file.parent?.path,
      created: file instanceof TFile ? file.stat.ctime.toString() : undefined,
      folder: file instanceof TFolder ? "true" : "false",
    });
  });

  const currentPaths = selectDB(db, "vault")?.rows ?? [];
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
  fixRows.forEach((row) => {
    updateDB(db, { vault: { ...vaultSchema, rows: [row] } }, "path", "path");
  });
  deleteRows.forEach((path) => {
    deleteFromDB(db, "vault", `path='${sanitizeSQLStatement(path.path)}'`);
  });
  deleteRows.forEach((path) => {
    deleteFromDB(db, "spaceItems", `path='${sanitizeSQLStatement(path.path)}'`);
  });
  const chunkSize = 20;
  for (let i = 0; i < newRows.length; i += chunkSize) {
    const chunk = newRows.slice(i, i + chunkSize);
    insertIntoDB(db, {
      vault: {
        ...vaultSchema,
        rows: chunk,
      },
    });
  }

  // let treeItems = '';
  //Slightly faster but not error checked
  // Vault.recurseChildren(app.vault.getRoot(), (file) => (treeItems += `\ REPLACE INTO vault VALUES ('${file.path.replace(`'`, `''`)}', '${file?.parent?.path.replace(`'`, `''`) ?? ''}', '', '', '');`));
  // return execQuery(db, treeItems)
};

export const mergeExistingFileIcons = (
  db: Database,
  fileIcons: [string, string][]
) => {
  const dbRows = fileIcons.map(([path, sticker]) => ({
    path: path,
    sticker: sticker,
  }));
  updateDB(
    db,
    {
      vault: {
        uniques: [],
        cols: ["sticker"],
        rows: dbRows,
      },
    },
    "path",
    "path"
  );
};

export const mergeCurrentRanks = (db: Database, ranks: StringTree) => {
  const flattenStringTreeChildren = (path: string, children: StringTree[]) => {
    const dbRows: DBRows = [];
    children.forEach((item, index) => {
      dbRows.push({
        path: path + item.node,
        rank: index.toString(),
      });
      if (item.children.length > 0) {
        dbRows.push(
          ...flattenStringTreeChildren(path + item.node + "/", item.children)
        );
      }
    });
    return dbRows;
  };

  const dbRows = flattenStringTreeChildren("", ranks.children);
  updateDB(
    db,
    {
      vault: {
        uniques: [],
        cols: ["rank"],
        rows: dbRows,
      },
    },
    "path",
    "path"
  );
};

export const mergeSpaces = (db: Database, sectionTrees: SectionTree[]) => {
  let spaces: Space[] = [];
  let spaceItems: SpaceItem[] = [];

  sectionTrees.forEach((space, index) => {
    spaces.push({ name: space.section, rank: index.toString() });
    spaceItems.push(
      ...space.children.map((f, index) => ({
        space: space.section,
        path: f,
        rank: index.toString(),
      }))
    );
  });
  // const dbRows = spaces.map(([path, sticker])=> ({ path: path, sticker: sticker }))
  insertIntoDB(db, {
    spaces: {
      ...spaceSchema,
      rows: spaces as DBRows,
    },
    spaceItems: {
      ...spaceItemsSchema,
      rows: spaceItems as DBRows,
    },
  });
};
