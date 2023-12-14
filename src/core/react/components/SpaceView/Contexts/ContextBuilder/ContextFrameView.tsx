import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useDndMonitor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import i18n from "core/i18n";
import { FrameNodeView } from "core/react/components/SpaceView/Frames/EditorNodes/FrameNodeView";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RowPlaceholder } from "core/react/components/SpaceView/Frames/Placeholders/RowPlaceholder";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import {
  FramesEditorContext,
  FramesEditorProvider,
} from "core/react/context/FrameEditorContext";
import {
  FramesMDBContext,
  FramesMDBProvider,
} from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { findParent } from "core/utils/frames/ast";
import { addNodeToMFrame } from "core/utils/frames/frame";
import { newUniqueNode } from "core/utils/frames/frames";
import { columnNode, columnsNode, contentNode } from "schemas/frames";
import { FrameSchema } from "types/mframe";
const PLACEHOLDER_ID = "_placeholder";
export const ContextFrameView = (props: { superstate: Superstate }) => {
  const [selectedType, setSelectedType] = useState<"frame" | "frameGroup">(
    "frame"
  );
  const { predicate, savePredicate, cols, data, setEditMode } =
    useContext(ContextEditorContext);
  const { frameSchemas, saveSchema } = useContext(FramesMDBContext);
  const { spaceInfo } = useContext(SpaceContext);

  const selectedGroup = useMemo(
    () =>
      predicate && predicate["frameGroup"]
        ? props.superstate.spaceManager.uriByString(predicate["frameGroup"]).ref
        : null,
    [predicate]
  );
  const selectedFrame = useMemo(
    () =>
      predicate && predicate["frame"]
        ? props.superstate.spaceManager.uriByString(predicate["frame"]).ref
        : null,
    [predicate]
  );
  const selectFrame = (frameRef: string, type: string) => {
    savePredicate({ ...predicate, view: "frame", [type]: frameRef });
  };

  const setFrameProps = (frameProps: { [key: string]: string }) => {
    savePredicate({ ...predicate, frameProps });
  };
  const newSchema = async (schema: FrameSchema, type: string) => {
    selectFrame(`${spaceInfo.path}/#*${schema.id}`, type);
    await saveSchema(schema);
    return schema;
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const selectFrameMenu = (e: React.MouseEvent, frame: string) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: frameSchemas
          .filter((f) => f.type == "listitem")
          .map((f) => ({ name: f.name, value: f.id })),
        saveOptions: (_: string[], value: string[], isNew: boolean) => {
          if (!frameSchemas.some((f) => f.id == value[0])) {
            newSchema(
              { name: value[0], type: "listitem", id: value[0] },
              frame
            ).then((f) =>
              addNodeToMFrame(
                props.superstate,
                spaceInfo,
                f.id,
                contentNode.node
              )
            );
          } else {
            selectFrame(`${spaceInfo.path}/#*${value[0]}`, frame);
          }
        },
        placeholder: "Select/Create List Item Frame",
        detail: true,
        searchable: false,
        showAll: true,
      }
    );
  };
  const saveViewType = (type: string) => {
    savePredicate({
      ...predicate,
      view: type,
      frame: "",
    });
  };
  return (
    <>
      <div className="mk-context-view-editor">
        <div className="mk-context-view-menu">
          <div>Edit Mode</div>
          <div
            className={`${selectedType == "frameGroup" ? "mk-is-active" : ""}`}
            onClick={() => setSelectedType("frameGroup")}
          >
            Group
          </div>
          <div
            className={`${selectedType == "frame" ? "mk-is-active" : ""}`}
            onClick={() => setSelectedType("frame")}
          >
            Item
          </div>
          <div className="mk-divider"></div>
          <div>Group</div>
          <div
            className="mk-button"
            onClick={(e) => selectFrameMenu(e, "frameGroup")}
          >
            {selectedGroup ?? "New Group View"}
          </div>
          <div className="mk-divider"></div>
          <div>Item</div>

          <div
            className="mk-button"
            onClick={(e) => selectFrameMenu(e, "frame")}
          >
            {selectedFrame ?? "New Item View"}
          </div>

          <span></span>
          <div onClick={() => setEditMode(0)} className="mk-button mk-cta">
            {i18n.labels.done}
          </div>
        </div>
        {selectedGroup ? (
          <DndContext
            sensors={sensors}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            <FramesMDBProvider
              superstate={props.superstate}
              schema={selectedGroup}
            >
              <FramesEditorProvider
                superstate={props.superstate}
                editMode={selectedType == "frameGroup" ? 2 : 0}
              >
                <FrameListView
                  superstate={props.superstate}
                  cols={["name", "value"]}
                  editMode={selectedType == "frameGroup" ? 2 : 0}
                >
                  {selectedFrame ? (
                    data.map((f, i) => (
                      <DndContext
                        key={i}
                        sensors={sensors}
                        measuring={{
                          droppable: {
                            strategy: MeasuringStrategy.Always,
                          },
                        }}
                      >
                        <FramesMDBProvider
                          superstate={props.superstate}
                          schema={selectedFrame}
                        >
                          <FramesEditorProvider
                            superstate={props.superstate}
                            props={f}
                            editMode={selectedType == "frame" ? 2 : 0}
                          >
                            <FrameListView
                              superstate={props.superstate}
                              cols={cols.map((f) => f.name)}
                              editMode={selectedType == "frame" ? 2 : 0}
                            ></FrameListView>
                          </FramesEditorProvider>
                        </FramesMDBProvider>
                      </DndContext>
                    ))
                  ) : (
                    <div className="mk-content-placeholder"></div>
                  )}
                </FrameListView>
              </FramesEditorProvider>
            </FramesMDBProvider>
          </DndContext>
        ) : selectedFrame ? (
          <div>
            {data.map((f, i) => (
              <DndContext
                key={i}
                sensors={sensors}
                measuring={{
                  droppable: {
                    strategy: MeasuringStrategy.Always,
                  },
                }}
              >
                <FramesMDBProvider
                  superstate={props.superstate}
                  schema={selectedFrame}
                >
                  <FramesEditorProvider
                    superstate={props.superstate}
                    props={f}
                    editMode={1}
                  >
                    <FrameListView
                      superstate={props.superstate}
                      cols={cols.map((f) => f.name)}
                      editMode={selectedType == "frame" ? 2 : 0}
                    ></FrameListView>
                  </FramesEditorProvider>
                </FramesMDBProvider>
              </DndContext>
            ))}
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export const FrameListView = (props: {
  superstate: Superstate;
  cols: string[];
  children?: React.ReactNode;
  editMode: number;
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

  const _instance = useMemo(() => {
    return instance
      ? {
          ...instance,
          root: instance.root
            ? {
                ...instance.root,
                node: {
                  ...instance.root.node,
                  props: props.cols.reduce(
                    (p, c) => ({
                      ...p,
                      [c]: "",
                    }),
                    {}
                  ),
                },
              }
            : null,
        }
      : null;
  }, [props.cols, instance]);

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

  const getDragLayer = () => {
    if (dragNode === null) {
      return null;
    }

    const node = findParent(instance.root, dragNode)?.children.find(
      (f) => f.id == dragNode
    );
    if (!node) return null;
    return (
      <FrameNodeView
        editMode={props.editMode}
        superstate={props.superstate}
        treeNode={node}
        instance={instance}
      >
        {props.children}
      </FrameNodeView>
    );
  };

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

      if (overNewColumn) {
        if (overNode.node.type == "column") {
          const column = {
            ...newUniqueNode(columnNode, overParentNode.id, [], frameSchema.id),
            rank:
              overNode.node.rank > activeNode.node.rank
                ? overNode.node.rank
                : overNode.node.rank + 1,
          };
          const nodes = [column, { ...activeNode.node, parentId: column.id }];
          if (active.data.current.frame != frameSchema.id) {
            saveNodes([column]).then(() =>
              moveNodeFromSchema(
                active.data.current.id,
                active.data.current.frame,
                column.id,
                {
                  position: `'relative'`,
                  left: "0",
                  top: "0",
                }
              )
            );
          } else {
            saveNodes(nodes);
          }
        } else {
          const newColumns = newUniqueNode(
            columnsNode,
            overParentNode.id,
            nodes,
            frameSchema.id
          );
          const column1 = newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns],
            frameSchema.id
          );

          const column2 = newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns, column1],
            frameSchema.id
          );
          const newNodes = [
            newColumns,
            column1,
            column2,
            { ...overNode.node, parentId: column1.id },
          ];
          if (active.data.current.frame != frameSchema.id) {
            saveNodes(newNodes).then(() =>
              moveNodeFromSchema(
                active.data.current.id,
                active.data.current.frame,
                column2.id,
                {
                  position: `'relative'`,
                  left: "0",
                  top: "0",
                }
              )
            );
          } else {
            saveNodes([
              ...newNodes,
              { ...activeNode.node, parentId: column2.id },
            ]);
          }
        }
        resetState();
        return;
      }
      if (active.data.current.frame != frameSchema.id) {
        moveNodeFromSchema(
          active.data.current.id,
          active.data.current.frame,
          overNode.node.parentId,
          {
            position: `'relative'`,
            left: "0",
            top: "0",
          }
        );
        resetState();
        return;
      }
      if (overParentNode?.id == activeParentNode?.id) {
        console.group("same parent", overNode);
        if (overNode) moveToRank(activeNode.node, overNode.node.rank);
      } else {
        if (overNode)
          saveNodes([{ ...activeNode.node, parentId: overNode.node.parentId }]);
      }
      if (!overId) {
        resetState();
        return;
      }

      if (overId === PLACEHOLDER_ID) {
        saveNodes([{ ...activeNode.node, parentId: overNode.node.id }]);
        resetState();
        return;
      }

      resetState();
    },
  });
  return (
    _instance?.root && (
      <div className={props.editMode == 2 ? "mk-f-edit" : ""}>
        <FrameNodeView
          editMode={props.editMode}
          superstate={props.superstate}
          treeNode={_instance.root}
          instance={_instance}
        >
          {props.children}
        </FrameNodeView>
        {props.editMode > 0 && (
          <RowPlaceholder
            superstate={props.superstate}
            id={PLACEHOLDER_ID}
            parentId={frameSchema.id}
          ></RowPlaceholder>
        )}
        {createPortal(
          <DragOverlay>{getDragLayer()}</DragOverlay>,
          document.body
        )}
      </div>
    )
  );
};
