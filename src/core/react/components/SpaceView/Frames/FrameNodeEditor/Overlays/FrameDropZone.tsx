import { useDroppable } from "@dnd-kit/core";
import classNames from "classnames";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
import { FrameDropMode } from "types/mframe";

export const FrameDropZone = (props: {
  id: string;
  parentId: string;
  width: number;
  height: number;
  active: boolean;
  direction: string;
  schemaID: string;
  mode: FrameDropMode;
  insertMode: number;
  node: string;
}) => {
  const { instance, id } = useContext(FrameInstanceContext);
  const { spaceInfo } = useContext(SpaceContext);
  const { setNodeRef } = useDroppable({
    id: props.id + props.direction,
    data: {
      id: props.id + props.direction,
      direction: props.direction,
      type: "node",
      parent: props.parentId,
      root: id,
      frame: props.schemaID,
      space: spaceInfo.path,
      node: props.node,
    },
  });
  const offset = 20;
  const left =
    props.direction == "left"
      ? -offset
      : props.direction == "right"
      ? props.width
      : 0;
  const top =
    props.direction == "bottom"
      ? props.insertMode != 0
        ? props.height
        : props.height / 2
      : props.direction == "top" && props.insertMode != 0
      ? -offset
      : 0;
  const width =
    props.direction == "left" || props.direction == "right"
      ? offset
      : props.width;
  const height =
    props.direction == "top" || props.direction == "bottom"
      ? props.insertMode != 0
        ? offset
        : props.height / 2
      : props.height;
  const indicator =
    props.insertMode != 0
      ? props.direction == "top"
        ? "bottom"
        : props.direction == "bottom"
        ? "top"
        : props.direction
      : props.direction;
  return (
    <div
      ref={setNodeRef}
      className={classNames(
        props.active ? `mk-indicator-${indicator}` : "",
        "mk-frame-drop-zone"
      )}
      style={{
        left,
        top,
        width,
        height,
      }}
    ></div>
  );
};

export const FrameEditorDropZone = (props: {
  superstate: Superstate;
  id: string;
  parentId: string;
  width: number;
  height: number;
  mode: FrameDropMode;
  node: string;
  insertMode: number;
}) => {
  const { frameSchema } = useContext(FramesMDBContext);
  const { hoverNode } = useContext(FrameInstanceContext);
  const directions = [
    ...(props.mode == FrameDropMode.DropModeRowColumn
      ? ["top", "bottom", "left", "right"]
      : props.mode == FrameDropMode.DropModeRowOnly
      ? ["top", "bottom"]
      : props.mode == FrameDropMode.DropModeColumnOnly
      ? ["left", "right"]
      : []),
    ...(props.insertMode == 1 ? ["inside"] : []),
  ];

  return (
    <div
      className={`mk-frame-drop-zone-container`}
      style={{
        width: props.width,
        height: props.height,
      }}
    >
      {directions.map((d) => (
        <FrameDropZone
          {...props}
          key={d}
          active={hoverNode?.node == props.node && hoverNode?.direction == d}
          direction={d}
          mode={props.mode}
          schemaID={frameSchema.id}
        />
      ))}
    </div>
  );
};
