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
import { safelyParseJSON } from "shared/utils/json";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty } from "../../../utils/parsers";
import { deriveSchemaFromValue, inferCellTypeForValue } from "../../../utils/properties";

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
  calculate=true
): Promise<void> => {
  await manager.saveTable(spaceInfo.path, newTable, forceCreate).then(f => {
    if (f)
    // Always force reload after save to ensure UI updates
    return manager.superstate.reloadContextByPath(spaceInfo.path, { force: true, calculate })
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
                  // Update Table Value
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
    rank?: number,
    force?: boolean,
    calculate?: boolean
): Promise<void> => {

  return manager.contextForSpace(space.path).then(f => 
    {
      const updateFunction = _updateFunction ?? updateValue
      let newMDB = updateFunction(f, PathPropertyName, path, field, value);
      if (rank)
      newMDB = reorderRowsForPath(newMDB, [path], rank);
    if (manager.superstate.settings.enhancedLogs) {
      // Update Context Value
    }
      return saveContext(manager, space, newMDB, force, calculate)
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


// Try to JSON-parse strings that look like an object/array. Repeated saves
// of nested objects can leave behind values that have been stringified more
// than once; this peels them back so inference sees the real shape.
const unwrapStringifiedJSON = (v: any): any => {
  let cur = v;
  for (let i = 0; i < 5; i++) {
    if (typeof cur !== "string") break;
    const trimmed = cur.trimStart();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) break;
    try {
      cur = JSON.parse(cur);
    } catch {
      break;
    }
  }
  return cur;
};

// Merge sample-derived schema into an existing schema. Adds new keys.
// For existing keys, only upgrades when the existing entry is a "text"
// placeholder (the fallback we use when widening saw an empty value) and
// the live value now infers to something more specific. Never downgrades or
// overrides a non-text type — explicit user choices are preserved.
export const mergeObjectSchema = (
  existingType: any,
  sample: Record<string, any>,
): { merged: any; changed: boolean } => {
  let changed = false;
  const merged: any = { ...(existingType ?? {}) };
  for (const k of Object.keys(sample)) {
    const v = unwrapStringifiedJSON(sample[k]);
    if (!(k in merged)) {
      merged[k] = { ...deriveSchemaFromValue({ [k]: v })[k] };
      changed = true;
      continue;
    }
    const existingEntry = merged[k];
    const inferred = inferCellTypeForValue(v, k);
    // Upgrade generic placeholders to a more specific inferred type when the
    // live value clearly demands it (e.g. text→boolean, option-multi→link-multi).
    // Non-generic types are preserved so explicit user choices stay sticky.
    const isGenericExisting =
      existingEntry.type === "text" ||
      existingEntry.type === "option" ||
      existingEntry.type === "option-multi";
    if (
      isGenericExisting &&
      inferred !== existingEntry.type &&
      inferred !== "text"
    ) {
      merged[k] = { ...deriveSchemaFromValue({ [k]: v })[k] };
      changed = true;
      continue;
    }
    // Recurse into nested object schemas so deeper sub-keys also get added
    // / upgraded.
    const sub = Array.isArray(v) ? v[0] : v;
    if (
      sub &&
      typeof sub === "object" &&
      !Array.isArray(sub) &&
      (existingEntry.type === "object" ||
        existingEntry.type === "object-multi")
    ) {
      const subExisting = existingEntry.value?.type ?? {};
      const subResult = mergeObjectSchema(subExisting, sub);
      if (subResult.changed) {
        merged[k] = {
          ...existingEntry,
          value: {
            ...(existingEntry.value ?? {}),
            type: subResult.merged,
            typeName: existingEntry.value?.typeName ?? k,
          },
        };
        changed = true;
      }
    }
  }
  return { merged, changed };
};

// Whenever a file's frontmatter changes, widen each object-typed column's
// schema additively. Lets users (or templates) introduce new sub-fields by
// typing them into any file in the space; other files will then see those
// sub-rows on render.
export const widenObjectSchemasForPath = async (
  superstate: Superstate,
  path: string,
  mdb: SpaceTable,
  space: SpaceInfo,
): Promise<void> => {
  const objectCols = mdb.cols.filter(
    (c) => c.type === "object" || c.type === "object-multi",
  );
  if (objectCols.length === 0) return;
  const rawFm = await superstate.spaceManager.readProperties(path);
  if (!rawFm) return;

  for (const col of objectCols) {
    // readProperties() runs each value through parseProperty, which
    // JSON-stringifies nested objects. Repeated saves can leave values
    // double-stringified, so peel until we hit a non-string.
    const v: any = unwrapStringifiedJSON(rawFm[col.name]);
    if (v == null || typeof v !== "object") continue;
    const sample = Array.isArray(v) ? v[0] : v;
    if (!sample || typeof sample !== "object" || Array.isArray(sample))
      continue;

    let existing: any = {};
    try {
      existing = col.value ? JSON.parse(col.value) : {};
    } catch {
      existing = {};
    }
    const { merged, changed } = mergeObjectSchema(existing.type ?? {}, sample);
    // Skip the write entirely when nothing's new — avoids write amplification
    // on every keystroke in unrelated frontmatter fields.
    if (!changed) continue;

    const newValue = JSON.stringify({
      ...existing,
      type: merged,
      typeName: existing.typeName ?? col.name,
    });

    await superstate.spaceManager.saveSpaceProperty(
      space.path,
      { ...col, value: newValue },
      col,
    );
  }
};

// One-shot retroactive widening: walk every row in a space's context table
// and apply per-path widening. Use to backfill columns that were synced
// before the live-widening hook existed (their .value would otherwise stay
// empty until each file gets edited).
export const backfillObjectSchemasForSpace = async (
  superstate: Superstate,
  space: SpaceInfo,
): Promise<void> => {
  const mdb = await superstate.spaceManager.contextForSpace(space.path);
  if (!mdb) return;
  const hasObjectCols = mdb.cols.some(
    (c) => c.type === "object" || c.type === "object-multi",
  );
  if (!hasObjectCols) return;
  const paths = mdb.rows
    .map((r) => r[PathPropertyName])
    .filter((p): p is string => !!p);
  for (const p of paths) {
    // Re-read the mdb each iteration so widenings from earlier rows are
    // visible (each saveSpaceProperty mutates the column value).
    const fresh = await superstate.spaceManager.contextForSpace(space.path);
    if (!fresh) return;
    await widenObjectSchemasForPath(superstate, p, fresh, space);
  }
};

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
      mdb.cols.filter(f => f.name != PathPropertyName && f.type != 'fileprop' && f.type != 'flex')
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
  const widenObjectSchemas = (mdb: SpaceTable, space: SpaceInfo) =>
    widenObjectSchemasForPath(superstate, path, mdb, space);

  const promises = spaces.map((space) => {
    return processContext(superstate.spaceManager, space, async (mdb, space) => {
      await widenObjectSchemas(mdb, space);
      const newRows = await updatePath(mdb);
      const newDB = {
        ...mdb,
        rows: newRows
      };
      if (!_.isEqual(mdb, newDB))
        {
          if (superstate.settings.enhancedLogs) {
            // Update Context Path Properties
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
            // Update Table Row
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
              // Update Value in Context
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
              // Rename Tag in Context
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
                // Remove Tag in Context
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
                  // Add Row in Table
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
                  // Delete Row in Table
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
              // Add Path in Context
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
            // Rename Link in Context
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
            // Remove link in context
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
            // Remove Path in Context
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
            // Reorder path in Context
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
            // Remove path in context
          }
          await saveContext(manager, context, newDB);}
        return newDB;
      })
}


