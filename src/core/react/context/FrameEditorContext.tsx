import { Box } from "@air/react-drag-to-select";
import { arrayMove } from "@dnd-kit/sortable";
import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import {
  applyPropsToRoot,
  buildFrameTree,
  buildRoot,
  findParent,
  flattenToFrameNodes,
  schemaToRoot,
} from "core/utils/frames/ast";
import { newUniqueNode } from "core/utils/frames/frames";
import { frameToNode, nodeToFrame } from "core/utils/frames/nodes";
import { executeTreeNode } from "core/utils/frames/runner";
import _, { uniqueId } from "lodash";
import React, {
  MutableRefObject,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { groupNode, groupableTypes } from "schemas/frames";
import { SpaceProperty, SpaceTable } from "types/mdb";
import {
  FrameEditorProps,
  FrameNode,
  FrameRunInstance,
  FrameState,
  FrameTreeNode,
  FrameTreeProp,
  MDBFrame,
  MFrame,
} from "types/mframe";
import { insert, insertMulti, uniqueNameFromString } from "utils/array";
import { sanitizeColumnName } from "utils/sanitizers";
import { FramesMDBContext } from "./FramesMDBContext";
import { SpaceContext } from "./SpaceContext";
type FramesEditorContextProps = {
  root: FrameTreeNode;
  runRoot: () => void;
  instance: FrameRunInstance;
  saveState: (state: FrameState, instance: FrameRunInstance) => void;
  fastSaveState: (state: FrameState) => void;
  nodes: FrameNode[];
  properties: SpaceProperty[];
  dragNode: string;
  setDragNode: (node: string) => void;
  hoverNode: string;
  setHoverNode: (node: string) => void;
  selectedNodes: FrameNode[];
  selectableNodeBounds: MutableRefObject<Record<string, Box>>;
  selectNodes: (rows: FrameNode[]) => void;
  saveProperty: (column: SpaceProperty, oldColumn?: SpaceProperty) => boolean;
  newProperty: (column: SpaceProperty) => boolean;
  delProperty: (column: SpaceProperty) => void;
  addNode: (treeNode: FrameNode, target?: FrameNode) => void;
  deleteNode: (treeNode: FrameNode) => void;
  renameNode: (treeNode: FrameNode, newName: string) => void;
  groupNodes: (treeNodes: FrameNode[], style?: FrameTreeProp) => void;
  ungroupNode: (treeNode: FrameNode) => void;
  saveNodes: (
    treeNodes: FrameNode[],
    deleteNodes?: FrameNode[]
  ) => Promise<void>;
  moveUp: (node: FrameNode) => void;
  moveDown: (node: FrameNode) => void;
  moveToRank: (node: FrameNode, rank: number) => void;
  moveNodeFromSchema: (
    nodeId: string,
    schemaId: string,
    newParentId: string,
    styles?: FrameTreeProp
  ) => Promise<void>;
};

export const FramesEditorContext = createContext<FramesEditorContextProps>({
  root: null,
  runRoot: () => null,
  instance: { state: {}, id: null, root: null },
  saveState: () => null,
  fastSaveState: () => null,
  nodes: [],
  properties: [],
  dragNode: null,
  setDragNode: () => null,
  hoverNode: null,
  selectableNodeBounds: null,
  setHoverNode: () => null,
  selectedNodes: [],
  selectNodes: () => null,
  saveProperty: () => false,
  newProperty: () => false,
  delProperty: () => null,
  groupNodes: () => null,
  ungroupNode: () => null,
  renameNode: () => null,
  addNode: () => null,
  deleteNode: () => null,
  saveNodes: () => null,
  moveUp: () => null,
  moveDown: () => null,
  moveToRank: () => null,
  moveNodeFromSchema: () => null,
});

export const FramesEditorProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    props?: FrameTreeProp;
    editMode: number;
  }>
> = (props) => {
  const { spaceInfo } = useContext(SpaceContext);
  const editorProps: FrameEditorProps = { editMode: props.editMode };
  const {
    frameSchema: frameSchema,
    setFrameSchema: setDBSchema,
    saveFrame,
    frameSchemas: schemas,
    tableData,
    getMDBData,
  } = useContext(FramesMDBContext);
  const [hoverNode, setHoverNode] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState<FrameNode[]>([]);
  const nodes = useMemo(() => {
    if (!frameSchema) return [];
    const frames =
      tableData?.rows.map((f) =>
        f.id == frameSchema.id
          ? {
              ...frameToNode(f as MFrame),
              types: tableData.cols.reduce(
                (p, c) => ({ ...p, [c.name]: c.type }),
                {}
              ),
              propsValue: tableData.cols.reduce(
                (p, c) => ({ ...p, [c.name]: c.value }),
                {}
              ),
            }
          : frameToNode(f as MFrame)
      ) ?? [];
    const _root = schemaToRoot(frameSchema);
    if (frames.some((f) => f.id == _root.id)) {
      return frames;
    }
    return [...frames, _root];
  }, [tableData, frameSchema]);
  const [root, setRoot] = useState<FrameTreeNode>(null);
  const [instance, setInstance] = useState<FrameRunInstance>({
    state: {},
    id: null,
    root: null,
  });
  const activeRunID = useRef(null);
  const saveState = (newState: FrameState, instance: FrameRunInstance) => {
    const { root: _root, id: runID, state } = instance;
    if (activeRunID.current != runID) return;
    executeTreeNode(
      applyPropsToRoot(_root, props.props),
      state,
      props.superstate.api,
      saveState,
      _root,
      runID,
      newState
    ).then((s) =>
      setInstance((p) => {
        return s;
      })
    );
  };
  const selectableNodeBounds = useRef<Record<string, Box>>({});
  const fastSaveState = (newState: FrameState) => {
    setInstance((p) => {
      return { ...p, state: newState };
    });
  };
  useEffect(
    () => () => {
      activeRunID.current = null;
    },
    []
  );

  const runRoot = () => {
    if (frameSchema?.type == "frame" || frameSchema?.type == "listitem") {
      const _newRoot = buildRoot(
        frameSchema,
        tableData?.cols ?? [],
        nodes,
        props.superstate,
        editorProps
      );

      setRoot(_newRoot);
      if (_newRoot) {
        const newRoot = _.cloneDeep(_newRoot);
        const runID = uniqueId();
        activeRunID.current = runID;
        executeTreeNode(
          applyPropsToRoot(newRoot, props.props),
          {},
          props.superstate.api,
          saveState,
          newRoot,
          runID
        ).then((s) => {
          setInstance((p) => {
            return s;
          });
          activeRunID.current = s.id;
        });
        if (selectedNodes.length == 0) {
          // setSelectedNodes([newRoot.node]);
        } else {
          setSelectedNodes(
            nodes.filter((f) => selectedNodes.find((g) => g.id == f.id))
          );
        }
      }
    }
  };
  const refreshFrame = (payload: { path: string }) => {
    if (payload.path == spaceInfo.path) {
      runRoot();
    }
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "frameStateUpdated",
      refreshFrame
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "frameStateUpdated",
        refreshFrame
      );
    };
  }, [spaceInfo]);
  useEffect(() => {
    runRoot();
  }, [frameSchema, nodes, tableData, props.props]);

  const moveUp = (node: FrameNode) => {
    const items = nodes
      .filter((f) => f.parentId == node.parentId)
      .sort((a, b) => a.rank - b.rank)
      .map((f, i) => ({ ...f, rank: i }));

    const itemIndex = items.findIndex((item) => item.id === node.id);
    if (itemIndex <= 0) {
      // Can't move up any further, or item doesn't exist
      saveNodes(items);
      return;
    }

    const item = items[itemIndex];
    const swappedItem = items[itemIndex - 1];

    // Swap ranks
    [item.rank, swappedItem.rank] = [swappedItem.rank, item.rank];

    // Sort by rank
    saveNodes(items);
  };

  const moveDown = (node: FrameNode) => {
    const items = nodes
      .filter((f) => f.parentId == node.parentId)
      .sort((a, b) => a.rank - b.rank)
      .map((f, i) => ({ ...f, rank: i }));
    const itemIndex = items.findIndex((item) => item.id === node.id);
    if (itemIndex < 0 || itemIndex >= items.length - 1) {
      // Can't move down any further, or item doesn't exist
      saveNodes(items);
      return;
    }

    const item = items[itemIndex];
    const swappedItem = items[itemIndex + 1];

    // Swap ranks
    [item.rank, swappedItem.rank] = [swappedItem.rank, item.rank];

    // Sort by rank
    saveNodes(items.sort((a, b) => a.rank - b.rank));
  };

  const ungroupNode = (node: FrameNode) => {
    const children = nodes.filter((f) => f.parentId == node.id);
    const newRank = node.rank;
    const items = nodes
      .filter((f) => f.parentId == node.parentId)
      .sort((a, b) => a.rank - b.rank);

    const newItems = insertMulti(
      items,
      newRank,
      children.map((f) => ({ ...f, parentId: node.parentId }))
    )
      .filter((f) => f.id != node.id)
      .map((f, i) => ({ ...f, rank: i }));
    // Update item's rank

    // Update ranks of other items

    // Sort by rank

    return saveNodes(newItems, [node]);
  };

  const moveToRank = (node: FrameNode, newRank: number) => {
    const items = nodes
      .filter((f) => f.parentId == node.parentId)
      .sort((a, b) => a.rank - b.rank)
      .map((f, i) => ({ ...f, rank: i }));
    const itemIndex = items.findIndex((item) => item.id === node.id);

    if (itemIndex < 0 || newRank < 0 || newRank >= items.length) {
      // Item doesn't exist, or invalid new rank
      saveNodes(items);
      return;
    }

    // Get the item and its current rank
    const item = items[itemIndex];

    // Update item's rank
    item.rank = newRank;
    const newItems = arrayMove(items, itemIndex, newRank).map((f, i) => ({
      ...f,
      rank: i,
    }));

    // Sort by rank

    saveNodes(newItems);
  };

  const groupNodes = (treeNodes: FrameNode[], style?: FrameTreeProp) => {
    const parentId =
      treeNodes[0].id == frameSchema.id ? "" : treeNodes[0].parentId;
    const group = {
      ...newUniqueNode(groupNode, parentId, nodes, frameSchema.id),
    };

    const newNodes = treeNodes.map((f) => {
      const node = _.cloneDeep(f);
      node.parentId = group.id;
      return node;
    });
    saveNodes([
      { ...group, styles: { ...group.styles, ...style } },
      ...newNodes,
    ]);
  };

  const addNode = (treeNode: FrameNode, target?: FrameNode) => {
    const id = uniqueNameFromString(
      treeNode.id,
      nodes.map((f) => f.id)
    );

    let parent: FrameNode = target
      ? target
      : selectedNodes.length > 0
      ? selectedNodes[0]
      : root.node;

    let rank = target ? target.rank + 1 : parent.rank;
    if (!groupableTypes.some((f) => parent.type == f)) {
      parent = findParent(root, parent.id).node;
    } else {
      rank = nodes.filter((f) => f.parentId == parent.id).length;
    }
    const newTreeNode: FrameNode = {
      ...treeNode,
      id,
      schemaId: frameSchema.id,
      parentId: parent.id,
    };
    const newNodes = insert(
      nodes
        .filter((f) => f.parentId == parent.id)
        .sort((a, b) => a.rank - b.rank),
      rank,
      newTreeNode
    ).map((f, i) => ({ ...f, rank: i }));
    saveNodes(newNodes).then((f) => selectNodes([newTreeNode]));
  };

  const saveNodes = async (
    treeNodes: FrameNode[],
    deleteNodes?: FrameNode[]
  ) => {
    if (!tableData) {
      return;
    }
    const newRows = tableData?.rows?.some((f) => f.id == root.id)
      ? tableData.rows
      : [...(tableData?.rows ?? []), nodeToFrame(root.node)];
    const insertRows = treeNodes
      .filter((f) => !newRows.some((g) => g.id == f.id))
      .map((f) => nodeToFrame(f));
    const modRows = treeNodes
      .filter((f) => newRows.some((g) => g.id == f.id))
      .map((f) => nodeToFrame(f));
    const newTable = {
      ...tableData,
      cols: tableData.cols ?? [],
      rows: [
        ...newRows.map((f) => modRows.find((g) => g.id == f.id) ?? f),
        ...insertRows,
      ].filter((f) =>
        deleteNodes ? !deleteNodes.some((g) => g.id == f.id) : f
      ) as MFrame[],
    };
    await saveFrame(newTable);
  };
  const moveNodeFromSchema = async (
    nodeId: string,
    schemaId: string,
    newParentId: string,
    styles?: FrameTreeProp
  ) => {
    //THIS IS BROKEN!!!!
    const oldTable = await getMDBData();
    if (!oldTable[schemaId]) return;
    const tableNodes: FrameNode[] = oldTable[schemaId].rows.map((g) =>
      frameToNode(g as MFrame)
    );
    const oldSchema = schemas.find((f) => f.id == schemaId);
    const treeNode = tableNodes.find((f) => f.id == nodeId);
    if (!oldSchema || !treeNode) return;
    const tree = buildFrameTree(
      treeNode,
      tableNodes,
      props.superstate,
      0,
      false,
      editorProps
    )[0];

    const deleteNodes = flattenToFrameNodes(tree);
    const newTreeNodes = deleteNodes.map((f) => ({
      ...f,
      schemaId: frameSchema.id,
      styles:
        f.id == nodeId && styles
          ? {
              ...f.styles,
              ...styles,
            }
          : f.styles,

      parentId: f.id == nodeId ? newParentId : f.parentId,
    }));
    await saveFrame({
      ...oldTable[frameSchema.id],
      rows: oldTable[frameSchema.id].rows.filter(
        (f) =>
          !deleteNodes.some((g) => f.schemaId == g.schemaId && f.id == g.id)
      ) as MFrame[],
    });
    await saveFrame({
      ...tableData,
      rows: [
        ...tableData.rows,
        ...newTreeNodes.map((f) => nodeToFrame(f)),
      ] as MFrame[],
    });
  };
  const deleteNode = (treeNode: FrameNode) => {
    const tree = buildFrameTree(
      treeNode,
      nodes,
      props.superstate,
      0,
      false,
      editorProps
    )[0];
    const parent = findParent(root, treeNode.id);

    const deleteNodes = flattenToFrameNodes(tree);
    if (parent) {
      if (parent.children.length == 1 && parent.node.type == "column")
        deleteNodes.push(parent.node);
      const grandParent = findParent(root, parent.id);
      if (
        grandParent?.children.length == 1 &&
        grandParent.node.type == "container"
      ) {
        deleteNodes.push(grandParent.node);
      }
    }
    saveFrame({
      ...tableData,
      rows: tableData.rows.filter(
        (f) =>
          !deleteNodes.some((g) => f.schemaId == g.schemaId && f.id == g.id)
      ) as MFrame[],
    });
  };
  const properties: SpaceProperty[] = tableData?.cols ?? [];
  const selectNodes = (frames: FrameNode[]) => {
    setSelectedNodes(frames);
  };
  const delProperty = (column: SpaceProperty) => {
    const mdbtable: SpaceTable = tableData;

    const newFields: SpaceProperty[] = mdbtable.cols.filter(
      (f, i) => f.name != column.name
    );
    const newTable = {
      ...mdbtable,
      cols: newFields ?? [],
    };
    saveFrame(newTable as MDBFrame);
  };
  const newProperty = (col: SpaceProperty): boolean => {
    return saveProperty(col);
  };
  const renameNode = (node: FrameNode, newName: string) => {};
  const saveProperty = (
    newColumn: SpaceProperty,
    oldColumn?: SpaceProperty
  ): boolean => {
    const column = {
      ...newColumn,
      name: sanitizeColumnName(newColumn.name),
    };
    const mdbtable = tableData;

    if (column.name == "") {
      props.superstate.ui.notify(i18n.notice.noPropertyName);
      return false;
    }
    if (
      (!oldColumn &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        )) ||
      (oldColumn &&
        oldColumn.name != column.name &&
        mdbtable.cols.find(
          (f) => f.name.toLowerCase() == column.name.toLowerCase()
        ))
    ) {
      props.superstate.ui.notify(i18n.notice.duplicatePropertyName);
      return false;
    }
    const oldFieldIndex = oldColumn
      ? mdbtable.cols.findIndex((f) => f.name == oldColumn.name)
      : -1;
    const newFields: SpaceProperty[] =
      oldFieldIndex == -1
        ? [...mdbtable.cols, column]
        : mdbtable.cols.map((f, i) => (i == oldFieldIndex ? column : f));
    const newTable = {
      ...mdbtable,
      cols: newFields ?? [],
    };
    saveFrame(newTable as MDBFrame);
    return true;
  };

  return (
    <FramesEditorContext.Provider
      value={{
        root,
        runRoot,
        instance,
        dragNode,
        fastSaveState,
        setDragNode,
        hoverNode,
        setHoverNode,
        saveState,
        nodes,
        properties,
        addNode: addNode,
        deleteNode: deleteNode,
        selectedNodes,
        selectNodes,
        saveProperty,
        newProperty,
        selectableNodeBounds,
        renameNode,
        delProperty,
        saveNodes: saveNodes,
        ungroupNode,
        moveUp,
        moveDown,
        moveToRank,
        moveNodeFromSchema,
        groupNodes,
      }}
    >
      {props.children}
    </FramesEditorContext.Provider>
  );
};
