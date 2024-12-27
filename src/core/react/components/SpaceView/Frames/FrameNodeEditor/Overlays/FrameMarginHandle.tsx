import { DraggableSyntheticListeners } from "@dnd-kit/core";
import classNames from "classnames";
import { stringIsConst } from "core/utils/frames/frames";
import { removeQuotes } from "core/utils/strings";
import React, { useEffect } from "react";
import { FrameTreeProp } from "shared/types/mframe";
import { FrameDraggableHandle } from "./FrameDraggableHandle";

export const FrameMargin = (props: {
  clientSize: FrameTreeProp;
  margin: string;
  setMargin: (margin: string) => void;
  listeners?: DraggableSyntheticListeners;
}) => {
  const match =
    props.margin && stringIsConst(props.margin)
      ? removeQuotes(props.margin).match(/^(\d+(?:\.\d+)?)\s?([a-zA-Z%]+)$/)
      : null;
  const numericValue = Math.max(match ? parseInt(match[1]) : 0, 8);
  const unit = match && match[2] ? match[2] : "px";
  const [offset, setOffset] = React.useState(numericValue);
  useEffect(() => {
    setOffset(numericValue);
  }, [numericValue]);
  const handleProps = {
    min: 0,
    max: Math.min(props.clientSize.height / 2, props.clientSize.width / 2),
    value: offset,
    cursor: "nwse-resize",
    onDragMove: (value: number) => {
      setOffset(value);
    },
    onDragEnd: (value: number) => {
      props.setMargin(`"${value}${unit}"`);
    },
  };
  const inset = Math.max(5, offset);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.clientSize.width,
        height: props.clientSize.height,
        display: "flex",
        zIndex: 200,
        border: "1px solid var(--mk-ui-color-border-accent)",
      }}
    >
      <div className={classNames("mk-frame-paddings")}>
        <div
          className="mk-frame-padding-handle-h"
          style={{
            position: "absolute",
            transform: `translate(${
              props.clientSize.width / 2 - 5
            }px, ${-inset}px)`,
            height: inset,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            reverseX
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-v"
          style={{
            position: "absolute",
            transform: `translate(${props.clientSize.width}px, ${
              props.clientSize.height / 2 - 5
            }px)`,
            width: inset,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle {...handleProps}></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-v"
          style={{
            position: "absolute",
            transform: `translate(${-inset}px, ${
              props.clientSize.height / 2 - 5
            }px)`,
            width: inset,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            reverseX
            reverseY
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-h"
          style={{
            position: "absolute",
            transform: `translate(${props.clientSize.width / 2 - 5}px, ${
              props.clientSize.height
            }px)`,
            height: inset,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            reverseY
          ></FrameDraggableHandle>
        </div>
      </div>
    </div>
  );
};
