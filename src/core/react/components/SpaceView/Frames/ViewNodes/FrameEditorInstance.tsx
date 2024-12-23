import { useDndMonitor } from "@dnd-kit/core";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { contextPathForSpace } from "core/utils/contexts/embed";
import { findParent } from "core/utils/frames/ast";
import { dropFrame } from "core/utils/frames/editor/dropFrame";
import { wrapQuotes } from "core/utils/strings";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from "react";
import {
  contextNode,
  flowNode,
  imageNode,
  inputNode,
  textNode,
} from "schemas/kits/base";
import { SpaceProperty } from "types/mdb";
import { FrameEditorMode, FrameTreeProp } from "types/mframe";
import { DefaultMDBTables } from "../DefaultFrames/DefaultFrames";
import { FrameEditorNodeView } from "../EditorNodes/FrameEditorNodeView";
export const FrameEditorInstance = (
  props: PropsWithChildren<{
    superstate: Superstate;
    containerRef: React.RefObject<HTMLDivElement>;
    props?: FrameTreeProp;
    contexts?: FrameTreeProp;
    propSetters?: {
      [key: string]: (value: any) => void;
    };
  }>
) => {
  const { spaceInfo } = useContext(SpaceContext);
  const { undoLastAction, redoAction, frameSchema } =
    useContext(FramesMDBContext);
  const { nodes, addNode, saveNodes, setLastCreatedId } = useContext(
    FramesEditorRootContext
  );

  const { hoverNode, setHoverNode, instance, id } =
    useContext(FrameInstanceContext);

  const { selectionMode, selection, select } = useContext(
    FrameSelectionContext
  );

  const resetState = () => {
    setHoverNode(null);
  };
  useDndMonitor({
    onDragOver: ({ active, over }) => {
      const overId = over?.data.current.node;
      if (over?.data.current.root == id) {
        if (overId)
          setHoverNode({
            id: over?.data.current.id,
            node: over?.data.current.node as string,
            direction: over?.data.current?.direction,
          });
      } else {
        setHoverNode(null);
      }
    },
    onDragCancel: () => {
      resetState();
    },
    onDragEnd: ({ active, over }) => {
      if (!active || !hoverNode) {
        resetState();
        return;
      }

      const overId = hoverNode?.node;

      if (
        overId == active.data.current.id ||
        hoverNode?.id != over.data.current.id
      ) {
        resetState();
        return;
      }

      const overParentNode = findParent(instance.exec, overId as string);
      const overNode = overParentNode?.children.find(
        (f) => f.id == (overId as string)
      );
      if (active.data.current.type == "node") {
        const activeParentNode = findParent(
          instance.exec,
          active.data.current.node as string
        );
        const activeNode = activeParentNode?.children.find(
          (f) => f.id == (active.data.current.node as string)
        );
        if (overNode && activeNode) {
          const [newNodes, deleteNodes] = dropFrame(
            activeNode.node,
            overNode,
            instance.exec,
            nodes,
            hoverNode.direction
          );
          saveNodes(newNodes, deleteNodes);
        }
      } else if (active.data.current.type == "property") {
        if (active.data.current.path == spaceInfo.path && overNode) {
          const [newNodes, deleteNodes] = dropFrame(
            propertyToNode(
              active.data.current.property,
              active.data.current.context
            ),
            overNode,
            instance.exec,
            nodes,
            hoverNode.direction
          );
          saveNodes(newNodes, deleteNodes);
        }
      } else if (active.data.current.type == "listItem") {
        if (overNode) {
          const [newNodes, deleteNodes] = dropFrame(
            {
              ...flowNode.node,
              props: {
                value: `'${active.data.current.contexts?.$context?.["_keyValue"]}'`,
              },
            },
            overNode,
            instance.exec,
            nodes,
            hoverNode.direction
          );
          saveNodes(newNodes, deleteNodes);
        }
      } else if (active.data.current.type == "context") {
        if (overNode) {
          const space = props.superstate.spacesIndex.get(
            active.data.current.space
          );
          if (space) {
            const [newNodes, deleteNodes] = dropFrame(
              {
                ...contextNode.node,
                props: {
                  value: wrapQuotes(
                    contextPathForSpace(space, active.data.current.schema)
                  ),
                },
              },
              overNode,
              instance.exec,
              nodes,
              hoverNode.direction
            );
            saveNodes(newNodes, deleteNodes);
          }
        }
      }
      resetState();
    },
  });
  const propertyToNode = (property: SpaceProperty, context: string) => {
    let node = textNode.node;
    if (property.type == "boolean") {
      node = {
        ...inputNode.node,
        styles: { ...inputNode.node.styles, as: `'checkbox'` },
      };
    } else if (
      property.type == "link" ||
      property.type == "context" ||
      property.type == "file"
    ) {
      node = flowNode.node;
    } else if (property.type == "image") {
      node = imageNode.node;
    }
    if (node.type == "input") {
      node = {
        ...node,
        props: { ...node.props, value: wrapQuotes(property.name) },
      };
    } else {
      if (context.length > 0) {
        node = {
          ...node,
          props: {
            ...node.props,
            value: `$contexts['${context}']['${property.name}']`,
          },
        };
      } else {
        node = {
          ...node,
          props: {
            ...node.props,
            value: `${frameSchema.id}.props['${property.name}']`,
          },
        };
      }
    }
    return node;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key == "ArrowUp") {
        if (selection.length > 0) {
          const node = nodes.find((f) => f.id == selection[0]);
          if (node) {
            const parent = findParent(instance.exec, node.id);
            if (parent) {
              const index = parent.children.find((f) => f.id == node.id).node
                .rank;
              if (index > 0) {
                select(
                  parent.children.find((f) => f.node.rank == index - 1)?.id
                );
              }
            }
          }
        }
      }
      if (e.key == "ArrowDown") {
        if (selection.length > 0) {
          const node = nodes.find((f) => f.id == selection[0]);
          if (node) {
            const parent = findParent(instance.exec, node.id);
            if (parent) {
              const index = parent.children.find((f) => f.id == node.id).node
                .rank;
              if (index < parent.children.length - 1) {
                select(
                  parent.children.find((f) => f.node.rank == index + 1)?.id
                );
              }
            }
          }
        }
      }
      if (e.key == "Delete" || e.key == "Backspace") {
        if (selection.length > 0)
          saveNodes(
            [],
            selection.map((f) => nodes.find((g) => g.id == f)).filter((f) => f)
          );
      }
      if (e.key == "z" && e.metaKey) {
        if (e.shiftKey) {
          redoAction();
        } else {
          undoLastAction();
        }
      }
    },
    [selection, nodes, undoLastAction, redoAction, saveNodes]
  );
  useEffect(() => {
    props.superstate.ui.inputManager.on("keydown", handleKeyDown);
    return () => {
      props.superstate.ui.inputManager.off("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      {instance.exec && (
        <div className="mk-f-root" style={{ position: "relative" }}>
          {selectionMode >= FrameEditorMode.Group && (
            <div
              className="mk-f-root-label"
              onClick={(e) => {
                select(instance.exec.id);
                e.stopPropagation();
              }}
            >
              {instance.exec.node.name}
            </div>
          )}
          {instance.exec.children.length == 0 && frameSchema.id == "main" && (
            <button
              onClick={() => {
                props.superstate.spaceManager.saveFrame(
                  spaceInfo.path,
                  DefaultMDBTables.main
                );
              }}
            >
              + Add View
            </button>
          )}
          <FrameEditorNodeView
            key={spaceInfo.path}
            superstate={props.superstate}
            treeNode={instance.exec}
            instance={instance}
            containerRef={props.containerRef}
          >
            {props.children}
          </FrameEditorNodeView>
        </div>
      )}
    </>
  );
};
