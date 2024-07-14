import { arrayMove } from "@dnd-kit/sortable";
import { Superstate } from "core/superstate/superstate";
import { FMSpaceKeys } from "core/superstate/utils/spaces";
import { FMMetadataKeys } from "core/types/space";
import {
  buildFrameTree,
  buildRoot,
  findParent,
  flattenToFrameNodes,
  schemaToRoot,
} from "core/utils/frames/ast";
import { executableChanged } from "core/utils/frames/frame";
import { newUniqueNode } from "core/utils/frames/frames";
import { relinkProps } from "core/utils/frames/linker";
import { frameToNode, nodeToFrame } from "core/utils/frames/nodes";
import _ from "lodash";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { groupNode } from "schemas/kits/base";
import { deltaNode } from "schemas/kits/slides";
import { groupableTypes } from "schemas/kits/ui";
import { SpaceProperty, SpaceTableColumn } from "types/mdb";
import {
  FrameEditorMode,
  FrameNode,
  FrameNodeState,
  FrameTreeNode,
  FrameTreeProp,
  MFrame,
} from "types/mframe";
import { insert, insertMulti, uniqueNameFromString } from "utils/array";
import { FramesMDBContext } from "./FramesMDBContext";
import { SpaceContext } from "./SpaceContext";

type FramesEditorContextProps = {
  root: FrameTreeNode;

  nodes: FrameNode[];
  properties: SpaceProperty[];

  addNode: (
    treeNode: FrameNode,
    target?: FrameNode,
    insertInto?: boolean
  ) => Promise<FrameNode>;
  deleteNode: (treeNode: FrameNode) => void;

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
  selectedSlide: string;
  setSelectedSlide: (node: string) => void;
  updateNode: (node: FrameNode, state: Partial<FrameNodeState>) => void;
  frameProperties: SpaceProperty[];
  lastCreatedId: string;
  setLastCreatedId: (id: string) => void;
};

export const FramesEditorRootContext = createContext<FramesEditorContextProps>({
  root: null,

  nodes: [],
  properties: [],

  groupNodes: () => null,
  ungroupNode: () => null,

  addNode: () => null,
  deleteNode: () => null,
  saveNodes: () => null,
  moveUp: () => null,
  moveDown: () => null,
  moveToRank: () => null,
  moveNodeFromSchema: () => null,
  selectedSlide: null,
  setSelectedSlide: () => null,
  updateNode: () => null,
  frameProperties: [],
  lastCreatedId: null,
  setLastCreatedId: () => null,
});

export const FrameEditorProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    editMode: FrameEditorMode;
    cols?: SpaceTableColumn[];
  }>
> = (props) => {
  const { spaceInfo } = useContext(SpaceContext);

  const [selectedSlide, setSelectedSlide] = useState<string>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string>(null);

  const {
    frameSchema: frameSchema,
    saveFrame,
    frameSchemas: schemas,
    tableData,
    getMDBData,
  } = useContext(FramesMDBContext);

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

  const frameProperties = useMemo(() => {
    const hiddenFields = [
      ...FMMetadataKeys(props.superstate.settings),
      ...FMSpaceKeys(props.superstate.settings),
    ];
    return root?.id
      ? [
          ...(tableData?.cols.map((f) => ({ ...f, table: "" })) ?? []),
          ...(props.cols ?? []).map((f) => ({
            ...f,
            schemaId: root.id,
          })),
        ].filter((f) => hiddenFields.some((g) => g == f.name) == false)
      : [];
  }, [root, props.cols]);

  const initiateRoot = async () => {
    if (frameSchema?.type == "frame") {
      const _newRoot = await buildRoot(
        frameSchema,
        [
          ...(tableData?.cols ?? []),
          ...(props.cols ?? []).map((f) => ({
            ...f,
            schemaId: frameSchema.id,
          })),
        ],
        nodes,
        props.superstate,
        {
          editMode: props.editMode,
          screenType: props.superstate.ui.getScreenType(),
        }
      );
      if (executableChanged(_newRoot, root)) {
        setRoot(_newRoot);
      }
    }
  };
  // useEffect(() => {
  //   if (selectedNodes.length != 1) {
  //     setSelectedSlide(null);
  //   }
  // }, [selectedNodes]);
  const refreshFrame = (payload: { path: string; schemaId?: string }) => {
    if (payload.path == spaceInfo.path) {
      if (!payload.schemaId || payload.schemaId == frameSchema?.id)
        initiateRoot();
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
    initiateRoot();
  }, [frameSchema, nodes, tableData, props.editMode]);

  const updateNode = (_node: FrameNode, state: Partial<FrameNodeState>) => {
    const node = nodes.find((f) => f.id == _node.id);
    if (!node) return;

    if (selectedSlide) {
      const existingDeltaNode = nodes.find(
        (f) => f.parentId == selectedSlide && f.ref == node.id
      );
      if (!existingDeltaNode) {
        addNode(
          {
            ...deltaNode.node,
            ref: node.id,
            ...state,
          },
          nodes.find((f) => f.id == selectedSlide),
          true
        );
      } else {
        saveNodes([
          {
            ...existingDeltaNode,
            props: state.props
              ? {
                  ...existingDeltaNode.props,
                  ...state.props,
                }
              : existingDeltaNode.props,
            styles: state.styles
              ? {
                  ...existingDeltaNode.styles,
                  ...state.styles,
                }
              : existingDeltaNode.styles,
            actions: state.actions
              ? {
                  ...existingDeltaNode.actions,
                  ...state.actions,
                }
              : existingDeltaNode.actions,
          },
        ]);
      }
    } else {
      saveNodes([
        {
          ...node,
          props: state.props
            ? {
                ...node.props,
                ...state.props,
              }
            : node.props,
          styles: state.styles
            ? {
                ...node.styles,
                ...state.styles,
              }
            : node.styles,
          actions: state.actions
            ? {
                ...node.actions,
                ...state.actions,
              }
            : node.actions,
        },
      ]);
    }
  };
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

  const addNode = async (
    treeNode: FrameNode,
    target?: FrameNode,
    insertInto?: boolean
  ) => {
    let node = relinkProps("$root", frameSchema.id, treeNode, frameSchema.id);
    const id = uniqueNameFromString(
      node.id,
      nodes.map((f) => f.id)
    );
    node = relinkProps(treeNode.id, id, treeNode, frameSchema.id);
    let parent: FrameNode = target ? target : root.node;

    let rank = target ? target.rank + 1 : parent.rank;
    if (!insertInto || !groupableTypes.some((f) => parent.type == f)) {
      parent = findParent(root, parent.id).node;
    } else {
      rank = nodes.filter((f) => f.parentId == parent.id).length;
    }
    const newTreeNode: FrameNode = {
      ...node,
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
    return await saveNodes(newNodes).then((f) => {
      return newTreeNode;
    });
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
    //THIS IS BROKEN!!!!z
    const oldTable = await getMDBData();
    if (!oldTable[schemaId]) return;
    const tableNodes: FrameNode[] = oldTable[schemaId].rows.map((g) =>
      frameToNode(g as MFrame)
    );
    const oldSchema = schemas.find((f) => f.id == schemaId);
    const treeNode = tableNodes.find((f) => f.id == nodeId);
    if (!oldSchema || !treeNode) return;
    const tree = await buildFrameTree(
      treeNode,
      tableNodes,
      props.superstate,
      0,
      false,
      { editMode: props.editMode }
    ).then((f) => f[0]);

    const deleteNodes = flattenToFrameNodes(tree, tree.node.schemaId);
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
  const deleteNode = async (treeNode: FrameNode) => {
    const tree = await buildFrameTree(
      treeNode,
      nodes,
      props.superstate,
      0,
      false,
      { editMode: props.editMode },
      true
    ).then((f) => f[0]);
    const parent = findParent(root, treeNode.id);
    const modNodes: FrameNode[] = [];
    const deleteNodes = flattenToFrameNodes(tree, tree.node.schemaId);
    if (parent) {
      if (parent.children.length == 1 && parent.node.type == "column")
        deleteNodes.push(parent.node);
      const grandParent = findParent(root, parent.id);
      if (grandParent?.node.type == "container") {
        if (grandParent.children.length == 1) {
          deleteNodes.push(grandParent.node);
        } else if (
          grandParent.children.filter((f) => f.node.type == "column").length ==
          1
        ) {
          grandParent.children.forEach((f) => {
            if (f.node.type != "column") {
              modNodes.push({
                ...f.node,
                parentId: grandParent.node.parentId,
              });
            }
          });
          deleteNodes.push(grandParent.node);
        }
      }
    }
    saveFrame({
      ...tableData,
      rows: tableData.rows
        .filter(
          (f) =>
            !deleteNodes.some((g) => f.schemaId == g.schemaId && f.id == g.id)
        )
        .map((f) =>
          modNodes.find((g) => g.id == f.id)
            ? nodeToFrame(modNodes.find((g) => g.id == f.id))
            : f
        ) as MFrame[],
    });
  };
  const properties: SpaceProperty[] = tableData?.cols ?? [];

  return (
    <FramesEditorRootContext.Provider
      value={{
        root,
        nodes,
        properties,
        addNode: addNode,
        deleteNode: deleteNode,

        saveNodes: saveNodes,
        ungroupNode,
        moveUp,
        moveDown,
        moveToRank,
        moveNodeFromSchema,
        groupNodes,
        selectedSlide,
        setSelectedSlide,
        updateNode,
        frameProperties,
        lastCreatedId,
        setLastCreatedId,
      }}
    >
      {props.children}
    </FramesEditorRootContext.Provider>
  );
};
