import { parseFieldValue } from "core/schemas/parseFieldValue";
import { ConstantNode, FunctionNode, parse } from "mathjs";
import { PathPropertyName } from "shared/types/context";
import { IndexMap } from "shared/types/indexMap";
import { DBRow, DBRows, SpaceProperty } from "shared/types/mdb";
import { PathState } from "shared/types/PathState";
import { uniq } from "shared/utils/array";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty } from "../../../utils/parsers";
import { runFormulaWithContext } from "../formula/parser";



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
  spaceMap: IndexMap,
  row: DBRow,
  fields: SpaceProperty[],
  path: PathState,
  dependencies?: string[]
) => {
  if (!row) return {}
  
  const result = dependencies ?? propertyDependencies(fields)
  const frontmatter = (paths.get(row[PathPropertyName])?.metadata?.property ?? {});
  const filteredFrontmatter = Object.keys(frontmatter).filter(f => fields.some(g => g.name == f) && f != PathPropertyName).reduce((p, c) => ({ ...p, [c]: parseProperty(c, frontmatter[c]) }), {})
  const fieldsSorted = result.map(f => fields.find(g => g.name == f) as SpaceProperty).filter((f) => f && (f.type == "fileprop"))
const properties = fields.reduce((p, c) => ({ ...p, [c.name]: c }), {})
  return {
    ...row,
    ...filteredFrontmatter,
    ...fieldsSorted
      .reduce((p, c) => {
        // if (c.name == 'tags') {
        //   return { ...p, 'tags': serializeMultiString([...(superstate.tagsMap.get(row[PathPropertyName]) ?? [])]) };
        // }
        
        const { value } = parseFieldValue(c.value, c.type);
        return {...p, [c.name]: runFormulaWithContext(runContext, paths, spaceMap, value, properties, {...row, ...p}, path)};
        
      }, {}),
  };
};
