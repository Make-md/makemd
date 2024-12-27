//handles db ops

import { linkColumns, removeLinksInRow, renameLinksInRow } from "core/utils/contexts/links";
import { removeRowForPath, removeRowsForPath, renameRowForPath, reorderRowsForPath } from "core/utils/contexts/pathUpdates";
import _ from "lodash";
import { PathPropertyName } from "shared/types/context";
import { DBRow, DBRows, SpaceProperty, SpaceTable } from "shared/types/mdb";
import { SpaceInfo } from "shared/types/spaceInfo";
import { insertMulti } from "shared/utils/array";

import { arrayMove } from "@dnd-kit/sortable";
import { DefaultSpaceCols } from "core/react/components/SpaceView/Frames/DefaultFrames/DefaultFrames";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { metadataPathForSpace } from "core/superstate/utils/spaces";
import { Superstate } from "makemd-core";
import { defaultContextFields } from "shared/schemas/fields";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty, safelyParseJSON } from "../../../utils/parsers";

export type ContextPath = {
  space: string;
  spaceName: string;
  schema?: string
  schemaName?: string;
  view?: string;
  viewName?: string;
}

export const contextPathFromPath = async (superstate: Superstate, path: string): Promise<ContextPath> => {
  const uri = superstate.spaceManager.uriByString(path);
  if (!uri) return null;
  const space = uri.basePath
  const spaceState = superstate.spacesIndex.get(uri.basePath)
  if (!spaceState) return null;
  let schema : string;
  let schemaName: string;
  let view : string;
  let viewName : string;
  if (uri.refType == 'frame') {
    view = uri.ref
    const frameSchemas = await superstate.spaceManager.readAllFrames(space).then(f =>Object.values(f).map(f => f.schema));
    if (view && frameSchemas) {
      viewName = frameSchemas.find(f => f.id == view)?.name
      schema = safelyParseJSON(frameSchemas.find(f => f.id == view)?.def)?.db
      schemaName = superstate.contextsIndex.get(space)?.schemas.find(f => f.id == schema)?.name
    }
  } else if (uri.refType == 'context') {
    schema = uri.ref
    schemaName = superstate.contextsIndex.get(space)?.schemas.find(f => f.id == schema)?.name
  }
  return {
    space,
    spaceName: spaceState.name,
    schema,
    schemaName,
    view,
    viewName
  }
}

const processTable = async (
  manager: SpaceManager,
  space: SpaceInfo,
  table: string,
  processor: (mdb: SpaceTable, space: SpaceInfo) => Promise<SpaceTable>,
): Promise<void> => {
    const contextDB = await manager
    .readTable(space.path, table);
    if (contextDB) {
      await processor(contextDB, space);
    }
};


const processContext = async (
  manager: SpaceManager,
  space: SpaceInfo,
  processor: (mdb: SpaceTable, space: SpaceInfo) => Promise<SpaceTable>,
): Promise<void> => {
    const contextDB = await manager
    .contextForSpace(space.path);
    if (contextDB) {
      await processor(contextDB, space);
    }
};


const saveContext = async (
  manager: SpaceManager,
  spaceInfo: SpaceInfo,
  newTable: SpaceTable,
  forceCreate?: boolean,
): Promise<void> => {
  await manager.saveTable(spaceInfo.path, newTable, forceCreate).then(f => {
    if (f)
    return manager.superstate.reloadContextByPath(spaceInfo.path, true)
  return f});
};




export const insertPropertyMultiValue = (
  folder: SpaceTable,
  lookupField: string,
  lookupValue: string,
  field: string,
  value: string
) => {
  return {
    ...folder,
    rows: folder.rows.map((f) =>
      f[lookupField] == lookupValue
        ? {
            ...f,
            [field]: serializeMultiString([...parseMultiString(f[field]), value]),
          }
        : f
    ),
  };
};

export const deletePropertyMultiValue = (
  folder: SpaceTable,
  lookupField: string,
  lookupValue: string,
  field: string,
  value: string
) => {
  return {
    ...folder,
    rows: folder.rows.map((f) =>
      f[lookupField] == lookupValue
        ? {
            ...f,
            [field]: serializeMultiString(parseMultiString(f[field]).filter(g => g != value)),
          }
        : f
    ),
  };
};

const updateValue = (
  folder: SpaceTable,
  lookupField: string,
  lookupValue: string,
  field: string,
  value: string
) => {
  return {
    ...folder,
    rows: folder.rows.map((f) =>
      f[lookupField] == lookupValue
        ? {
            ...f,
            [field]: value,
          }
        : f
    ),
  };
};

const insertRowsIfUnique = (folder: SpaceTable, rows: DBRows, index?: number): SpaceTable => {
  //
  return { ...folder, rows: index ? insertMulti(folder.rows, index, rows.filter(f => !folder.rows.some(g => g[PathPropertyName] == f[PathPropertyName]))) : [...rows.filter(f => !folder.rows.some(g => g[PathPropertyName] == f[PathPropertyName])), ...folder.rows] };
};


const insertRows = (folder: SpaceTable, rows: DBRows, index?: number): SpaceTable => {
  //
  return { ...folder, rows: index ? insertMulti(folder.rows, index, rows) : [...folder.rows, ...rows] };

}

const updateRowAtIndex = (folder: SpaceTable, row: DBRow, index: number): SpaceTable => {
  //
  return { ...folder, rows: folder.rows.map((f, i) => i == index ? row : f) };
};


export const updateTableValue = async (
  manager: SpaceManager,
  space: SpaceInfo,
  schema: string,
  index: number,
  field: string,
  value: string,
    rank?: number) => {
      processTable(manager, space, schema, (async f => 
        {

          let newMDB = {
            ...f,
            rows: f.rows.map((f, i) =>
              i == index
                ? {
                    ...f,
                    [field]: value,
                  }
                : f
            ),
          };
          if (rank)
          newMDB = {
            ...newMDB,
            rows: arrayMove(newMDB.rows, index, rank)
            }
    
            if (!_.isEqual(f, newMDB))
              {
                if (manager.superstate.settings.enhancedLogs)
                {
                  console.log('Saving Context Change: Update Table Value')
                }
                await saveContext(manager, space, newMDB);}
            return newMDB;
        })
        )
    }

export const updateContextValue = async (
  manager: SpaceManager,
  space: SpaceInfo,
  path: string,
  field: string,
  value: string,
  _updateFunction?: (folder: SpaceTable,
    lookupField: string,
    lookupValue: string,
    field: string,
    value: string) => SpaceTable, 
    rank?: number
): Promise<void> => {

  manager.contextForSpace(space.path).then(f => 
    {
      const updateFunction = _updateFunction ?? updateValue
      let newMDB = updateFunction(f, PathPropertyName, path, field, value);
      if (rank)
      newMDB = reorderRowsForPath(newMDB, [path], rank);
if (manager.superstate.settings.enhancedLogs) {
  console.log('Saving Context Change: Update Context Value')
}
      return saveContext(manager, space, newMDB).then(f => newMDB)
    }
    )
};


export const columnsForContext = async (
  manager: SpaceManager,
  space: SpaceInfo
): Promise<SpaceProperty[]> => {
  return manager
      .contextForSpace(space.path).then(
    (tagDB) => tagDB?.cols ?? []
  );
};



const getPathProperties = async (superstate: Superstate, _path: string, cols: SpaceProperty[]) => {
  let path = _path;
  if (superstate.spacesIndex.has(path)) {
    path = metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space);
  }
  const properties = await superstate.spaceManager.readProperties(path)
  if (!properties) return {}
  return Object.keys(properties).reduce((p, c) => {
  if (cols.some(f => f.name == c)) {
    return {...p, [c]: parseProperty(c, properties[c], cols.find(f => f.name == c).type)}
  }
  return p;
    }, {});
};

export const getContextProperties = (superstate: Superstate, context: string) : SpaceProperty[] => {
  if (context == "$space")  {
    return DefaultSpaceCols;
  }
  if (context == "$context")  {
    return defaultContextFields.rows as SpaceProperty[];
  }
  return (superstate.contextsIndex.get(context)?.contextTable?.cols ??[]);

}


export const updateContextWithProperties = async (
  superstate: Superstate,
  path: string,
  spaces: SpaceInfo[]
): Promise<void[]> => {
  const updatePath = async (mdb: SpaceTable) => {
    const objectExists = mdb.rows.some(item => item[PathPropertyName] === path)
    const properties = await getPathProperties(
      superstate,
      path,
      mdb.cols.filter(f => f.name != PathPropertyName && f.type != 'fileprop')
    );

    if (objectExists) {
      
      return mdb.rows.map((f) =>
            f[PathPropertyName] == path
              ? {
                  ...f,
                  ...properties,
                }
              : f
          )
  } else {
    return  [...mdb.rows, {
      [PathPropertyName]: path,
          ...properties,
        }
    ]
}
  }
  const promises = spaces.map((space) => {
    return processContext(superstate.spaceManager, space, async (mdb, space) => {
      const newRows = await updatePath(mdb);
      const newDB = {
        ...mdb,
        rows: newRows
      };
      if (!_.isEqual(mdb, newDB))
        {
          if (superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Update Context Path Properties')
          }
          await saveContext(superstate.spaceManager, space, newDB, true);
        }
      return newDB;
    })
  });
  await Promise.all(promises);
  return;
};

export const updateTableRow = async (manager: SpaceManager,
  space: SpaceInfo,
  table: string,
  index: number,
  row: DBRow): Promise<void> => {
    return processTable(manager, space, table, async (mdb, space) => {
      const newDB = updateRowAtIndex(mdb, row, index);
      if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Update Table Row')
          }
          await saveContext(manager, space, newDB);
        }
      return newDB;
    })
}

export const updateValueInContext = async ( manager: SpaceManager,
  row: string,
  field: string,
  value: string,
  space: SpaceInfo): Promise<void> => {

    const changeTagInContextMDB = (mdb: SpaceTable) => {
        return {...mdb, rows: mdb.rows.map(f => f[PathPropertyName] == row ? ({...f, [field]: value}) : f)}
    }
      return processContext(manager, space, async (mdb, space) => {
        const newDB = changeTagInContextMDB(mdb);

        if (!_.isEqual(mdb, newDB))
          {
            if (manager.superstate.settings.enhancedLogs) {
              console.log('Saving Context Change: Update Value in Context')
            }
            await saveContext(manager, space, newDB);
          }
        return newDB;
      })
  }


export const renameTagInContexts = async ( manager: SpaceManager,
  oldTag: string,
  newTag: string,
  spaces: SpaceInfo[]): Promise<void[]> => {

    const changeTagInContextMDB = (mdb: SpaceTable) => {
        const cols = mdb.cols.map(f => f.type.startsWith('context') && f.value == oldTag ? {...f, value: newTag} : f);
        return {...mdb, cols}
    }
    const promises = spaces.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const newDB = changeTagInContextMDB(mdb);
        if (!_.isEqual(mdb, newDB))
          {
            if (manager.superstate.settings.enhancedLogs) {
              console.log('Saving Context Change: Rename Tag in Context')
            }
            await saveContext(manager, space, newDB);
          }
        return newDB;
      })
    });
    return Promise.all(promises);
  }

  export const removeTagInContexts = async ( manager: SpaceManager,
    tag: string,
    spaces: SpaceInfo[]): Promise<void[]> => {

      const deleteTagInContextMDB = (mdb: SpaceTable) => {
        const cols = mdb.cols.map(f => f.type.startsWith('context') && f.value == tag ? {...f, type: 'link-multi'} : f);
        return {...mdb, cols}
      }
      const promises = spaces.map((space) => {
        return processContext(manager, space, async (mdb, space) => {
          const newDB = deleteTagInContextMDB(mdb);
          if (!_.isEqual(mdb, newDB))
            {
              if (manager.superstate.settings.enhancedLogs) {
                console.log('Saving Context Change: Remove Tag in Context')
              }
              await saveContext(manager, space, newDB);
            }
          return newDB;
        })
      });
      return Promise.all(promises);
    }

    export const addRowInTable = async (manager: SpaceManager,
      row: DBRow,
      context: SpaceInfo, table: string, index?: number): Promise<void> => {
          return processTable(manager, context, table, async (mdb, space) => {
            const newDB = insertRows(mdb, [row], index);
            if (!_.isEqual(mdb, newDB))
              {
                if (manager.superstate.settings.enhancedLogs) {
                  console.log('Saving Context Change: Add Row in Table')
                }
                await saveContext(manager, space, newDB);}
            return newDB;
          })
        
    }
    export const deleteRowInTable = async (manager: SpaceManager,
      context: SpaceInfo, table: string, index: number): Promise<void> => {
          return processTable(manager, context, table, async (mdb, space) => {
            const newDB = {...mdb, rows: mdb.rows.filter((f, i) => i != index)};
            if (!_.isEqual(mdb, newDB))
              {
                if (manager.superstate.settings.enhancedLogs) {
                  console.log('Saving Context Change: Delete Row in Table')
                }
                await saveContext(manager, space, newDB);}
            return newDB;
          })
      }
    

export const addPathInContexts = async (manager: SpaceManager,
  path: string,
  contexts: SpaceInfo[], index?: number): Promise<void[]> => {

    const promises = contexts.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const newDB = insertRowsIfUnique(mdb, [{ [PathPropertyName]: path }], index);
        if (!_.isEqual(mdb, newDB))
          {
            if (manager.superstate.settings.enhancedLogs) {
              console.log('Saving Context Change: Add Path in Context')
            }
            await saveContext(manager, space, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
    
}

export const renameLinkInContexts = async (manager: SpaceManager,
  oldPath: string,
  newPath: string,
  spaces: SpaceInfo[]): Promise<void[]> => {

    const promises = spaces.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const linkCols = linkColumns(mdb.cols);
        const newDB = {
          ...mdb,
          rows: mdb.rows.map(r => renameLinksInRow(manager, r, oldPath, newPath, linkCols))
        } ;
        if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Rename Link in Context')
          }
          await saveContext(manager, space, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const removeLinkInContexts = async (manager: SpaceManager,
  path: string,
  spaces: SpaceInfo[]): Promise<void[]> => {

    const promises = spaces.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const linkCols = linkColumns(mdb.cols);
        const newDB = {
          ...mdb,
          rows: mdb.rows.map(r => removeLinksInRow(manager, r, path, linkCols))
        } ;
        if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Remove link in context')
          }
          await saveContext(manager, space, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const renamePathInContexts = async (manager: SpaceManager,
  oldPath: string,
  newPath: string,
  spaces: SpaceInfo[]): Promise<void[]> => {

    const promises = spaces.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const newDB = renameRowForPath(mdb, oldPath, newPath);
        if (!_.isEqual(mdb, newDB))
        {
          await saveContext(manager, space, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const removePathInContexts = async (manager: SpaceManager,
  path: string,
  spaces: SpaceInfo[]): Promise<void[]> => {
    const promises = spaces.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        // const removeRow = mdb.rows.find(f => f[PathPropertyName] == path);
        // if (removeRow) {
        //   saveContextToProperties(manager, path, mdb.cols, removeRow)
        // }
        const newDB = removeRowForPath(mdb, path);
        if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Remove Path in Context')
          }
          await saveContext(manager, space, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const reorderPathsInContext = async (manager: SpaceManager,
  paths: string[],
  index: number,
  space: SpaceInfo): Promise<void> => {

      return processContext(manager, space, async (mdb, context) => {
        const newDB = reorderRowsForPath(mdb, paths, index);

        if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Reorder path in Context')
          }
          await saveContext(manager, context, newDB, true);}
        return newDB;
      })
}

export const removePathsInContext = async (manager: SpaceManager,
  paths: string[],
  space: SpaceInfo): Promise<void> => {
      return processContext(manager, space, async (mdb, context) => {
        // mdb.rows.forEach(row => {
        //   if (paths.includes(row[PathPropertyName]))
        //     saveContextToProperties(manager, row[PathPropertyName], mdb.cols, row)
        // })
        const newDB = removeRowsForPath(mdb, paths);
        if (!_.isEqual(mdb, newDB))
        {
          if (manager.superstate.settings.enhancedLogs) {
            console.log('Saving Context Change: Remove path in context')
          }
          await saveContext(manager, context, newDB);}
        return newDB;
      })
}


