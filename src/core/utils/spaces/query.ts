import { SpaceDefFilter, SpaceDefGroup } from "core/types/space";
import { PathState } from "core/types/superstate";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { parseProperty } from "utils/parsers";
import { serializeMultiString } from "utils/serializers";

const filterPathsForAny = (paths: PathState[], filters: SpaceDefFilter[]) : PathState[] => {
  const newArray = filters.reduce((p, c) => {
    const [result, remaining] = p;
    const filteredPaths = (c.type == 'fileprop') ? filterPathProperties(remaining, c) :
    c.type == 'filemeta' ? filterPathCache(remaining, c) : c.type == 'frontmatter' ? filterFM(remaining, c) : [];
    const diffArray = remaining.filter(x => !filteredPaths.includes(x));
    return [[...result, ...filteredPaths], diffArray]
  }, [[], paths])
  return newArray[0];
}

const filterPathsForAll = ( paths: PathState[], filters: SpaceDefFilter[]) : PathState[] => {
  return filters.reduce((p, c) => {
    return (c.type == 'fileprop') ? filterPathProperties(p, c) :
    c.type == 'filemeta' ? filterPathCache(p, c) : c.type == 'frontmatter' ? filterFM(p, c) : [];
  }, paths)
}

const filterFM = ( paths: PathState[], def: SpaceDefFilter) => {

  return paths.filter(f => {
    const fm = f.metadata?.property
    if (!fm || !fm[def.field]) {
      return false;
    } 
    const filterFn = filterFnTypes[def.fn];
    let result = true;
  
    if (filterFn) {
      result = filterFn.fn(parseProperty(def.field, fm[def.field]), def.value);
    }
    return result;
  })
}
const filterPathCache = (paths: PathState[], def: SpaceDefFilter) => {
  return paths.filter(f => {
  let value = '';
  if (def.field == 'outlinks') {
    value = serializeMultiString(f.outlinks)
  } else if (def.field == 'inlinks') {
    value = serializeMultiString(f.inlinks)
  } else if (def.field == 'tags') {
    value = serializeMultiString(f.tags);
  }
  const filterFn = filterFnTypes[def.fn];
    let result = true;
  
    if (filterFn) {
      result = filterFn.fn(value, def.value);
    }
    return result;
  });
}

const filterPathProperties = (paths: PathState[], def: SpaceDefFilter) => {
  return paths.filter(f => {
    const vaultItemFields = ['name', 'path', 'sticker', 'color', 'isFolder', 'extension', 'ctime', 'mtime', 'size', 'parent']
    if (vaultItemFields.includes(def.field)) {
      const filterFn = filterFnTypes[def.fn];
      
      let result = true;
      if (filterFn) {
        result = filterFn.fn(f[def.field as keyof PathState], def.value);
      }
      return result;
    }
    return true;
  })
}



export const pathByDef = ( filters: SpaceDefGroup[], path: PathState) => {

  const pathInFilter = filters.reduce((p, c) => {
    if (!p || c.filters.length == 0) return p;
    const result = (c.type == 'any') ? filterPathsForAny([path], c.filters).length > 0 : filterPathsForAll([path], c.filters).length > 0
    return result
  }, true);
return pathInFilter; 
}