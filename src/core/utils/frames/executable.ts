import * as acorn from "acorn";
import { FrameExecutable, FrameTreeNode } from "shared/types/frameExec";
import { applyFunctionToObject } from "../objects";
import { objectIsConst, stringIsConst } from "./frames";

const generateCodeForProp = (value: any, isClosure: boolean, type?: string) => {
    const codeBlock = isClosure ? `($event, $value, $state, $saveState, $api) => { ${value} }` : value;
    const isMultiLine = (typeof codeBlock === 'string' || codeBlock instanceof String) ? codeBlock.includes('\n') : false;
    const isObject = type?.startsWith('object') && objectIsConst(value, type)
    
    let func
    try {
    func = isMultiLine && !(isClosure) && !codeBlock.startsWith('(') && !isObject
    ? new Function(`with(this) { ${codeBlock} }`)
    : new Function(`with(this) { return ${codeBlock}; }`);
    
    } catch (e) {
    }
    return func;
  }

  export const buildExecutable = (root: FrameTreeNode) => {
    const treeNode : FrameExecutable = {...root, execActions: {}, execProps: {}, execStyles: {}, execPropsOptions: {}};
    const {sortedKeys, dependencies} = sortKeysByDependencies(treeNode.node.props, `${treeNode.id}.props`);
    const {sortedKeys: _, dependencies: styleDependencies} = sortKeysByDependencies(treeNode.node.styles, `${treeNode.id}.styles`);
    treeNode.execPropsOptions.props = sortedKeys.map(f => {
        return {
            name: f,
            isConst: stringIsConst(treeNode.node.props[f]),
            deps: dependencies.get(f) || []
        }
    });
    

    treeNode.execProps = applyFunctionToObject(treeNode.node.props, (e, k) => generateCodeForProp(e, false, treeNode.node.types?.[k]));
    treeNode.execStyles = applyFunctionToObject(treeNode.node.styles, (e) => generateCodeForProp(e, false));
    treeNode.execActions = applyFunctionToObject(treeNode.node.actions, (e) => generateCodeForProp(e, true));
    treeNode.children = treeNode.children.map((child) => 
      buildExecutable(child)
    );
    treeNode.execPropsOptions.children = [...(treeNode.children as FrameExecutable[]).flatMap(f => f.execPropsOptions.children), ...treeNode.children.map(f => f.id)]
    
    const nodeDependencies = [...(treeNode.children as FrameExecutable[]).flatMap(f => f.execPropsOptions.deps), 
    ...treeNode.execPropsOptions.props.flatMap(f => f.deps),  
    ...[...styleDependencies.values()].flat()]
    
    treeNode.execPropsOptions.deps = nodeDependencies.filter(f => f[0] != treeNode.id)
    
    if (treeNode.node.type == 'list') {
        treeNode.execPropsOptions.template = treeNode.children;
    }
    return treeNode;
}
function extractDependencies(code: string): string[][] {
    

    const dependencies: string[][] = [];

    function visit(node: any, parts: string[] = []): string[] | null {
        if (node.type === 'Identifier') {
            parts.push(node.name);
            return parts;
        } else if (node.type === 'MemberExpression') {
            const objectParts = visit(node.object, parts);
            if (objectParts && node.computed) {
                if (node.property.type === 'Literal') {
                    objectParts.push(String(node.property.value));
                    return objectParts;
                } else if (node.property.type === 'Identifier') {
                    // For computed properties like obj[var], we add the identifier to the parts.
                    objectParts.push(node.property.name);
                    return objectParts;
                } else if (node.property.type === 'MemberExpression'){
                    explore(node.property)
                    return objectParts;
                } else {
                    // For computed properties like obj[var], we ignore it.
                    return null;
                }
            } else if (objectParts) {
                return visit(node.property, objectParts);
            }
        } else if (node.type === 'Literal') {
            parts.push(String(node.value));
            return parts;
        } else if (node.type === 'ChainExpression' || node.type == 'ExpressionStatement') {
            explore(node.expression);
            return;
        } else if (node.type === 'CallExpression') {
            explore(node);
            return;
        }
        return null;
    }

    function explore(node: any) {
        if (node.type === 'MemberExpression') {
            const parts = visit(node);
            if (parts) {
                dependencies.push(parts);
            }
            return;
        }
        for (const key in node) {
            
            if (typeof node[key] === 'object' && node[key] !== null) {
                explore(node[key]);
            } else if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                    if (typeof item === 'object' && item !== null) {
                        explore(item);
                    }
                }
            }
        }
    }
try {
    const ast = acorn.parse(code.replace("return ", ""), { ecmaVersion: 2020 }) as any;
    explore(ast);
} catch (e) {
    return []
}
    

    return dependencies;
}


function sortKeysByDependencies(
    codeBlockStore: Record<string, string>,
    identifier: string
): { sortedKeys: string[], dependencies: Map<string, string[][]> } {
    const graph: Map<string, Set<string>> = new Map();
    const dependencies: Map<string, string[][]> = new Map();
    const allDependencies: Map<string, string[][]> = new Map();

    // Build the graph and the dependencies map
    for (const key in codeBlockStore) {
        const code = codeBlockStore[key];
        
        const extractedDependencies = extractDependencies(code)
        const localDependencies = extractedDependencies.filter(dep => {
            return dep.slice(0, -1).join('.') === identifier
        });

        dependencies.set(key, localDependencies);
        allDependencies.set(key, extractedDependencies);

        if (!graph.has(key)) {
            graph.set(key, new Set());
        }
        for (const dep of localDependencies) {
            const depStr = dep[dep.length - 1]; // Using the last part as the key
            if (depStr === key) continue; // Skip self dependencies

            // Add an edge from key to the dependency
            graph.get(key)!.add(depStr);
        }
    }
    
    // Perform a topological sort
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

    for (const key in codeBlockStore) {
        if (!visited.has(key)) {
            visit(key);
        }
    }
    return { sortedKeys: result, dependencies: allDependencies };
}