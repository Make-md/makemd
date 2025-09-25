import { parseFieldValue, parseFlexValue } from "core/schemas/parseFieldValue";
import { ConstantNode, FunctionNode, parse } from "mathjs";
import { PathPropertyName } from "shared/types/context";
import { IndexMap } from "shared/types/indexMap";
import { DBRow, DBRows, SpaceProperty } from "shared/types/mdb";
import { ContextState, PathState } from "shared/types/PathState";
import { MakeMDSettings } from "shared/types/settings";
import { FilterGroupDef } from "shared/types/spaceDef";
import { uniq } from "shared/utils/array";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty } from "../../../utils/parsers";
import { runFormulaWithContext } from "../formula/parser";
import { calculateAggregate } from "./predicate/aggregates";
import { filterReturnForCol } from "./predicate/filter";
import { resolvePath } from "core/superstate/utils/path";



export const linkContextProp = (
  propType: string,
  rows: string,
  contextTableRows: DBRows
) => {
  const contextRows = contextTableRows.filter((f) =>
    parseMultiString(rows).includes(f[PathPropertyName])
  );
  return serializeMultiString(uniq(contextRows.map((f) => f[propType]).filter((f) => f)));
};


export const propertyDependencies = (fields: SpaceProperty[]) => {
  const graph = new Map<string, Set<string>>();
  fields.filter((f) => f.type == "fileprop" || f.name.toLowerCase().startsWith('tags')).forEach((f) => {
    const { value } = parseFieldValue(f.value, f.type);
    const localDependencies = []
  try {
    const deps = parse(value).filter((f) => f.type == 'FunctionNode').filter(f => (f as FunctionNode).fn.name == 'prop' && (f as FunctionNode).args[0].type == 'ConstantNode').map(f => ((f as FunctionNode).args[0] as ConstantNode)?.value as unknown as string)
    localDependencies.push(...deps)
  }
  catch (e) {
  }
    

    const key = f.name
    if (!graph.has(key)) {
      graph.set(key, new Set());
  }
  for (const dep of localDependencies) {
      const depStr = dep; // Using the last part as the key
      if (depStr === key) continue; // Skip self dependencies
  
      // Add an edge from key to the dependency
      graph.get(key)!.add(depStr);
  }
})
const visited: Set<string> = new Set();
    const result: string[] = [];
    const temp: Set<string> = new Set();
  const visit = (key: string) => {
    if (temp.has(key)) throw new Error('Circular dependency detected');
    if (!visited.has(key)) {
        temp.add(key);
        const edges = graph.get(key) || new Set();
        
        for (const dep of edges) {
            visit(dep);
        }
        visited.add(key);
        temp.delete(key);
        result.push(key);
    }
  };

  for (const key of fields) {
      if (!visited.has(key.name)) {
          visit(key.name);
      }
  }
  return result;
}
export const linkContextRow = (
  runContext: math.MathJsInstance,
  paths: Map<string, PathState>,
  contextsMap: Map<string, ContextState>,
  spaceMap: IndexMap,
  _row: DBRow,
  fields: SpaceProperty[],
  path: PathState,
  settings: MakeMDSettings,
  dependencies?: string[]
) => {
  if (!_row) return {}
  if (!path) return _row
  const resolvedPath = resolvePath(_row[PathPropertyName], path.path, (spacePath) => paths.get(spacePath)?.type == 'space');
  
  const result = dependencies ?? propertyDependencies(fields)
  const frontmatter = (paths.get(resolvedPath)?.metadata?.property ?? {});
  
  const filteredFrontmatter = Object.keys(frontmatter).filter(f => fields.some(g => g.name == f) && f != PathPropertyName).reduce((p, c) => ({ ...p, [c]: parseProperty(c, frontmatter[c]) }), {})
  const properties = fields.reduce((p, c) => ({ ...p, [c.name]: c }), {});
  
  const tagData : Record<string, string> = {};
  const tagField = fields.find(f => f.name.toLowerCase() == 'tags');
  if (tagField) {
    tagData[tagField.name] = serializeMultiString([...(paths.get(resolvedPath)?.tags ?? [])]) 
  }
  
  
  const relationFields = fields.filter((f) => f && (f.type.startsWith('context'))).reduce((p, c) => {
    
    const fieldValue = parseFieldValue(c.value, c.type);
    const multi = c.type.endsWith('multi');
    const value = multi ? parseMultiString(_row[c.name]) : _row[c.name]?.length > 0 ? [_row[c.name]] : [];
    if (!fieldValue.space) {
          return p;
        }
        const items = contextsMap.get(fieldValue.space)?.contextTable?.rows ?? []
        const values = items.reduce((p, c) => {
            if (fieldValue.field, parseMultiString(c[fieldValue.field]).includes(resolvedPath)) {
              return [...p, c[PathPropertyName]];
            }
            return p;
          }, []).filter(f => f);

          if (multi) {
                return {
                  ...p, [c.name]: serializeMultiString(uniq([...value, ...values]))
                }
              }
    return {
      ...p, [c.name]: value[0] ?? values[0] ?? ''
    };
  }, {} as DBRow);
  const aggregateFields = fields.filter((f) => f && (f.type == "aggregate")).reduce((p, c) => {
    const fieldValue = parseFieldValue(c.value, c.type);
    // Resolve space path if it exists
    if (fieldValue.space) {
      fieldValue.space = resolvePath(fieldValue.space, path.path, (spacePath) => paths.get(spacePath)?.type == 'space');
    }
    
    const values = rowsForAggregate(fieldValue, fields, spaceMap, _row, contextsMap, relationFields, path)
    
    if (!values) return p;
    
    // Get the actual column definition for the field being aggregated
    let fieldCol: SpaceProperty = null;
    if (fieldValue.schema) {
      // Space-based aggregate
      const contextData = contextsMap.get(fieldValue.space || path.path);
      fieldCol = contextData?.mdb?.[fieldValue.schema]?.cols?.find(col => col.name === fieldValue.field);
    } else if (fieldValue.ref == '$items') {
      // Items aggregate
      fieldCol = contextsMap.get(_row[PathPropertyName])?.contextTable?.cols?.find(col => col.name === fieldValue.field);
    } else {
      // Reference-based aggregate
      const refField = fields.find(f => f.name == fieldValue.ref);
      if (refField) {
        const refFieldValue = parseFieldValue(refField.value, refField.type);
        const spacePath = refFieldValue?.space;
        if (spacePath) {
          fieldCol = contextsMap.get(spacePath)?.contextTable?.cols?.find(col => col.name === fieldValue.field);
        }
      }
    }

    
    if (!fieldCol) {
      // If we can't find the column definition, create a basic one
      fieldCol = { name: fieldValue.field, type: 'text' } as SpaceProperty;
    }
    
    const value = calculateAggregate(
      settings,
      values,
      fieldValue.fn,
      fieldCol
    );
        
    return {
      ...p, [c.name]: value
    };
  }, {});

  
  const flexFields : DBRow = fields.filter(f => f.type == 'flex').reduce((p, c) => {
    const flexValue = parseFlexValue(_row[c.name]);
    let value = flexValue.value;
    const config = flexValue.config;
    const type = flexValue.type;
    if (type == 'fileprop') {
      value = runFormulaWithContext(runContext, paths, spaceMap, config?.value, properties, {..._row, ...p}, path);
    }
    if (type == 'aggregate') {
      const fieldValue = config;
      // Resolve space path if it exists
      if (fieldValue.space) {
        fieldValue.space = resolvePath(fieldValue.space, path.path, (spacePath) => paths.get(spacePath)?.type == 'space');
      }
      const values = rowsForAggregate(fieldValue, fields, spaceMap, _row, contextsMap, relationFields, path)
      if (!values) return p;
      
      // Get the actual column definition for the field being aggregated
      let fieldCol: SpaceProperty = null;
      if (fieldValue.schema) {
        // Space-based aggregate
        const contextData = contextsMap.get(fieldValue.space || path.path);
        fieldCol = contextData?.mdb?.[fieldValue.schema]?.cols?.find(col => col.name === fieldValue.field);
      } else if (fieldValue.ref == '$items') {
        // Items aggregate
        fieldCol = contextsMap.get(_row[PathPropertyName])?.contextTable?.cols?.find(col => col.name === fieldValue.field);
      } else {
        // Reference-based aggregate
        const refField = fields.find(f => f.name == fieldValue.ref);
        if (refField) {
          const refFieldValue = parseFieldValue(refField.value, refField.type);
          const spacePath = refFieldValue?.space;
          if (spacePath) {
            fieldCol = contextsMap.get(spacePath)?.contextTable?.cols?.find(col => col.name === fieldValue.field);
          }
        }
      }
      
      if (!fieldCol) {
        // If we can't find the column definition, create a basic one
        fieldCol = { name: fieldValue.field, type: 'text' } as SpaceProperty;
      }
      
      value = calculateAggregate(
        settings,
        values,
        config?.fn,
        fieldCol
      );
    }
    return {
      ...p,
      [c.name]: JSON.stringify({
        type: type,
        value: value,
        config: config,
      }),
    };
  }, {})
  const formulaFields = result.map(f => fields.find(g => g.name == f) as SpaceProperty).filter((f) => f && (f.type == "fileprop")).reduce((p, c) => {
    
    const { value } = parseFieldValue(c.value, c.type);
    return {...p, [c.name]: runFormulaWithContext(runContext, paths, spaceMap, value, properties, {..._row,
    
    ...filteredFrontmatter,
    ...tagData,

    ...relationFields,
    ...aggregateFields,
    ...flexFields, ...p}, path, true)};
    
  }, {});
  return {
    ..._row,
    
    ...filteredFrontmatter,
    ...tagData,
    ...formulaFields,
    ...relationFields,
    ...aggregateFields,
    ...flexFields,
  };
};

const rowsForAggregate = (fieldValue: Record<string, any>, fields: SpaceProperty[], spaceMap: IndexMap, _row: Record<string, string>, contextsMap: Map<string, ContextState>, relationFields: Record<string, string>, pathState: PathState) => {
  let rows = [];
    const column = fieldValue?.field;
    
    // Handle space-based aggregates
    if (fieldValue.space && fieldValue.schema) {
        const contextData = contextsMap.get(fieldValue.space);
        rows = contextData?.mdb?.[fieldValue.schema]?.rows ?? [];
    } else if (fieldValue.schema) {
        rows = (contextsMap.get(pathState.path)?.mdb[fieldValue.schema]?.rows ?? []);
    } else if (fieldValue?.ref == '$items') {
      rows = (contextsMap.get(_row[PathPropertyName])?.contextTable?.rows ?? []);
    } else {
      const refField = fields.find(f => f.name == fieldValue?.ref);
      if (!refField) 
        return null;
      const refFieldValue = parseFieldValue(refField.value, refField.type);
      const spacePath = refFieldValue?.space;
      
      
      if (!spacePath || !column) {
        return null;
      }
      
      const propValues = parseMultiString(relationFields[refField.name]);
      
      rows = propValues
      .map((f) => (contextsMap.get(spacePath)?.contextTable?.rows ?? []).find(g => g[PathPropertyName] == f))
    }

    // Apply filters if they exist
    if (fieldValue.filters && fieldValue.filters.length > 0) {
      const cols = fieldValue.schema 
        ? contextsMap.get(fieldValue.space || pathState.path)?.mdb?.[fieldValue.schema]?.cols
        : fieldValue.ref == '$items' 
          ? contextsMap.get(_row[PathPropertyName])?.contextTable?.cols
          : (() => {
              const refField = fields.find(f => f.name == fieldValue?.ref);
              if (!refField) return [];
              const refFieldValue = parseFieldValue(refField.value, refField.type);
              return contextsMap.get(refFieldValue?.space)?.contextTable?.cols;
            })();
      
      if (cols) {
        rows = filterRowsByGroups(rows, fieldValue.filters, cols, {});
      }
      
    }

    return rows.map((f) => f?.[column] ?? '')
}

// Helper function to filter rows by filter groups
const filterRowsByGroups = (rows: DBRow[], filterGroups: FilterGroupDef[], cols: SpaceProperty[], properties: Record<string, any>) => {
  
  return rows.filter(row => {
    return filterGroups.every((group) => {
      const filters = group.filters || [];
      
      if (group.type === 'any') {
        // OR logic - at least one filter must pass
        return filters.length === 0 || filters.some((filter) => {
          const col = cols.find(c => c.name === filter.field);
          return col ? filterReturnForCol(col, filter, row, properties) : true;
        });
      } else {
        // AND logic - all filters must pass
        return filters.every((filter) => {
          const col = cols.find(c => c.name === filter.field);
          return col ? filterReturnForCol(col, filter, row, properties) : true;
        });
      }
    });
  });
}