import { arrayMove } from "@dnd-kit/sortable";
import i18n from "core/i18n";
import { fileSystemSpaceInfoFromFolder } from "core/spaceManager/filesystemAdapter/spaceInfo";
import { PathStateWithRank, Superstate } from "core/superstate/superstate";
import { MakeMDSettings } from "core/types/settings";
import { SpaceDefFilter, SpaceDefGroup, SpaceDefType, SpaceDefinition, SpaceSort } from "core/types/space";
import { CacheState, PathState, SpaceState } from "core/types/superstate";
import { reorderPathsInContext } from "core/utils/contexts/context";
import { parseSortStrat } from "core/utils/parser";
import { ensureArray, ensureBoolean, ensureString, ensureStringValueFromSet } from "core/utils/strings";
import { compareByField, compareByFieldCaseInsensitive } from "core/utils/tree";
import { movePath } from "core/utils/uri";
import { SpaceInfo } from "types/mdb";
import { insert } from "utils/array";
import { deletePath } from "./path";
import { addTagToPath, deleteTagFromPath } from "./tags";



export const spaceContextsKey = (settings: MakeMDSettings) => settings.fmKeyContexts
export const spaceFilterKey = (settings: MakeMDSettings) => settings.fmKeyFilter
export const spaceLinksKey = (settings: MakeMDSettings) => settings.fmKeyLinks
export const spaceSortKey = (settings: MakeMDSettings) => settings.fmKeySort
export const FMSpaceKeys = (settings: MakeMDSettings) => [spaceContextsKey(settings), spaceFilterKey(settings), spaceLinksKey(settings), spaceSortKey(settings)]

const parseSpaceSort = (value: any) : SpaceSort => {
  return {
      field: ensureString(value?.['field'] ?? 'rank'),
      asc: ensureBoolean(value?.['asc']),
      group: ensureBoolean(value?.['group'])
  }
}

const parseSpaceFilterGroupFilter = (value: any) : SpaceDefFilter => {
    return {
        type: ensureStringValueFromSet(value['type'], ['frontmatter', 'fileprop', 'filemeta'], 'frontmatter') as SpaceDefType,
        fType: ensureString(value['fType']),
        field: ensureString(value['field']),
        fn: ensureString(value['fn']),
        value: ensureString(value['value']),
    }
}
const parseSpaceFilterGroup = (value: any) : SpaceDefGroup => {
    return {type: ensureStringValueFromSet(value['type'], ['any', 'all'], 'any') as 'any' | 'all',
    trueFalse: value['truefalse'] ? true : false,
    filters: ensureArray(value['filters']).map(f => parseSpaceFilterGroupFilter(f))
}
}

export const parseSpaceMetadata = (metadata: Record<string, any>, settings: MakeMDSettings) : SpaceDefinition => {
    return {sort: parseSpaceSort(metadata[spaceSortKey(settings)]), contexts: ensureArray(metadata[spaceContextsKey(settings)]), links: ensureArray(metadata[spaceLinksKey(settings)]), filters: ensureArray(metadata[spaceFilterKey(settings)]).map(f => parseSpaceFilterGroup(f))}
}

type TreeNodeType = 'space' | "file" | 'group'
export interface TreeNode {
  id: string;
  parentId: string;
  depth: number;
  index: number;
  space: string;
  sortable?: boolean;
  type: TreeNodeType,
  path: string;
  item?: PathStateWithRank;
  childrenCount: number;
  collapsed: boolean;
  rank: number;
}
export const spaceToTreeNode = (
  path: PathStateWithRank,
  collapsed: boolean,
  sortable: boolean,
  depth: number,
  parentId: string,
  parentPath: string,
  childrenCount: number,

): TreeNode => {
  return {
    id: parentId ? parentId +'/'+ path.path : path.path,
    parentId,
    depth,
    index: 0,
    space: parentPath,
    path: path.path,
    item: path,
    rank: path?.rank,
    collapsed: collapsed,
    sortable: sortable,
    childrenCount: childrenCount,
    type: 'space',
  };
};
export const pathStateToTreeNode = (
  superstate: Superstate,
  item: PathStateWithRank,
  space: string,
  path: string,
  depth: number,
  i: number,
  collapsed: boolean,
  sortable: boolean,
  childrenCount: number,
  parentId: string,

) : TreeNode => ({
  item: item,
  space,
  id: parentId + "/" + item.path,
  parentId: parentId,
  depth: depth,
  path,
  index: i,
  collapsed,
  sortable,
  childrenCount,
  rank: item.rank,
  type: 'file',
});

export const spaceRowHeight = (superstate: Superstate) => {
  return superstate.ui.getScreenType() == 'mobile' ? 40 : superstate.settings.spaceRowHeight;
}

export const spaceSortFn =
  (sortStrategy: SpaceSort) =>
  (a: CacheState, b: CacheState) => {
    if (sortStrategy.field == "rank") {
      return (a.rank - b.rank);
    }
    const sortFns = [];
    if (sortStrategy.group) {
      sortFns.push(compareByField("type", false))
    }
    if (sortStrategy.field == 'name')
    {
      sortFns.push(compareByFieldCaseInsensitive(sortStrategy.field, sortStrategy.asc));
    } else {
sortFns.push(compareByField(sortStrategy.field, sortStrategy.asc))
    }
    return sortFns.reduce((p, c) => {
      return p == 0 ? c(a, b) : p;
    }, 0);
  };
export const flattenedTreeFromVaultItems = (
  superstate: Superstate,
  root: string,
  openNodes: string[],
  depth: number,
  sortStrategy: SpaceSort,
): TreeNode[] => {
const _caches = superstate.getSpaceItems(root);
  if (!_caches) {
    return [];
  }

  const flattenNavigatorTree = (
    path: string,
    openNodes: string[],
    depth: number,
    index: number,
    folderSort: string,
    caches: (PathStateWithRank)[]
  ) => {
    const items: TreeNode[] = [];
    let i = index;
    
    const sortStrat = folderSort.length > 0 ? parseSortStrat(folderSort) : sortStrategy;
    caches
      .sort(spaceSortFn(sortStrat))
      .forEach((item) => {

        if (item.type != 'space') {

        const id = path + "/" + item.name;
        const collapsed = !openNodes.includes(id);
        i = i + 1;
        const newItems : TreeNode[] = [];
        const node = pathStateToTreeNode(
          superstate,
          item,
          path,
          item.path,
          depth,
          i,
          collapsed,
          sortStrategy.field == "rank",
          newItems.length,
          path,

        );

        items.push(node);
      } else {
        const collapsed = !openNodes.includes(item.path);
        items.push(spaceToTreeNode(item, collapsed, sortStrategy.field == "rank", depth, path, item.path,0));
      }}
      );
    return items;
  };
  return flattenNavigatorTree(root, openNodes, depth, 0, '', _caches);
};



export const updatePathRankInSpace = async (
  superstate: Superstate,
  path: string,
  rank: number,
  space: string
) => {
  const spaceState = superstate.spacesIndex.get(space);
if (!spaceState) return;

  if (spaceState.type == 'default') return;
    const fixedRank = rank;
    // if (parseInt(item.rank) > rank) fixedRank = rank + 1;

    superstate.addToContextStateQueue(() => reorderPathsInContext(superstate.spaceManager, [path], fixedRank, spaceState.space).then(f => {
      return superstate.reloadContext(spaceState.space)
    }).then(f => {
      const promises = [...superstate.spacesMap.getInverse(spaceState.path)].map(f => superstate.reloadPath(f));
    return Promise.all(promises)
    ;
    }).then(f => superstate.dispatchEvent("spaceStateUpdated", {path: spaceState.path})))
    
    
};



export const movePathToNewSpaceAtIndex = async (
  superstate: Superstate,
  item: PathState,
  newParent: string,
  index: number,
  copy?: boolean
) => {
  if (!item) return;
  //pre-save before vault change happens so we can save the rank
  const currentPathState = superstate.pathsIndex.get(item.path);
  if (!currentPathState) return;
  const newPath =
    newParent == "/" ? currentPathState.name : newParent + "/" + currentPathState.name;
  
  if (await superstate.spaceManager.pathExists(newPath)) {

    superstate.ui.notify(i18n.notice.fileExists);
    return;
  }
    
      if (copy) {
        await superstate.spaceManager.copyPath(item.path, newParent)
      } else {
        await superstate.spaceManager.renamePath(item.path, movePath(item.path, newParent))
      }
      updatePathRankInSpace(superstate,newPath, index, newParent)
    
  
};

export const insertContextInSpace = (superstate: Superstate, path: string, newTag: string) => {
  const spaceCache = superstate.spacesIndex.get(path);
  const contexts = [...spaceCache.metadata.contexts.filter(f => f != newTag), newTag]
;
  saveSpaceMetadataValue(superstate, path, "contexts", contexts)
}

export const removeContextInSpace = (superstate: Superstate, path: string, oldTag: string) => {
  const spaceCache = superstate.spacesIndex.get(path);
  const contexts = spaceCache.metadata.contexts.filter(f => f != oldTag)
  saveSpaceMetadataValue(superstate, path, "contexts", contexts)
}

export const renameContextInSpace = (superstate: Superstate, path: string, oldTag: string, newTag: string) => {
  const spaceCache = superstate.spacesIndex.get(path);
  const contexts = spaceCache.metadata.contexts.map(f => f == oldTag ? newTag : f)
  saveSpaceMetadataValue(superstate, path,"contexts", contexts)
}



export const createSpace = async (
  superstate: Superstate,
  path: string,
  newSpace?: SpaceDefinition,
) => {

  const spaces = superstate.allSpaces();
  const spaceInfo = fileSystemSpaceInfoFromFolder(superstate.spaceManager, path);
  let newSpaceCache;
  if (spaces.find(f => f.path == spaceInfo.path)) {
    if (newSpace)
      {
        newSpaceCache =  await saveSpaceCache(superstate, spaceInfo, newSpace)
      } else {
        return;
      }
  } else {
    await superstate.spaceManager.createSpace(null, spaceInfo.path, newSpace);
    
    
    if (newSpace) {

      await saveSpaceCache(superstate, spaceInfo, newSpace)
      newSpaceCache = await superstate.reloadSpace(spaceInfo, newSpace)
  } else {
    newSpaceCache = await superstate.reloadSpace(spaceInfo)
  }
  }
  
  superstate.initializePaths();
  return newSpaceCache;
};



export const saveSpaceMetadataValue = async (superstate: Superstate, space: string, key: keyof SpaceDefinition, value: any) => {

  superstate.spaceManager.saveSpace(space, (metadata) => ({...metadata, [key]: value}))
  const spaceCache = superstate.spacesIndex.get(space)
  await superstate.updateSpaceMetadata(space, { ...spaceCache.metadata, [key]: value})
}

export const saveSpaceProperties = async (superstate: Superstate, space: string, properties: Record<string, any>) => {
  
    superstate.spaceManager.saveSpace(space, (metadata) => (metadata), properties)
  }

export const saveSpaceCache = async (superstate: Superstate, spaceInfo: SpaceInfo, metadata: SpaceDefinition) => {
  await superstate.spaceManager.saveSpace(spaceInfo.path, (oldMetadata) => ({...oldMetadata, ...metadata}));

  return superstate.updateSpaceMetadata(spaceInfo.path, metadata)
}

export const addPathToSpaceAtIndex = async (
  superstate: Superstate, space: SpaceState, path: string, rank?: number) => {
    if (space.type == 'tag') {
    return addTagToPath(superstate, path, space.name);
    } else {
      return pinPathToSpaceAtIndex(superstate, space, path, rank)
    }
  }

  export const addPathsToSpaceAtIndex = async (
    superstate: Superstate, space: SpaceState, path: string, rank?: number) => {
      if (space.type == 'tag') {
      return addTagToPath(superstate, path, space.name);
      } else {
        return pinPathToSpaceAtIndex(superstate, space, path, rank)
      }
    }
export const pinPathToSpaceAtIndex = async (
  superstate: Superstate,
  space: SpaceState,
  path: string,
  rank?: number
) => {
  if (path == space.path) {
    superstate.ui.notify('Pinning space to itself not currently allowed')
    return;
  }
    const spaceExists = ensureArray(space.metadata.links) ?? []
    const pathExists = spaceExists.find((f) => f == path);
    if (!pathExists) {
      spaceExists.push(path)
    }
    
  await saveSpaceCache(superstate, space.space, {...space.metadata, links: spaceExists});  

  await superstate.reloadPath(path, true).then(f => superstate.dispatchEvent("pathStateUpdated", {path: path}))
  updatePathRankInSpace(superstate,path, rank, space.path)

};


export const removeSpace = async (superstate: Superstate, space: string) => {
const spaceCache = superstate.spacesIndex.get(space)
if (!spaceCache) return;
if (spaceCache.type == 'tag') {
  superstate.onTagDeleted(spaceCache.name)
} else if (spaceCache.type == 'folder') {
  await deletePath(superstate, spaceCache.path)
}
  
};

export const updateSpaceSort = (
  superstate: Superstate,
  path: string,
  sort: SpaceSort
) => {
  const space = superstate.spacesIndex.get(path);

  if (space)
  saveSpaceCache(superstate, space.space, {
    ...space.metadata,
    sort
  })
};

export const toggleWaypoint = (
  superstate: Superstate,
  spacePath: string,
  remove: boolean,
  rank?: number,
) => {
const settings = superstate.settings;
    if (remove) {
      settings.waypoints = settings.waypoints.filter(f => f != spacePath) 
    } else if (settings.waypoints.some(f => f == spacePath)) {
        const currIndex = settings.waypoints.findIndex(f => f == spacePath);
        settings.waypoints = arrayMove(settings.waypoints, currIndex, rank);
      
    } else {
      settings.waypoints = insert(settings.waypoints, rank, spacePath);
    }
  superstate.saveSettings();
  
};



export const removePathsFromSpace = async (
  superstate: Superstate,
  spacePath: string,
  paths: string[]
) => {
const space = superstate.spacesIndex.get(spacePath);
if (!space) return;
  if (space.type == 'default') {
    if (space.path == 'spaces://$waypoints') {
      toggleWaypoint(superstate, paths[0], true)
      return;
    }
  }
  if (space.type == 'tag') {
    paths.forEach(path => deleteTagFromPath(superstate, path, space.name))
  } else if (space.type == 'folder' || space.type == 'vault') {

  await saveSpaceMetadataValue(superstate, space.path, "links", space.metadata.links.filter(f => !paths.some(g => g == f)))
  paths.map(f => {
    superstate.reloadPath(f, true).then(g => superstate.dispatchEvent("pathStateUpdated", {path: f}))
  })
}
}


export const newPathInSpace = async (
  superstate: Superstate,
  space: SpaceState,
  type: string,
  name: string,
  dontOpen?: boolean
) => {
  let newPath;
if (space.type == 'tag') {

  newPath = await superstate.spaceManager.createItemAtPath(
    '/',
    type,
    name,
  );
  await superstate.spaceManager.addTag(newPath, space.name);
} else {
    newPath = await superstate.spaceManager.createItemAtPath(
      space.path,
      type,
      name,
    );
}
    if (!dontOpen) {
      superstate.ui.openPath(newPath, false);
    }

};

export const saveLabel = (superstate: Superstate, path: string, label: string, value: string) => {
  superstate.spaceManager.saveLabel(path, label, value);
}

export const saveProperties = (superstate: Superstate, path: string, properties: Record<string, any>) => {
    if (superstate.spacesIndex.has(path)) {
        saveSpaceProperties(superstate, path, properties)
    }
    superstate.spaceManager.saveProperties(path, properties);
};

