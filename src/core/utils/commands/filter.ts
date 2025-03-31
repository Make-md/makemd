import { FilterDef, FilterGroupDef } from "shared/types/spaceDef";
import { parseProperty } from "utils/parsers";
import { filterFnTypes } from "../contexts/predicate/filterFns/filterFnTypes";

const filterForAny = (props: {[key: string]: any}, filters: FilterDef[]) : boolean => {
    return filters.reduce((p, c) => {
      if (p == true) return true;
      return props ? filterForProps(props, c) : false;
    }, false)
  }
  
  const filterForProps = (props: {[key: string]: any}, def: FilterDef) : boolean => {
    const filterFn = filterFnTypes[def.fn];
      
      let result = true;
      if (filterFn) {
        result = filterFn.fn(parseProperty(def.field, props[def.field]), def.value);
      }
      return result;
    }

  const filterPathsForAll = ( props: {[key: string]: any}, filters: FilterDef[]) : boolean => {
    return filters.reduce((p, c) => {
        if (p == false) return false;
      return props ? filterForProps(props, c) : false;
    }, true)
  }

export const resultForFilters = ( filters: FilterGroupDef[], props: {[key: string] : any}) => {

    const pathInFilter = filters.reduce((p, c) => {
      if (!p || c.filters.length == 0) return false;
      const result = (c.type == 'any') ? filterForAny(props, c.filters) : filterPathsForAll(props, c.filters)
      return result
    }, true);
  return pathInFilter; 
  }