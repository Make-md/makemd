import _ from "lodash";
import { Superstate } from "makemd-core";
import { rootToFrame } from "schemas/frames";
import { FrameDragMode, FrameDropMode, FrameEditorMode, FrameEditorProps, FrameExecutable, FrameResizeMode, FrameState, FrameTreeNode, defaultFrameEditorProps } from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { FrameNode, FrameRoot, FrameSchema, FrameTreeProp, MDBFrame } from "shared/types/mframe";
import { ScreenType } from "shared/types/ui";
import { uniqueNameFromString } from "shared/utils/array";
import { mdbSchemaToFrameSchema } from "../../../shared/utils/makemd/schema";
import { removeQuotes } from "../strings";
import { buildExecutable } from "./executable";
import { parseLinkedNode } from "./frame";
import { linkNodes } from "./linker";
import { frameToNode } from "./nodes";

const calculateEditorProps = (props: FrameEditorProps, treeNode: FrameTreeNode) : FrameEditorProps => {

  if (props.editMode == 0 || !props.rootId) return props;
  if (treeNode.node.id == props.rootId) return props;
  if (treeNode.isRef) return {...props, dropMode: 0, dragMode: 0, resizeMode: 0, selectMode: 0, linkedNode: parseLinkedNode(treeNode.node.props?.value)};

  if (props.editMode == FrameEditorMode.Group) {
    return {
    ...props,
    resizeMode: FrameResizeMode.ResizeSelected,
    dragMode: FrameDragMode.DragSelected,
    dropMode: treeNode.editorProps.parentType == 'group' ? removeQuotes(treeNode.parent.node.styles?.layout) == ('row') ? 
    FrameDropMode.DropModeColumnOnly : FrameDropMode.DropModeRowOnly : FrameDropMode.DropModeRowColumn
    }
  }

  const firstLevelNode = treeNode.node.parentId == props.rootId;
  const columnChild = treeNode.editorProps.parentType == "column"
  const isColumn = treeNode.node.type == "column"
  const resizeMode = isColumn && treeNode.editorProps.parentLastChildID != treeNode.id ? FrameResizeMode.ResizeColumn : FrameResizeMode.ResizeSelected;
    
  const dragMode =
    ((firstLevelNode &&
      treeNode.node.type != "container") ||
      columnChild && !isColumn) || isColumn && treeNode.children.length == 0 ? FrameDragMode.DragHandle : FrameDragMode.DragSelected;
    
  const dropMode = props.screenType == ScreenType.Phone ? FrameDropMode.DropModeRowOnly : isColumn
        ? FrameDropMode.DropModeColumnOnly : 
        columnChild ? FrameDropMode.DropModeRowOnly : 
        firstLevelNode ? FrameDropMode.DropModeRowColumn : 
        treeNode.editorProps.parentType == 'group' ? removeQuotes(treeNode.parent.node.styles?.layout) == ('column') ? 
        FrameDropMode.DropModeColumnOnly : FrameDropMode.DropModeRowOnly : 0

    
    return {
      ...props,
      dragMode,
      resizeMode,
      dropMode,
      linkedNode: parseLinkedNode(treeNode.node.props?.value)
    }
}

export function replaceSubtree(tree: FrameTreeNode, subtree: FrameTreeNode): FrameTreeNode {
  if (tree.id === subtree.id) {
    return subtree;
  }

  if (tree.children) {
    for (let i = 0; i < tree.children.length; i++) {
      const replacedChild = replaceSubtree(tree.children[i], subtree);
      if (replacedChild !== tree.children[i]) {
        // If the child was replaced, update the current node's children
        tree.children[i] = replacedChild;
      }
    }
  }

  return tree;
}
const getFrameNodesByPath = async (
    superstate: Superstate,
    ref: string
  ): Promise<MDBFrame> => {
    const path = superstate.spaceManager.uriByString(ref)
    if (!path) return;
    if (path.authority == '$kit') {
      const kit = superstate.kit.find(f => f.def.id == path.ref)
      if (!kit) return;
      return rootToFrame(kit)
    }
    const context = await superstate.spaceManager.readFrame(path.basePath, path.ref);
    return context as MDBFrame;
  };

  export function flattenToFrameNodes(root: FrameTreeNode | FrameRoot, schemaId: string): FrameNode[] {
    //This function is an example of how javascript makes bad (non pure functions) patterns easy and more efficient :(:(:(
    const flattenedTree: FrameNode[] = [];
    const ids: string[] = [];
    function traverseAndFlatten(node: FrameTreeNode | FrameRoot, parent: string): void {
      const id = uniqueNameFromString(node.node.id, ids);
      ids.push(id);
      flattenedTree.push({...node.node, id: id, parentId: parent, schemaId: schemaId});
      (node.children ?? []).forEach((child) => {
        traverseAndFlatten(child, id);
      });
    }
    traverseAndFlatten(root, "");
    return flattenedTree;
  }

  export function insertFrameChildren(
    root: FrameTreeNode,
    newChildren: FrameTreeNode[]
  ): FrameTreeNode {
    function traverseAndInsert(node: FrameTreeNode): FrameTreeNode {
      return {
        ...node,
        children:
          node.node.type === "content" && newChildren.length > 0
            ? newChildren.map(f => ({...f,node: {...f.node, parentId: node.id}}))
            : node.children.map((child) => {
                return traverseAndInsert(child);
              }),
      };
    }
    const newRoot = traverseAndInsert(root);
    return newRoot;
  }

  const expandNode = async (treeNode: FrameTreeNode,id: number, superstate: Superstate) : Promise<[FrameTreeNode, number]> => {

    if (treeNode.node.type == "frame") {
      
      const mdbFrame = await getFrameNodesByPath(superstate, treeNode.node.ref);
      if (treeNode.node.schemaId == mdbFrame?.schema.id)
      return [treeNode, id];
      if (!mdbFrame || mdbFrame.rows.length == 0) {
        return [treeNode, id];
      }

      const linkedNode = linkProps(mdbFrame.cols, treeNode);
      const [linkedNodes, newUniqueID] = linkNodes(
        linkedNode.node,
        mdbFrame.schema.id,
        linkedNode.node.props,
        mdbFrame.rows.map(f => frameToNode(f)),
        id
      );
      const [newTreeNode, newID] = await buildFrameTree(linkedNode.node,
        linkedNodes
      , superstate, newUniqueID, true, treeNode.editorProps);


      if (!newTreeNode) {
        return [linkedNode, newID];
      }
      return [insertFrameChildren({...newTreeNode, parent: linkedNode.parent, isRef: false, node: {...newTreeNode.node, schemaId: linkedNode.node.schemaId, ref: linkedNode.node.ref, types: linkedNode.node.types, propsAttrs: linkedNode.node.propsAttrs, propsValue: linkedNode.node.propsValue, parentId:linkedNode.node.parentId, type: linkedNode.node.type, id: newTreeNode.id}}, treeNode.children), newID];
    }
    
    return [treeNode, id];
  }
  const expandFrame = async (
    node: FrameTreeNode,
    superstate: Superstate, uniqueID = 0, editorProps: FrameEditorProps
  ): Promise<[FrameTreeNode, number]> => {
  const [children, lastID] = await node.children.reduce<Promise<[FrameTreeNode[], number]>>(async (f, c) => {

    const [nodes, id] = await f;

    const _editorProps = calculateEditorProps({...editorProps, parentType: node.node.type, parentLastChildID: node.children[node.children.length-1]?.id}, c)

    const [newNode, fid]= await expandFrame(c, superstate, id+1, _editorProps)
    return [[...nodes, newNode], fid+1]
  }, Promise.resolve([[], uniqueID]))
  const [newNode, newID] = await expandNode({...node, children, editorProps}, lastID, superstate);

  return [{
    ...newNode,
    editorProps: calculateEditorProps(newNode.editorProps, newNode),
  }, newID]
  };
  
const linkProps = (fields: SpaceProperty[], root: FrameTreeNode) : FrameTreeNode => {
  const props = fields.reduce((p, c) => ({...p, [c.name]: ""}),{});
  const types = fields.reduce((p, c) => ({...p, [c.name]: c.type}),{});
  const propsValue = fields.reduce((p, c) => ({...p, [c.name]: c.value}),{});
  const propsAttrs = fields.reduce((p, c) => ({...p, [c.name]: c.attrs}),{});
  return {...root, node: {
   ...root.node,
   props: {...props, ...root.node.props},
   types: {...types, ...root.node.types},
   propsValue: {...propsValue, ...root.node.propsValue},
   propsAttrs: {...propsAttrs, ...root.node.propsAttrs}
  }}
}

export const applyPropsToState = (state: FrameState, props: FrameTreeProp, rootID: string) => (_.cloneDeep({
  ...state,
  [rootID]: {
...(state[rootID] ?? {}),
    props: {
      ...props ?? {},
      ...state[rootID]?.props ?? {}
    },
  },
}))
 
  export const schemaToRoot = (schema: FrameSchema): FrameNode => {
    return {
      schemaId: schema.id,
      id: schema.id,
      type: "group",
      rank: 0,
      name: schema.id
    };
  };

  export const schemaToFrame = (schema: FrameSchema): FrameNode => {
    return {
      schemaId: schema.id,
      id: schema.id,
      type: "frame",
      rank: 0,
      name: schema.id
    };
  };
  
  

  export const buildRootFromMDBFrame = async (superstate: Superstate, frame: MDBFrame, editorProps=defaultFrameEditorProps) => {
    if (!frame)return null;
    return buildRoot(mdbSchemaToFrameSchema(frame.schema), frame.cols, frame.rows.map(f => frameToNode(f)), superstate, editorProps)
  }

  export const buildRoot = async (
    schema: FrameSchema,
    fields: SpaceProperty[],
    nodes: FrameNode[],
    superstate: Superstate,
    editorProps=defaultFrameEditorProps
  ): Promise<FrameExecutable> => {
    const rootNode = nodes.find(f => f.id == schema.id) ?? schemaToRoot(schema);
    const root = await buildFrameTree(rootNode, nodes, superstate, nodes.length, false, {...editorProps, rootId: schema.id}).then(f => f[0]);
     return root && buildExecutable(linkProps(fields, root));
  }

  

  export const propertiesForNode = (node: FrameNode) => 
    Object.keys(node.types).map((f) => ({
      type: node.types[f],
      name: f,
      schemaId: f,
      value: node.propsValue?.[f],
      attrs: node.propsAttrs?.[f]
    }))
  
  
  export const buildFrameTree = async (root: FrameNode, nodes: FrameNode[], superstate: Superstate, uniqueID = 0, isRef: boolean, editorProps=defaultFrameEditorProps, dontExpand?: boolean): Promise<[FrameTreeNode, number]> => {
    const rootNode: FrameTreeNode = {node: root, id: root.id, children: [], isRef, editorProps, parent: null};

    const idToNodeMap: { [key: string]: FrameTreeNode } = {[root.id]: rootNode};
    

    // Create TreeNode objects for each FlattenedTreeNode and build an id-to-node map
    nodes.forEach((node) => {
      idToNodeMap[node.id] = { id: node.id,  node, children: [], isRef, editorProps, parent: null};
    });
    // Assign children to their respective parent TreeNode
    nodes.forEach((node) => {

      if (node.parentId) {
        idToNodeMap[node.id].parent = idToNodeMap[node.parentId];
        const parentNode = idToNodeMap[node.parentId];
        if (parentNode) {
          parentNode.children.push({...idToNodeMap[node.id], editorProps: {...editorProps, parentType: parentNode.node.type, parentLastChildID: parentNode.children[parentNode.children.length-1]?.id}});
          parentNode.children.sort((a, b) => a.node.rank - b.node.rank);
        }
      } else {
        if (node.id == root.id)
        rootNode.node = idToNodeMap[node.id].node
      }

    })
if (dontExpand) {
  return [idToNodeMap[root.id], uniqueID];
}
    const [treeNode, newID] = await expandFrame(idToNodeMap[root.id], superstate, uniqueID, editorProps);
    return [treeNode, newID];
  };

  export const isAncestor = (tree: FrameTreeNode, targetId: string): boolean => {
    // Check if the current node has the target id among its children
    if (tree.parent) {
      if (tree.parent.id === targetId) {
        return true;
      } else {
        return isAncestor(tree.parent, targetId);
      }
    }
    return false;

  }

  export const findParent = (tree: FrameTreeNode, targetId: string, parentId: string = null): FrameTreeNode | null => {
    // Check if the current node has the target id among its children
    for (const child of tree.children) {
      if (child.id === targetId) {
        return tree;
      }
    }
    
    // Recursively check each child node
    for (const child of tree.children) {
      const foundParent = findParent(child, targetId, tree.id);
      if (foundParent) {
        return foundParent;
      }
    }
    
    // Return null if the parent is not found
    return null;
  }