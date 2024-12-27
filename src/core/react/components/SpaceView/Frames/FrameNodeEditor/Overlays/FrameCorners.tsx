import { DraggableSyntheticListeners } from "@dnd-kit/core";
import classNames from "classnames";
import React, { useEffect } from "react";
import { FrameTreeProp } from "shared/types/mframe";
import { FrameDraggableHandle } from "./FrameDraggableHandle";

export const FrameCorners = (props: {
  clientSize: FrameTreeProp;
  styles: FrameTreeProp;
  saveStyles: (size: FrameTreeProp) => void;
  listeners?: DraggableSyntheticListeners;
}) => {
  const match = props.styles.borderRadius
    ? props.styles.borderRadius.match(/^(\d+(?:\.\d+)?)\s?([a-zA-Z%]+)$/)
    : null;
  const numericValue = match ? parseInt(match[1]) : 0;
  const unit = match && match[2] ? match[2] : "px";
  const [offset, setOffset] = React.useState(Math.max(8, numericValue));
  useEffect(() => {
    setOffset(numericValue);
  }, [numericValue]);
  const handleProps = {
    min: 0,
    max: Math.min(props.clientSize.height / 2, props.clientSize.width / 2),
    value: offset,

    onDragMove: (value: number) => {
      setOffset(value);
    },
    onDragEnd: (value: number) => {
      props.saveStyles({ borderRadius: `"${value}${unit}"` });
    },
  };
  const minOffset = Math.max(8, offset);
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
        borderRadius: offset,
        border: "1px solid var(--mk-ui-border-accent)",
      }}
    >
      <div className={classNames("mk-frame-corners")}>
        <div
          className="mk-frame-corner"
          style={{
            position: "absolute",
            transform: `translate(${minOffset}px, ${minOffset}px)`,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            cursor="nwse-resize"
            reverseY
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-corner"
          style={{
            position: "absolute",
            transform: `translate(${
              props.clientSize.width - minOffset
            }px, ${minOffset}px)`,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            cursor="nesw-resize"
            reverseX
            reverseY
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-corner"
          style={{
            position: "absolute",
            transform: `translate(${minOffset}px, ${
              props.clientSize.height - minOffset
            }px)`,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            cursor="nesw-resize"
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-corner"
          style={{
            position: "absolute",
            transform: `translate(${props.clientSize.width - minOffset}px, ${
              props.clientSize.height - minOffset
            }px)`,
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            reverseX={true}
            cursor="nwse-resize"
          ></FrameDraggableHandle>
        </div>
      </div>
    </div>
  );
};
