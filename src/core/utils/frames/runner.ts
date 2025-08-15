
import { ensureArray } from 'core/utils/strings';
import { API } from 'makemd-core';
import { FrameContexts, FrameExecProp, FrameExecutable, FrameExecutableContext, FrameNodeState, FrameRunInstance, FrameState, StyleAst } from "shared/types/frameExec";
import { FrameNode, FrameTreeProp } from 'shared/types/mframe';
import { uniq } from 'shared/utils/array';
import { buildExecutable } from './executable';
import { linkTreeNodes } from './linker';

export type ResultStore = { state: FrameState, newState: FrameState, slides: FrameState, prevState: FrameState, styleAsts?: StyleAst[] };

const styleAstsForNode = (
  style: FrameTreeProp,
  styleAsts?: StyleAst[]
) : [FrameTreeProp, StyleAst[]] => {
  if (!styleAsts) {
    return null;
  }

  const newStyleAsts = [];
  newStyleAsts.push(...styleAsts);
  const matchedStyleAsts = styleAsts.filter(f => f.sem == style.sem);

  matchedStyleAsts.forEach(f => {
      f.children.forEach((c) => {
          newStyleAsts.push(c)
      });
  })
  

  // Collect base styles from matched StyleAsts
  const kitStyles: Record<string, any> = {
      ...matchedStyleAsts.reduce((acc, curr) => {
          return {
              ...acc,
              ...curr.styles
          };
      }
      , {}),
  }

  // When sem changes, we want the new StyleAst styles to replace the old ones
  // So we filter out style properties that exist in the kit from the node styles
  const kitStyleKeys = Object.keys(kitStyles);
  const nodeOnlyStyles = Object.entries(style).reduce((acc, [key, value]) => {
    // Keep the property only if it's not defined in the kit styles
    if (!kitStyleKeys.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as FrameTreeProp);
  
  // Fix background/backgroundColor conflicts
  // If node has 'background' or 'backgroundImage' (gradient) and kit has 'backgroundColor', remove backgroundColor from kit
  if ((nodeOnlyStyles.background || nodeOnlyStyles.backgroundImage) && 'backgroundColor' in kitStyles) {
    delete kitStyles.backgroundColor;
  }
  // Also check for hover states
  Object.keys(kitStyles).forEach(key => {
    if (key.startsWith('hover:backgroundColor') && (nodeOnlyStyles.background || nodeOnlyStyles.backgroundImage)) {
      // Convert hover:backgroundColor to hover:background to prevent conflicts
      kitStyles['hover:background'] = kitStyles[key];
      delete kitStyles[key];
    }
  });

  // Merge kit styles with filtered node styles
  // This ensures kit styles take precedence for properties they define
  const mergedStyles = {...kitStyles, ...nodeOnlyStyles};
  

  return [mergedStyles, newStyleAsts]
}


export const executeTreeNode = async (
    _treeNode: FrameExecutable,  
    store: ResultStore,
    executionContext: FrameExecutableContext
    ) : Promise<FrameRunInstance> => {

    const treeNode = _treeNode;
   
    if ((store.prevState[treeNode.id]) && treeNode.node.type != 'content')
    {
        let skipped = false;
        if (treeNode.node.type == 'slides' || treeNode.node.type == 'slide' || treeNode.node.type == 'delta') {
            skipped = false;
        } else {
            const childDepCheck = (treeNode.execPropsOptions.children ?? []).some(f => Object.keys(store.newState).includes(f));
            const sameProps = Object.keys(store.newState[treeNode.id]?.props ?? {}).every(f => store.newState[treeNode.id]?.props[f] == store.prevState[treeNode.id]?.props[f]);
                const sameStyles = Object.keys(store.newState[treeNode.id]?.styles ?? {}).every(f => store.newState[treeNode.id]?.styles[f] == store.prevState[treeNode.id]?.styles[f])
            const sameDepValues = treeNode.execPropsOptions.deps.every(f => {
                if (f[0] == "$api") return true;
                if (store.newState[f[0]]?.[f[1] as keyof FrameNodeState]?.[f[2]] === undefined) return true;
                return store.newState[f[0]]?.[f[1] as keyof FrameNodeState]?.[f[2]] === store.prevState[f[0]]?.[f[1] as keyof FrameNodeState]?.[f[2]]
            });
            if (sameProps && sameStyles && sameDepValues && !childDepCheck)
            {
                skipped = true
                
            }    
        }
        
        if (skipped)
        return {id: executionContext.runID, root: executionContext.root, exec: treeNode, state: store.state, slides: store.slides, newState: store.newState, prevState: store.prevState, contexts: executionContext.contexts, styleAst: executionContext.styleAst}
        
    }
    let execState = await executeNode(treeNode, store, executionContext.contexts, executionContext.api);
    
    if (executionContext.styleAst) {
        const style = execState.state[treeNode.id].styles
        if (!store.styleAsts) {
            store.styleAsts = executionContext.styleAst.children;
        }
        
        
        const computedStyles = styleAstsForNode(style, store.styleAsts);
        if (computedStyles) {
            const [newStyle, styleAsts] = computedStyles ?? [null, null];
            if (newStyle) {
                style.theme = newStyle;
            }
            store.styleAsts = styleAsts;
        }
        execState.state[treeNode.id].styles = style;
    }
    if (treeNode.node.type == 'list') {
        
        let uid = 0;
        treeNode.children = ensureArray(execState.state[treeNode.id].props.value).flatMap((f, i) => treeNode.execPropsOptions.template.map((n) => {
            const [tree, m] = linkTreeNodes({ ...n, node: { ...n.node, props: {...n.node.props, _index: `${i}`, value: `${treeNode.id}.props.value[${i}]`}}}, uid)
            uid = m;
            return buildExecutable(tree)}))
    }
    
    if (
        typeof execState.state[treeNode.id]?.actions?.onRun == "function"
      ) {
        
        execState.state[treeNode.id].actions?.onRun(
            null,
            null,
          execState,
          (s: FrameState) => {
            executionContext.saveState(s, { state: execState.state, slides: execState.slides, root: executionContext.root, exec: executionContext.exec, id: executionContext.runID, contexts: executionContext.contexts})
        }
            ,
          executionContext.api
        );
      }
      treeNode.children = [
        ...treeNode.children.filter((b) => b.node.type == 'slides'),
        ...treeNode.children.filter((b) => b.node.type != 'slides')
    ];
      
    for (let i = 0; i < treeNode.children.length; i++) {
        const [newState, newNode] : [ResultStore, FrameExecutable] = await executeTreeNode(treeNode.children[i], execState, executionContext).then(f => [{state: f.state, newState: f.newState, slides: f.slides, prevState: f.prevState}, f.exec])
        execState = newState;
        treeNode.children[i] = newNode;
        if (newNode.node.type == 'slides') {
            
            const prop = newState.state[newNode.id].props.value;
            const state = newState.state[newNode.node.parentId]?.props[prop];
            
            let currentSlide;
            if (executionContext.selectedSlide) {
                currentSlide = newNode.children.find(f => f.id == executionContext.selectedSlide)
            }
            if (state !== null && !currentSlide) {
                currentSlide = newNode.children.find(f => newState.state[f.id].props.value == state)
            }

            if (currentSlide) {
                currentSlide.children.forEach(f => {
                    if (!execState.newState[f.node.ref]) {
                        execState.newState[f.node.ref] = {props: {}, styles: {}, actions: {}}
                    }
                    if (f.node.ref == treeNode.id) {
                        execState.state[f.node.ref].props = {...execState.state[f.node.ref].props, ...execState.state[f.node.id].props}
                        execState.state[f.node.ref].styles = {...execState.state[f.node.ref].styles, ...execState.state[f.node.id].styles}
                        execState.state[f.node.ref].actions = {...execState.state[f.node.ref].actions, ...execState.state[f.node.id].actions}    
                    } else {
                    execState.newState[f.node.ref].props = {...execState.newState[f.node.ref].props, ...execState.state[f.node.id].props}
                    execState.newState[f.node.ref].styles = {...execState.newState[f.node.ref].styles, ...execState.state[f.node.id].styles}
                    execState.newState[f.node.ref].actions = {...execState.newState[f.node.ref].actions, ...execState.state[f.node.id].actions}
                }
                });
                
            }
        }
    }
    
    return {id: executionContext.runID, root: executionContext.root, exec: treeNode, state: execState.state, slides: execState.slides, newState: execState.newState, prevState: execState.prevState, contexts: executionContext.contexts, styleAst: executionContext.styleAst}
}



export const executeNode = async (executable: FrameExecutable, results: ResultStore, contexts: FrameContexts, api: API) => {
    const propResults = await executePropsCodeBlocks(executable, results, contexts, api)
    const stylesResults = executeCodeBlocks(executable.node, 'styles', executable.execStyles, propResults)
    const actions = executeCodeBlocks(executable.node,'actions', executable.execActions, stylesResults)
    return actions;
}
export const executeCode =  (code: any, environment: {[key: string]: any}) => {
    // let result;
    const isMultiLine = (typeof code === 'string' || code instanceof String) ? code.includes('\n') : false;
            // Execute the code block.
            const func = isMultiLine
                ? new Function(`with(this) { ${code} }`)
                : new Function(`with(this) { return ${code}; }`);
                return func.call(environment);
            // if (result instanceof Promise) {
            //     result = await result;
            // }
// return result;
}

const executePropsCodeBlocks = async (executable: FrameExecutable, results: ResultStore, contexts: FrameContexts, api: API): Promise<ResultStore> => {
    const { id} = executable.node
    const codeBlockStore = executable.execProps ?? {}
    // Sort keys based on dependencies.

    
    // Prepare an environment for executing code blocks.
    const environment = results.state;
    environment[id] = {
        props: results.state[id]?.props ?? {},
        actions: results.state[id]?.actions ?? {},
        styles: results.state[id]?.styles ?? {},
    }
    environment.$contexts = contexts,
    environment.$api = api
    for (const {name: key, isConst} of executable.execPropsOptions.props) {
        // Execute the code block.
        try {
            let result;
            if (key in (results.newState?.[id]?.['props'] || {}) && isConst) {
                result = results.newState[id]['props'][key]
            } else {
                result = codeBlockStore[key]?.call(environment);
            }
        // Store the result.
        if (result !== null) {
            environment[id]['props'][key] = result;
            results.state[id]['props'][key] = result;
            if (results.newState) {
                //update newstate so dependencies are updated
                results.newState[id] = results.newState[id] ?? {props: {}, styles: {}, actions: {}}
                results.newState[id]['props'][key] = result;
            }
        } else {
            delete environment[id]['props'][key]
            delete results.state[id]['props'][key]
            if (results.newState?.[id]) {
                delete results.newState[id]['props'][key];
            }
        }
            
        } catch (error) {
            console.log(key, error)
        }
    }

    return results;
}

function executeCodeBlocks(node: FrameNode, type: 'actions' | 'styles', codeBlockStore: FrameExecProp, results: ResultStore): ResultStore {
    // Sort keys based on dependencies.
    // results.state[node.id][type] = codeBlockStore
    // Prepare an environment for executing code blocks.
const { id } = node
    for (const key of uniq([...Object.keys(codeBlockStore), ...Object.keys(results.newState?.[id]?.[type] ?? {})])) {
        let result;
        // Execute the code block.
        try {
            if (key in (results.newState?.[id]?.[type] || {}) && results.newState[id][type][key] !== undefined) {
                result = results.newState[id][type][key];
            } else {
                try {
                    result = codeBlockStore[key]?.call(results.state);
                } catch (execError) {
                    throw execError;
                }
            }
            // Store the result.

            if (result !== null) {
                results.state[node.id][type][key] = result;
            } else {
                delete results.state[node.id][type][key];
            }
        } catch (error) {
        }
    }

    return results;
}

