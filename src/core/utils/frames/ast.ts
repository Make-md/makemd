import { Superstate } from "core/superstate/superstate";
import { applyFunctionToObject } from "core/utils/objects";
import { wrapQuotes } from "core/utils/strings";
import { SpaceProperty } from "types/mdb";
import { FrameDragMode, FrameDropMode, FrameEditorProps, FrameNode, FrameResizeMode, FrameRoot, FrameSchema, FrameTreeNode, FrameTreeProp, MDBFrame, defaultFrameEditorProps } from "types/mframe";
import { linkNodes } from "./linker";
import { frameToNode, mdbSchemaToFrameSchema } from "./nodes";

const calculateEditorProps = (props: FrameEditorProps, treeNode: FrameTreeNode) : FrameEditorProps => {
  if (props.editMode == 0 || !props.rootId) return props;
  if (treeNode.node.id == props.rootId) return props;
  if (treeNode.isRef) return {...props, dropMode: 0, dragMode: 0, resizeMode: 0, selectMode: 0};

  if (props.editMode == 3) {
    return {
    ...props,
    resizeMode: FrameResizeMode.ResizeSelected,
    dragMode: FrameDragMode.DragSelected
    }
  }
  const firstLevelNode = treeNode.node.parentId == props.rootId;
  const columnChild = treeNode.editorProps.parentType == "column"
  const isColumn = treeNode.node.type == "column"
  const resizeMode =
    treeNode.node.type == "image" ||
    isColumn ? FrameResizeMode.ResizeAlways : FrameResizeMode.ResizeNever;
    
  const dragMode =
    ((firstLevelNode &&
      treeNode.node.type != "container") ||
      columnChild && !isColumn) || isColumn && treeNode.children.length == 0 ? FrameDragMode.DragHandle : FrameDragMode.DragNever;
    
  const dropMode = isColumn
        ? FrameDropMode.DropModeColumnOnly : columnChild ? FrameDropMode.DropModeRowOnly : firstLevelNode ? FrameDropMode.DropModeRowColumn : 0
    return {
      ...props,
      dragMode,
      resizeMode,
      dropMode
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
export const getFrameNodesByPath = (
    superstate: Superstate,
    ref: string
  ): MDBFrame => {
    const path = superstate.spaceManager.uriByString(ref)
    if (!path) return;
    if (path.authority == '$kit') {

      return superstate.kit.find(f => f.schema.id == path.ref)
    }
    const context = superstate.framesIndex.get(path.basePath);
    return context?.frames[path.ref];
  };

  export function flattenToFrameNodes(root: FrameTreeNode | FrameRoot): FrameNode[] {
    const flattenedTree: FrameNode[] = [];

    function traverseAndFlatten(node: FrameTreeNode | FrameRoot, parent: string): void {
      flattenedTree.push({...node.node, parentId: parent, schemaId: root.node.schemaId});
      (node.children ?? []).forEach((child) => {
        traverseAndFlatten(child, node.node.id);
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

  const expandNode = (treeNode: FrameTreeNode,id: number, superstate: Superstate) : [FrameTreeNode, number] => {

    if (treeNode.node.type == "frame") {
      
      const mdbFrame = getFrameNodesByPath(superstate, treeNode.node.ref);
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
      const [newTreeNode, newID] =  buildFrameTree(linkedNode.node,
        linkedNodes
      , superstate, newUniqueID, true, treeNode.editorProps);


      if (!newTreeNode) {
        return [linkedNode, newID];
      }
      return [insertFrameChildren({...newTreeNode, isRef: false, node: {...newTreeNode.node, schemaId: linkedNode.node.schemaId, ref: linkedNode.node.ref, types: linkedNode.node.types, propsAttrs: linkedNode.node.propsAttrs, propsValue: linkedNode.node.propsValue, parentId:linkedNode.node.parentId, type: 'frame', id: newTreeNode.id}}, treeNode.children), newID];
    }
    
    return [treeNode, id];
  }
  const expandFrame = (
    node: FrameTreeNode,
    superstate: Superstate, uniqueID = 0, editorProps: FrameEditorProps
  ): [FrameTreeNode, number] => {

  const [children, lastID] = node.children.reduce<[FrameTreeNode[], number]>((f, c) => {

    const [nodes, id] = f;

    const _editorProps = calculateEditorProps({...editorProps, parentType: node.node.type}, c)

    const [newNode, fid]= expandFrame(c, superstate, id+1, _editorProps)
    return [[...nodes, newNode], fid+1]
  }, [[], uniqueID])
  const [newNode, newID] = expandNode({...node, children, editorProps}, lastID, superstate);

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

export const applyPropsToRoot = (root: FrameTreeNode, props: FrameTreeProp) => ({
  ...root,
  node: {
    ...root.node,
    props: {
      ...root.node.props,
      ...applyFunctionToObject(props, (e) => wrapQuotes(e)),
    },
  },
})
 
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
  
  export const buildRootFromMDBFrame = (superstate: Superstate, frame: MDBFrame, editorProps=defaultFrameEditorProps) => {
    return buildRoot(mdbSchemaToFrameSchema(frame.schema), frame.cols, frame.rows.map(f => frameToNode(f)), superstate, editorProps)
  }

  export const buildRoot = (
    schema: FrameSchema,
    fields: SpaceProperty[],
    nodes: FrameNode[],
    superstate: Superstate,
    editorProps=defaultFrameEditorProps
  ): FrameTreeNode => {
    const rootNode = nodes.find(f => f.id == schema.id) ?? schemaToRoot(schema);
    const root = buildFrameTree(rootNode, nodes, superstate, nodes.length, false, {...editorProps, rootId: schema.id})[0];

     return root && linkProps(fields, root);
  }

  export const propertiesForNode = (node: FrameNode) => 
    Object.keys(node.types).map((f) => ({
      type: node.types[f],
      name: f,
      schemaId: f,
      value: node.propsValue?.[f],
      attrs: node.propsAttrs?.[f]
    }))
  
  
  export const buildFrameTree = (root: FrameNode, nodes: FrameNode[], superstate: Superstate, uniqueID = 0, isRef: boolean, editorProps=defaultFrameEditorProps): [FrameTreeNode, number] => {
    const rootNode: FrameTreeNode = {node: root, id: root.id, children: [], isRef, editorProps};

    const idToNodeMap: { [key: string]: FrameTreeNode } = {[root.id]: rootNode};
    

    // Create TreeNode objects for each FlattenedTreeNode and build an id-to-node map
    nodes.forEach((node) => {
      idToNodeMap[node.id] = { id: node.id,  node, children: [], isRef, editorProps};
    });
    // Assign children to their respective parent TreeNode
    nodes.forEach((node) => {

      if (node.parentId) {
        const parentNode = idToNodeMap[node.parentId];
        if (parentNode) {
          parentNode.children.push({...idToNodeMap[node.id], editorProps: {...editorProps, parentType: parentNode.node.type}});
          parentNode.children.sort((a, b) => a.node.rank - b.node.rank);
        }
      } else {
        if (node.id == root.id)
        rootNode.node = idToNodeMap[node.id].node
      }

    })

    const [treeNode, newID] = expandFrame(idToNodeMap[root.id], superstate, uniqueID, editorProps);
    return [treeNode, newID];
  };

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