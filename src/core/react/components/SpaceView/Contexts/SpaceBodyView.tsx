import { DragOverlay, useDndMonitor } from "@dnd-kit/core";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { Superstate } from "core/superstate/superstate";
import { findParent } from "core/utils/frames/ast";
import { dropFrame } from "core/utils/frames/editor/dropFrame";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ContextSchemaType } from "types/mdb";
import { FrameNodeView } from "../Frames/EditorNodes/FrameNodeView";
import { RowPlaceholder } from "../Frames/Placeholders/RowPlaceholder";
import { FrameView } from "../Frames/ViewNodes/FrameView";
const PLACEHOLDER_ID = "_placeholder";
export const SpaceBodyView = (props: {
  superstate: Superstate;
  selectedView: ContextSchemaType;
  cols: string[];
}) => {
  const { frameSchema } = useContext(FramesMDBContext);
  const {
    instance,
    root,
    saveState,
    hoverNode,
    setHoverNode,
    dragNode,
    moveToRank,
    nodes,
    setDragNode,
    addNode,
    saveNodes,
    moveNodeFromSchema,
  } = useContext(FramesEditorContext);

  const activeRunID = useRef(null);
  useEffect(
    () => () => {
      activeRunID.current = null;
    },
    []
  );
  const resetState = () => {
    setHoverNode(null);
    setDragNode(null);
  };
  const dragTreeNode = useMemo(
    () =>
      dragNode &&
      instance.root &&
      findParent(instance.root, dragNode)?.children.find(
        (f) => f.id == dragNode
      ),
    [dragNode, instance]
  );

  useDndMonitor({
    onDragStart({ active }) {
      if (active.data.current.frame == frameSchema.id)
        setDragNode(active.data.current.id as string);
    },
    onDragOver({ active, over }) {
      const overId = over?.data.current.id;

      if (over?.data.current.frame == frameSchema.id)
        if (overId) setHoverNode(overId as string);
    },
    onDragCancel() {
      resetState();
    },
    onDragEnd({ active, over }) {
      if (!active) {
        resetState();
        return;
      }
      let overId = hoverNode as string;
      let overNewColumn = false;

      if (overId?.charAt(0) == "|") {
        overId = overId.substring(1);
        overNewColumn = true;
      }
      if (overId == active.data.current.id) {
        resetState();
        return;
      }

      const overParentNode = findParent(instance.root, overId as string);
      const overNode = overParentNode?.children.find(
        (f) => f.id == (overId as string)
      );

      const activeParentNode = findParent(
        instance.root,
        active.data.current.id as string
      );
      const activeNode = activeParentNode?.children.find(
        (f) => f.id == (active.data.current.id as string)
      );
      if (overId === PLACEHOLDER_ID) {
        saveNodes([{ ...activeNode.node, parentId: overNode.node.id }]);
      } else if (overNode && activeNode) {
        const [newNodes, deleteNodes] = dropFrame(
          activeNode,
          overNode,
          instance.root,
          nodes,
          overNewColumn
        );
        saveNodes(newNodes, deleteNodes);
      }
      resetState();
    },
  });
  const _instance = useMemo(() => {
    return instance
      ? {
          ...instance,
          root: instance.root
            ? {
                ...instance.root,
                node: {
                  ...instance.root.node,
                  props: {
                    ...instance.root.node.props,
                    ...props.cols.reduce(
                      (p, c) => ({
                        ...p,
                        [c]: "",
                      }),
                      {}
                    ),
                  },
                },
              }
            : null,
        }
      : null;
  }, [props.cols, instance]);
  return (
    <>
      {_instance.root && (
        <>
          <FrameNodeView
            editMode={1}
            superstate={props.superstate}
            treeNode={_instance.root}
            instance={_instance}
          ></FrameNodeView>
          <RowPlaceholder
            superstate={props.superstate}
            id={PLACEHOLDER_ID}
            parentId="main"
          ></RowPlaceholder>
        </>
      )}
      {createPortal(
        <DragOverlay dropAnimation={null} zIndex={1600}>
          {dragTreeNode && (
            <FrameView
              superstate={props.superstate}
              treeNode={dragTreeNode}
              instance={_instance}
              saveState={saveState}
            ></FrameView>
          )}
        </DragOverlay>,
        document.body
      )}
    </>
  );
};
