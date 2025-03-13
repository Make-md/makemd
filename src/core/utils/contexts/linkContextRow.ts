import { parseFieldValue } from "core/schemas/parseFieldValue";
import { ConstantNode, FunctionNode, parse } from "mathjs";
import { PathPropertyName } from "shared/types/context";
import { IndexMap } from "shared/types/indexMap";
import { DBRow, DBRows, SpaceProperty } from "shared/types/mdb";
import { ContextState, PathState } from "shared/types/PathState";
import { MakeMDSettings } from "shared/types/settings";
import { uniq } from "shared/utils/array";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty } from "../../../utils/parsers";
import { runFormulaWithContext } from "../formula/parser";
import { calculateAggregate } from "./predicate/aggregates";



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
  fields.filter((f) => f.type == "fileprop" || f.name.startsWith('tags')).forEach((f) => {
    const { value } = parseFieldValue(f.value, f.type);
    const localDependencies = []
  try {
    const deps = parse(value).filter((f) => f.type == 'FunctionNode').filter(f => (f as FunctionNode).fn.name == 'prop' && (f as FunctionNode).args[0].type == 'ConstantNode').map(f => ((f as FunctionNode).args[0] as ConstantNode)?.value as unknown as string)
    localDependencies.push(...deps)
  }
  catch (e) {
    // console.log(e)
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
  row: DBRow,
  fields: SpaceProperty[],
  path: PathState,
  settings: MakeMDSettings,
  dependencies?: string[]
) => {
  if (!row) return {}
  
  const result = dependencies ?? propertyDependencies(fields)
  const frontmatter = (paths.get(row[PathPropertyName])?.metadata?.property ?? {});
  const filteredFrontmatter = Object.keys(frontmatter).filter(f => fields.some(g => g.name == f) && f != PathPropertyName).reduce((p, c) => ({ ...p, [c]: parseProperty(c, frontmatter[c]) }), {})
  const properties = fields.reduce((p, c) => ({ ...p, [c.name]: c }), {})
  const formulaFields = result.map(f => fields.find(g => g.name == f) as SpaceProperty).filter((f) => f && (f.type == "fileprop")).reduce((p, c) => {
    if (c.name == 'tags') {
      return { ...p, 'tags': serializeMultiString([...(paths.get(row[PathPropertyName]).tags ?? [])]) };
    }
    
    const { value } = parseFieldValue(c.value, c.type);
    return {...p, [c.name]: runFormulaWithContext(runContext, paths, spaceMap, value, properties, {...row, ...p}, path)};
    
  }, {});
  const relationFields = fields.filter((f) => f && (f.type.startsWith('context'))).reduce((p, c) => {
    
    const fieldValue = parseFieldValue(c.value, c.type);
    const multi = c.type.endsWith('multi');
    const value = multi ? parseMultiString(row[c.name]) : row[c.name]?.length > 0 ? [row[c.name]] : [];
    if (!fieldValue.space) {
          return p;
        }
        const items = contextsMap.get(fieldValue.space)?.contextTable?.rows ?? []
        const values = items.reduce((p, c) => {
            if (fieldValue.field, parseMultiString(c[fieldValue.field]).includes(row[PathPropertyName])) {
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
    const refField = fields.find(f => f.name == fieldValue?.ref);
    if (!refField) 
      return p;
    const refFieldValue = parseFieldValue(refField.value, refField.type);
    const spacePath = refFieldValue?.space;
    const column = fieldValue?.field;
    
    if (!spacePath || !column) {
      return p;
    }
    
    const propValues = parseMultiString(relationFields[refField.name]);
    
    const values = propValues
    .map((f) => (contextsMap.get(spacePath)?.contextTable?.rows ?? []).find(g => g[PathPropertyName] == f))
    .map((f) => f?.[column]).filter((f) => f)
        const value = calculateAggregate(
          settings,
          values,
          fieldValue.fn,
          column
        );
    return {
      ...p, [c.name]: value
    };
  }, {});
  return {
    ...row,
    ...filteredFrontmatter,
    ...formulaFields,
    ...relationFields,
    ...aggregateFields,
      
  };
};
