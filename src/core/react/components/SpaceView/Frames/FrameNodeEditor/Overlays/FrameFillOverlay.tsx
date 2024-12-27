import React from "react";
import { FrameNodeState } from "shared/types/frameExec";
import { FrameTreeProp } from "shared/types/mframe";

export const FrameFill = (props: {
  state: FrameNodeState;
  clientSize: FrameTreeProp;
  saveStyles: (styles: FrameTreeProp) => void;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.clientSize.width,
        height: props.clientSize.height,
        borderRadius: props.state.styles?.borderRadius,
        pointerEvents: "auto",
      }}
      className="mk-frame-fill"
      onClick={() => {}}
    ></div>
  );
};
