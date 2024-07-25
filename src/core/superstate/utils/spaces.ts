import { arrayMove } from "@dnd-kit/sortable";
import i18n from "core/i18n";
import { PathStateWithRank, Superstate } from "core/superstate/superstate";
import { MakeMDSettings } from "core/types/settings";
import { SpaceDefFilter, SpaceDefGroup, SpaceDefinition, SpaceSort } from "core/types/space";
import { CacheState, PathState, SpaceState } from "core/types/superstate";
import { reorderPathsInContext } from "core/utils/contexts/context";
import { runFormulaWithContext } from "core/utils/formula/parser";
import { mdbSchemaToFrameSchema } from "core/utils/frames/nodes";
import { ensureArray, ensureBoolean, ensureString, ensureStringValueFromSet } from "core/utils/strings";
import { compareByField, compareByFieldCaseInsensitive, compareByFieldDeep, compareByFieldNumerical } from "core/utils/tree";
import { isTouchScreen } from "core/utils/ui/screen";
import { movePath } from "core/utils/uri";
import { SpaceInfo, SpaceProperty } from "types/mdb";
import { MDBFrame } from "types/mframe";
import { TargetLocation } from "types/path";
import { insert } from "utils/array";
import { defaultValueForType } from "utils/properties";
import { sanitizeColumnName } from "utils/sanitizers";
import { deletePath } from "./path";
import { addTagToPath, deleteTagFromPath } from "./tags";

export type SpaceFragmentSchema = {
  id: string;
  name: string;
  sticker?: string;
  frameType?: string;
  type: "context" | 'frame' | 'action';
  path: string;
};

export const spaceContextsKey = (settings: MakeMDSettings) => settings.fmKeyContexts
export const spaceTemplateKey = (settings: MakeMDSettings) => settings.fmKeyTemplate
export const spaceTemplateNameKey = (settings: MakeMDSettings) => settings.fmKeyTemplateName
export const spaceFilterKey = (settings: MakeMDSettings) => settings.fmKeyFilter
export const spaceLinksKey = (settings: MakeMDSettings) => settings.fmKeyLinks
export const spaceSortKey = (settings: MakeMDSettings) => settings.fmKeySort
export const FMSpaceKeys = (settings: MakeMDSettings) => [spaceContextsKey(settings), spaceFilterKey(settings), spaceLinksKey(settings), spaceSortKey(settings), spaceTemplateNameKey(settings), spaceTemplateKey(settings)]

export const uriToSpaceFragmentSchema = async (
  superstate: Superstate,
  path: string
): Promise<SpaceFragmentSchema> => {
  const uri = superstate.spaceManager.uriByString(path);
  if (uri.refType == "context") {
    const schema = superstate.contextsIndex
      .get(uri.basePath)
      ?.schemas.find((s) => s.id == uri.ref);
    if (schema) {
      return {
        id: schema.id,
        name: schema.name,
        type: "context",
        path: uri.basePath,
      };
    }
  }
  if (uri.refType == "frame") {
    return superstate.spaceManager.readFrame(uri.basePath, uri.ref).then((s) => {

      const schema = s?.schema;
      if (schema) {
        const frameSchema = mdbSchemaToFrameSchema(schema);
        return {
          id: schema.id,
          name: frameSchema.name,
          sticker: frameSchema.def?.icon,
          type: "frame",
          frameType: frameSchema.type,
          path: uri.basePath,
        };
      }
      return null;
    });
  }
  if (uri.refType == "action") {
    const schema = superstate.actionsIndex
      .get(uri.path)
      ?.find((s) => s.schema.id == uri.ref)?.schema;
    if (schema) {
      return {
        id: schema.id,
        name: schema.name,
        sticker: schema.def?.icon,
        type: "action",
        path: uri.basePath,
      };
    }
  }
  return null;
};

const parseSpaceSort = (value: any) : SpaceSort => {
  return {
      field: ensureString(value?.['field'] ?? 'rank'),
      asc: ensureBoolean(value?.['asc']),
      group: ensureBoolean(value?.['group'])
  }
}

const fixSpaceDefType = (type: string) : string => {
  if (type == 'fileprop') return 'file';
  if (type == 'filemeta') return 'path';
  return ensureString(type)
}

const parseSpaceFilterGroupFilter = (value: any) : SpaceDefFilter => {
    return {
        type: fixSpaceDefType(value['type']),
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
    return {
      sort: parseSpaceSort(metadata[spaceSortKey(settings)]), 
      contexts: ensureArray(metadata[spaceContextsKey(settings)]), 
      links: ensureArray(metadata[spaceLinksKey(settings)]), 
      filters: ensureArray(metadata[spaceFilterKey(settings)]).map(f => parseSpaceFilterGroup(f)),
      template: ensureString(metadata[spaceTemplateKey(settings)]),
      templateName: ensureString(metadata[spaceTemplateNameKey(settings)])
    }
}

type TreeNodeType = 'space' | "file" | 'group' | 'new'
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

export const spaceRowHeight = (superstate: Superstate, preset: number, section: boolean) => {
  const spaceHeight = preset ?? 29;
  return isTouchScreen(superstate.ui) ? 40 : section ?  spaceHeight + 10 : spaceHeight;
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
    if (sortStrategy.field == 'number') {
      sortFns.push(compareByFieldNumerical('name', sortStrategy.asc));
    } else 
    if (sortStrategy.field == 'name')
    
    {
      sortFns.push(compareByFieldCaseInsensitive(sortStrategy.field, sortStrategy.asc));
    } else if (sortStrategy.field.startsWith('props')) {
      const propName = sortStrategy.field.split('.')[1];
      const fieldFunc = (obj: Record<string, any>) => obj?.metadata?.property?.[propName]
      sortFns.push(compareByFieldDeep(fieldFunc, sortStrategy.asc));
    }
    else {
      const fieldFunc = (obj: Record<string, any>) => obj?.metadata?.file?.[sortStrategy.field]
sortFns.push(compareByFieldDeep(fieldFunc, sortStrategy.asc))
    }
    return sortFns.reduce((p, c) => {
      return p == 0 ? c(a, b) : p;
    }, 0);
  };



export const updatePathRankInSpace = async (
  superstate: Superstate,
  path: string,
  rank: number,
  space: string
) => {

  const spaceState = superstate.spacesIndex.get(space);
if (!spaceState) return;

    const fixedRank = rank;
    // if (parseInt(item.rank) > rank) fixedRank = rank + 1;
    superstate.addToContextStateQueue(() => reorderPathsInContext(superstate.spaceManager, [path], fixedRank, spaceState.space).then(f => {
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

export const setTemplateInSpace = (superstate: Superstate, path: string, template: string) => {
  saveSpaceMetadataValue(superstate, path, "template", template)

}

export const setTemplateNameInSpace = (superstate: Superstate, path: string, templateName: string) => {
  saveSpaceMetadataValue(superstate, path, "templateName", templateName)

}

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


  const space = superstate.spacesIndex.get(path);

  let newSpaceCache;
  if (space) {
    if (!superstate.pathsIndex.has(path)) {
      return await superstate.reloadSpace(space.space)
      return;
    }
    if (newSpace)
      {
        newSpaceCache =  await saveSpaceCache(superstate, space.space, newSpace)
      } else {
        return;
      }
  } else {
    const spaceInfo = superstate.spaceManager.spaceInfoForPath(path);

    if (spaceInfo.readOnly) {
      return await superstate.reloadSpace(spaceInfo)
    }
    await superstate.spaceManager.createSpace(spaceInfo.name, superstate.spaceManager.parentPathForPath(spaceInfo.path), newSpace);
    
    if (newSpace) {

      await saveSpaceCache(superstate, spaceInfo, newSpace)
      newSpaceCache = await superstate.reloadSpace(spaceInfo, newSpace)
  } else {
    newSpaceCache = await superstate.reloadSpace(spaceInfo)
  }
  }
  superstate.onSpaceDefinitionChanged(newSpaceCache, null);
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

    export const defaultSpace = async (superstate: Superstate, activeFile: PathState) : Promise<SpaceState> =>
      {
        let spaceState = null;
        if (superstate.settings.newFileLocation == "folder") {
          spaceState = superstate.spacesIndex.get(superstate.settings.newFileFolderPath)
        } else if (superstate.settings.newFileLocation == "current" && activeFile && activeFile.type == 'space') {
          spaceState = superstate.spacesIndex.get(activeFile.path)
        } else if (activeFile) {
          spaceState = superstate.spacesIndex.get(activeFile.parent)
        }
        if (!spaceState) {
          spaceState = superstate.spacesIndex.get('/');
        }
        return spaceState;
      }
  
export const pinPathToSpaceAtIndex = async (
  superstate: Superstate,
  space: SpaceState,
  path: string,
  rank?: number
) => {
  if (path == space.path) {
    // superstate.ui.notify('Pinning space to itself not currently allowed')
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

export const metadataPathForSpace = (superstate: Superstate, space: SpaceInfo) => {
  if (superstate.settings.enableFolderNote) {
    return space.notePath;
  }
  return space.defPath 
}

export const saveSpaceTemplate = async (
  superstate: Superstate,
  path: string,
  space: string
) => {
  const spaceCache = superstate.spacesIndex.get(space);
  if (!spaceCache) return;
  await superstate.spaceManager.saveTemplate(path, spaceCache.path)
  superstate.ui.notify(i18n.notice.templateSaved + spaceCache.name)
}

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
  
}
}

export const newTemplateInSpace = async (
  superstate: Superstate,
  space: SpaceState,
  name: string,
  location?: TargetLocation
) => {
  let newName: string;
  try {
    if (space.metadata.templateName?.length > 0) {
      const result = runFormulaWithContext(superstate.formulaContext,superstate.pathsIndex, space.metadata.templateName, {}, {}, superstate.pathsIndex.get(space.path))
      if (result?.length> 0) newName = result
    }
  } catch (e) {
  }
  if (!(await superstate.spaceManager.pathExists(`${space.path}/.space/templates/${name}`))) {
    newPathInSpace(superstate, space, "md", null, false, null, location);
    return;
  }
const newPath = await superstate.spaceManager.copyPath(`${space.path}/.space/templates/${name}`, space.path, newName)
if (newPath)
superstate.ui.openPath(newPath, location)
}


export const newPathInSpace = async (
  superstate: Superstate,
  space: SpaceState,
  type: string,
  name: string,
  dontOpen?: boolean,
  content?: string,
  location?: TargetLocation
) => {
  let newPath;
if (space.type == 'tag') {

  newPath = await superstate.spaceManager.createItemAtPath(
    '/',
    type,
    name,
    content
  );
  await superstate.spaceManager.addTag(newPath, space.name);
} else {
    newPath = await superstate.spaceManager.createItemAtPath(
      space.path,
      type,
      name,
      content
    );
}
    if (!dontOpen) {
      superstate.ui.openPath(newPath, location);
    }
return newPath
};

export const saveLabel = (superstate: Superstate, path: string, label: string, value: string) => {
  superstate.spaceManager.saveLabel(path, label, value);
}

export  const saveNewProperty = async (superstate: Superstate, path: string, property: SpaceProperty) => {
  const saveProperty = (
    tableData : MDBFrame,
    newColumn: SpaceProperty,
    oldColumn?: SpaceProperty
  ): boolean => {
    const column = {
      ...newColumn,
      name: sanitizeColumnName(newColumn.name),
    };
    const mdbtable = tableData;

    if (column.name == "") {
      superstate.ui.notify(i18n.notice.noPropertyName);
      return false;
    }
    if (
      (!oldColumn &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        )) ||
      (oldColumn &&
        oldColumn.name != column.name &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        ))
    ) {
      superstate.ui.notify(i18n.notice.duplicatePropertyName);
      return false;
    }
    const oldFieldIndex = oldColumn
      ? mdbtable.cols.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: SpaceProperty[] =
      oldFieldIndex == -1
        ? [...mdbtable.cols, column]
        : mdbtable.cols.map((f, i) => (i == oldFieldIndex ? column : f));
    const newTable = {
      ...mdbtable,
      cols: newFields ?? [],
    };
    superstate.spaceManager.saveFrame(path, newTable as MDBFrame);
    return true;
  };
  if (superstate.spacesIndex.has(path)) {
    const tableData = await superstate.spaceManager.readFrame(path, 'main');
    saveProperty(tableData, {...property, schemaId: "main"});
} else {
  superstate.spaceManager.saveProperties(path, { [property.name]: defaultValueForType(property.type) });
}
}

export const saveProperties = (superstate: Superstate, path: string, properties: Record<string, any>) => {
    if (superstate.spacesIndex.has(path)) {
        saveSpaceProperties(superstate, path, properties)
    } else {
      superstate.spaceManager.saveProperties(path, properties);
    }
};

export const renameProperty = (superstate: Superstate, path: string, oldName: string, newName: string) => {
    if (superstate.spacesIndex.has(path)) {
        superstate.spaceManager.renameProperty(metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space), oldName, newName)
        return;
    }
  superstate.spaceManager.renameProperty(path, oldName, newName);
}

export const deleteProperty = (superstate: Superstate, path: string, name: string) => {
    if (superstate.spacesIndex.has(path)) {
        superstate.spaceManager.deleteProperty(metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space), name)
        return;
    }
  superstate.spaceManager.deleteProperty(path, name);
}