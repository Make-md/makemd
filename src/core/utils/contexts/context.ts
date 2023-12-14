//handles db ops

import { PathPropertyName } from "core/types/context";
import { linkColumns, removeLinksInRow, renameLinksInRow } from "core/utils/contexts/links";
import { removeRowForPath, removeRowsForPath, renameRowForPath, reorderRowsForPath } from "core/utils/contexts/pathUpdates";
import _ from "lodash";
import { DBRows, SpaceInfo, SpaceProperty, SpaceTable } from "types/mdb";
import { insertMulti } from "utils/array";

import { SpaceManager } from "core/spaceManager/spaceManager";
import { parseMDBValue } from "utils/properties";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString } from "../../../utils/parsers";



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
  context: SpaceInfo,
  newTable: SpaceTable,
  force?: boolean
): Promise<void> => {
  return manager.saveTable(context.path, newTable, force)
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

const saveContextToProperties = (
  manager: SpaceManager,
  path: string,
  cols: SpaceProperty[],
  context: Record<string, any>,
) => {
  
  manager.saveProperties(path, Object.keys(context)
  .filter(
    (f) =>
      cols.find((c) => c.name == f) &&
      cols.find((c) => c.name == f).hidden != "true" &&
      !cols.find((c) => c.name == f).type.includes("file") &&
      context[f]
  )
  .reduce((f, g) => {
    const col = cols.find((c) => c.name == g);
    return {...f, [g]: parseMDBValue(col.type, context[g])};
  }, {}));
};


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
    value: string) => SpaceTable
): Promise<void> => {
  manager.contextForSpace(space.path).then(f => 
    {
      const updateFunction = _updateFunction ?? updateValue
      const newMDB = updateFunction(f, PathPropertyName, path, field, value);
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

export const insertContextItems = async (
  manager: SpaceManager,
  newPaths: string[],
  t: string
): Promise<void> => {

  const saveNewContextRows = async (tag: SpaceTable, space: SpaceInfo) => {
    const newRow: DBRows = newPaths.map((newPath) => ({ [PathPropertyName]: newPath }));
    await saveContext(manager, space, insertRowsIfUnique(tag, newRow));
  };
  const spaceInfo = manager.spaceInfoForPath(t);
  await manager
  .contextForSpace(t).then((tagDB) =>
    saveNewContextRows(tagDB, spaceInfo)
  );
};

const getPathProperties = async (manager: SpaceManager, path: string, cols: string[]) => {
  const properties = await manager.readProperties(path)
  if (!properties) return {}
  return Object.keys(properties).reduce((p, c) => {
  if (cols.includes(c)) {
    return {...p, [c]: properties[c]}
  }
  return p;
    }, {});
};



export const updateContextWithProperties = async (
  manager: SpaceManager,
  path: string,
  spaces: SpaceInfo[]
): Promise<void[]> => {
  const updatePath = async (mdb: SpaceTable) => {
    const objectExists = mdb.rows.some(item => item[PathPropertyName] === path)
    const properties = await getPathProperties(
      manager,
      path,
      mdb.cols.map((f) => f.name),
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
    return processContext(manager, space, async (mdb, space) => {
      const newRows = await updatePath(mdb);
      const newDB = {
        ...mdb,
        rows: newRows
      };
      if (!_.isEqual(mdb, newDB))
        {
          await saveContext(manager, space, newDB);
        }
      return newDB;
    })
  });
  await Promise.all(promises);
  return;
};


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
              await saveContext(manager, space, newDB);
            }
          return newDB;
        })
      });
      return Promise.all(promises);
    }



export const addPathInContexts = async (manager: SpaceManager,
  path: string,
  contexts: SpaceInfo[], index?: number): Promise<void[]> => {

    const promises = contexts.map((space) => {
      return processContext(manager, space, async (mdb, space) => {
        const newDB = insertRowsIfUnique(mdb, [{ [PathPropertyName]: path }], index);
        if (!_.isEqual(mdb, newDB))
          {
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
        const removeRow = mdb.rows.find(f => f[PathPropertyName] == path);
        if (removeRow) {
          saveContextToProperties(manager, path, mdb.cols, removeRow)
        }
        const newDB = removeRowForPath(mdb, path);
        if (!_.isEqual(mdb, newDB))
        {
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
          await saveContext(manager, context, newDB, true);}
        return newDB;
      })
}

export const removePathsInContext = async (manager: SpaceManager,
  paths: string[],
  space: SpaceInfo): Promise<void> => {

      return processContext(manager, space, async (mdb, context) => {
        mdb.rows.forEach(row => {
          if (paths.includes(row[PathPropertyName]))
            saveContextToProperties(manager, row[PathPropertyName], mdb.cols, row)
        })
        const newDB = removeRowsForPath(mdb, paths);
        if (!_.isEqual(mdb, newDB))
        {
          await saveContext(manager, context, newDB);}
        return newDB;
      })
}


