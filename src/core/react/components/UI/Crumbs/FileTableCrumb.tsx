import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate, i18n } from "makemd-core";
import React, { useContext, useRef } from "react";

import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import { WindowContext } from "core/react/context/WindowContext";
import { defaultContextSchemaID } from "shared/schemas/context";
import { PathState } from "shared/types/PathState";
import { PathCrumb } from "./PathCrumb";

export const FileTableCrumb = (props: {
  superstate: Superstate;
  paths: PathState[];
  editMode: () => void;
}) => {
  const { spaceState } = useContext(SpaceContext);
  const dragId = spaceState.path + defaultContextSchemaID;
  const { setDragNode } = useContext(WindowContext);
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
      space: spaceState?.path,
      schema: defaultContextSchemaID,
    },
  });
  const ref = useRef(null);
  useDndMonitor({
    onDragStart: (e) => {
      if (e.active.data.current.id == dragId) {
        setDragNode(
          <div
            className="mk-path-info"
            dangerouslySetInnerHTML={{ __html: ref.current.innerHTML }}
          />
        );
      }
    },
  });
  return (
    <div
      className="mk-path-info"
      ref={(el) => {
        ref.current = el;
        setDraggableNodeRef(el);
      }}
      {...attributes}
      {...listeners}
    >
      <div
        className="mk-icon-small"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//file-stack"),
        }}
        aria-label={i18n.labels.items}
      ></div>
      {props.paths.length > 0 ? (
        <>
          {props.paths.length}
          <div className="mk-path-preview">
            {props.paths.slice(0, 3).map((f, i) => (
              <PathCrumb
                key={i}
                superstate={props.superstate}
                path={f.path}
              ></PathCrumb>
            ))}
          </div>
          <span
            onClick={(e) => props.editMode()}
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//edit"),
            }}
          ></span>
        </>
      ) : (
        <div>
          <span
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
            onClick={(e) => props.editMode()}
          ></span>
        </div>
      )}
    </div>
  );
};
