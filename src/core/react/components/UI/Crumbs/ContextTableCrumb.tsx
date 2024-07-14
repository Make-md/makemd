import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import { SpaceContext } from "core/react/context/SpaceContext";
import { WindowContext } from "core/react/context/WindowContext";
import { Superstate } from "makemd-core";
import React, { useContext, useRef } from "react";
import { SpaceTableSchema } from "types/mdb";

export const ContextTableCrumb = (props: {
  superstate: Superstate;
  schema: SpaceTableSchema;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) => {
  const { setDragNode } = useContext(WindowContext);
  const { spaceInfo } = useContext(SpaceContext);
  const dragId = spaceInfo.path + props.schema?.id;
  const {
    attributes,
    listeners,

    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: dragId,
    data: {
      id: dragId,
      type: "context",
      space: spaceInfo?.path,
      schema: props.schema?.id,
    },
  });
  const ref = useRef(null);
  useDndMonitor({
    onDragStart: (e) => {
      if (e.active.data.current.id == dragId) {
        setDragNode(
          <div dangerouslySetInnerHTML={{ __html: ref.current.innerHTML }} />
        );
      }
    },
  });
  return (
    <div
      className="mk-path"
      onClick={(e) => props.onClick(e)}
      ref={(el) => {
        setDraggableNodeRef(el);
        ref.current = el;
      }}
      onContextMenu={(e) => props.onContextMenu(e)}
      {...attributes}
      {...listeners}
    >
      <div
        className="mk-path-icon"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(
            props.schema?.primary == "true" ? "ui//layout-list" : "ui//table"
          ),
        }}
      ></div>
      {props.schema?.name}
    </div>
  );
};
