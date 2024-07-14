import { SpaceDefFilter, SpaceDefGroup } from "core/types/space";
import { PathState } from "core/types/superstate";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { parseProperty } from "utils/parsers";
import { serializeMultiString } from "utils/serializers";

const filterPathsForAny = (paths: PathState[], filters: SpaceDefFilter[], props: Record<string, string>) : PathState[] => {
  
  const newArray = filters.reduce((p, c) => {
    const [result, remaining] = p;
    
    const filteredPaths = c.type == 'context' ? filterContext(remaining, c, props) :  c.type == 'path' ? filterPathCache(remaining, c, props) : c.type == 'frontmatter' ? filterFM(remaining, c, props)  : filterPathProperties(remaining, c, props)
    const diffArray = remaining.filter(x => !filteredPaths.includes(x));
    return [[...result, ...filteredPaths], diffArray]
  }, [[], paths])
  return newArray[0];
}

const filterPathsForAll = ( paths: PathState[], filters: SpaceDefFilter[], props: Record<string, string>) : PathState[] => {
  return filters.reduce((p, c) => {
    return  c.type == 'context' ? filterContext(p, c, props) :  c.type == 'path' ? filterPathCache(p, c, props) : c.type == 'frontmatter' ? filterFM(p, c, props) : filterPathProperties(p, c, props);
  }, paths)
}
const filterContext = ( paths: PathState[], def: SpaceDefFilter, props: Record<string, string>) => {
  const filterFn = filterFnTypes[def.fn];
  if (!filterFn || (filterFn.valueType != 'none' && def.value.length == 0)) {
    return [];
  }
  return paths.filter(f => {
    const [contextPath, field] = def.field.split('.');
    
    const fm = f.metadata?.property
    if (!f.spaces?.includes(contextPath))
      return false;
  
    if (!fm || !fm[field]) {
      return false;
    } 

    
    let result = true;
  
    if (filterFn) {
      const value =  (def.fType == 'property') ? props[def.value] : def.value;
      
      result = filterFn.fn(parseProperty(field, fm[field]), value);
    }
    return result;
  })
}

const filterFM = ( paths: PathState[], def: SpaceDefFilter, props: Record<string, string>) => {
  const filterFn = filterFnTypes[def.fn];
  if (!filterFn || (filterFn.valueType != 'none' && def.value.length == 0)) {
    return [];
  }
  return paths.filter(f => {
    const fm = f.metadata?.property
    if (!fm || fm[def.field] === undefined) {
      return false;
    } 
    
    let result = true;
  
    if (filterFn) {
      const value =  (def.fType == 'property') ? props[def.value] : def.value;
      result = filterFn.fn(parseProperty(def.field, fm[def.field]), value);
    }
    return result;
  })
}
const filterPathCache = (paths: PathState[], def: SpaceDefFilter, props: Record<string, string>) => {
  const filterFn = filterFnTypes[def.fn];
  if (!filterFn || (filterFn.valueType != 'none' && def.value.length == 0)) {
    return [];
  }
  return paths.filter(f => {
  let value = '';
  if (def.field == 'outlinks') {
    value = serializeMultiString(f.outlinks ?? [])
  } else if (def.field == 'inlinks') {
    value = serializeMultiString(f.inlinks ?? [])
  } else if (def.field == 'tags') {
    value = serializeMultiString(f.tags ?? []);
  }
  
    let result = true;
  
    if (filterFn) {
      const defValue =  (def.fType == 'property') ? props[def.value] : def.value;
      result = filterFn.fn(value, defValue);
    }
    return result;
  });
}

const filterPathProperties = (paths: PathState[], def: SpaceDefFilter, props: Record<string, string>) => {
  const filterFn = filterFnTypes[def.fn];
  if (!filterFn || (filterFn.valueType != 'none' && def.value.length == 0)) {
    return [];
  }
  return paths.filter(f => {
    
      
      
      let result = true;
      if (filterFn) {
        const value =  (def.fType == 'property') ? props[def.value] : def.value;
        result = filterFn.fn(f.metadata?.[def.type]?.[def.field], value);
      }
      return result;
    
  })
}



export const pathByDef = ( filters: SpaceDefGroup[], path: PathState,  props: Record<string, string>) => {

  const pathInFilter = filters.reduce((p, c) => {
    if (!p || c.filters.length == 0) return false;
    const result = (c.type == 'any') ? filterPathsForAny([path], c.filters, props).length > 0 : filterPathsForAll([path], c.filters, props).length > 0
    return result
  }, true);
return pathInFilter; 
}