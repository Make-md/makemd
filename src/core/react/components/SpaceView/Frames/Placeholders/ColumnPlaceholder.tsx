import { useDroppable } from "@dnd-kit/core";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
import { FrameDropMode } from "types/mframe";
export const FrameEditorDropZone = (props: {
  superstate: Superstate;
  id: string;
  parentId: string;
  width: string;
  height: string;
  columnInsert: boolean;
  insertRow: boolean;
  mode: FrameDropMode;
  dropRef: (element: HTMLElement | null) => void;
}) => {
  const { frameSchema } = useContext(FramesMDBContext);
  const { setNodeRef } = useDroppable({
    id: props.id,
    data: {
      id: props.id,
      type: "item",
      parent: props.parentId,
      frame: frameSchema.id,
    },
  });
  return (
    <div
      className={`mk-frame-drop-placeholder`}
      style={{ width: props.width, height: props.height }}
    >
      <div
        className={`${props.insertRow ? "mk-indicator-bottom" : ""}`}
        style={{ width: props.width, height: props.height }}
        ref={props.mode != FrameDropMode.DropModeColumnOnly && props.dropRef}
      ></div>
      {props.mode != FrameDropMode.DropModeRowOnly && (
        <div
          className={`mk-frame-column-placeholder ${
            props.columnInsert && "mk-indicator-right"
          }`}
          style={{ height: props.height }}
          ref={setNodeRef}
        ></div>
      )}
    </div>
  );
};
