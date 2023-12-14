
import * as acorn from 'acorn';
import { API } from 'core/superstate/api';
import { wrapQuotes } from 'core/utils/strings';
import { FrameNode, FrameRunInstance, FrameState, FrameStateKeys, FrameTreeNode } from 'types/mframe';
import { parseMultiString } from "../../../utils/parsers";
import { linkTreeNodes } from './linker';

type ResultStore = { state: FrameState, newState: FrameState };

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


export const executeTreeNode = async (_treeNode: FrameTreeNode,  state: FrameState, api: API, saveState: (state: FrameState, instance: FrameRunInstance) => void, root: FrameTreeNode, runID: string, newState?: FrameState) : Promise<FrameRunInstance> => {
    const treeNode = _treeNode;

    let execState = await executeNode(treeNode.node, {state, newState}, api);
    if (treeNode.node.type == 'list') {
        let uid = 0;
        
        treeNode.children = parseMultiString(execState.state[treeNode.id].props.value).flatMap((f, i) => treeNode.children.map(n => {
            const [tree, m] = linkTreeNodes({ ...n, node: { ...n.node, props: {...n.node.props, value: wrapQuotes(f)}}}, uid)
            uid = m;
            return tree}))
    }
    
    if (
        typeof execState.state[treeNode.id]?.actions?.onRun == "function"
      ) {
        
        execState.state[treeNode.id].actions?.onRun(
          execState,
          (s: FrameState) => {
            saveState(s, { state: execState.state, root, id: runID})
        }
            ,
          api
        );
      }
    for (let i = 0; i < treeNode.children.length; i++) {
        const [newState, newNode] : [ResultStore, FrameTreeNode] = await executeTreeNode(treeNode.children[i], execState.state, api, saveState, root, runID, execState.newState).then(f => [{state: f.state, newState: f.newState}, f.root])
        execState = newState;
        treeNode.children[i] = newNode;
    }
    return {id: runID, root: treeNode, state: execState.state, newState: execState.newState}
}



export const executeNode = async (node: FrameNode, results: ResultStore, api: API) => {
    const propResults = await executePropsCodeBlocks(node, results, api)

    const stylesResults = executeCodeBlocks(node, 'styles', propResults)
    const actions = executeCodeBlocks(node,'actions',  stylesResults)
    return actions;
}


const executePropsCodeBlocks = async (node: FrameNode, results: ResultStore, api: API): Promise<ResultStore> => {
    const {type, props, id} = node
    const codeBlockStore = props ?? {}
    // Sort keys based on dependencies.
    const {sortedKeys, dependencies} = sortKeysByDependencies(codeBlockStore, `${node.id}.props`);
    const runKeys = results.newState ? sortedKeys.filter(f => { 
    const deps = dependencies.get(f);

    if (f in (results.newState?.[node.id]?.['props'] ?? {})) {
        return true;
    }
    for (const dep of deps) {
        if (dep[0] == 'api')
            return true;
        if (results.newState?.[dep[0]]?.[dep[1] as FrameStateKeys]?.[dep[2]]) {
            
            return true;
        }
    }
    return false
}) : sortedKeys.filter(f => codeBlockStore[f]?.length > 0)
    // Prepare an environment for executing code blocks.
    const environment = results.state;
    environment[id] = {
        props: results.state[id]?.props ?? {},
        actions: results.state[id]?.actions ?? {},
        styles: results.state[id]?.styles ?? {},
        contexts: results.state[id]?.contexts ?? {},
    }
    environment.api = api
    for (const key of runKeys) {
        // Execute the code block.
        try {
            let result;
            if (key in (results.newState?.[node.id]?.['props'] || {})) {
                result = results.newState[node.id]['props'][key]
            } else {
        const isMultiLine = codeBlockStore[key].includes('\n');
        
            // Execute the code block.
            const func = isMultiLine
                ? new Function(`with(this) { ${codeBlockStore[key]} }`)
                : new Function(`with(this) { return ${codeBlockStore[key]}; }`);
            result = func.call(environment);
            if (result instanceof Promise) {
                result = await result;
            }
        // if (key == 'value' && type == 'text') {
        //     result = await markdownToHtml(result)
        // }
    }
        // Store the result.
            environment[id]['props'][key] = result;
            results.state[id]['props'][key] = result;
            if (results.newState) {
                results.newState[id] = results.newState[id] ?? {props: {}, styles: {}, actions: {}, contexts: {}}
                results.newState[id]['props'][key] = result;
            }
        } catch (error) {
            console.log(error)
        }
    }

    return results;
}

function executeCodeBlocks(node: FrameNode, type: 'actions' | 'styles', results: ResultStore): ResultStore {
    // Sort keys based on dependencies.
    const codeBlockStore = node[type] ?? {}
    // results.state[node.id][type] = codeBlockStore
    // Prepare an environment for executing code blocks.

    for (const key of Object.keys(codeBlockStore)) {
        // Execute the code block.
        try {
            const isMultiLine = (typeof codeBlockStore[key] === 'string' || codeBlockStore[key] instanceof String) ? codeBlockStore[key].includes('\n') : false;
            // Execute the code block.
            
            const func = isMultiLine && !(type == 'actions')
                ? new Function(`with(this) { ${codeBlockStore[key]} }`)
                : new Function(`with(this) { return ${codeBlockStore[key]}; }`);
                const result = func.call(results.state);
        // Store the result.

        results.state[node.id][type][key] = result;
        } catch (error) {
            console.log(error)
        }
    }

    return results;
}

