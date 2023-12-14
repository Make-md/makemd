import { FrameRootView } from "core/react/components/SpaceView/Frames/ViewNodes/FrameRoot";
import { Superstate } from "core/superstate/superstate";
import React from "react";
import { DBRow } from "types/mdb";
import { FrameTreeNode } from "types/mframe";

export const CardFrame = (props: {
  superstate: Superstate;
  value: DBRow;
  root: FrameTreeNode;
  children?: React.ReactNode;
}) => {
  const newProps = props.value;

  return (
    <FrameRootView
      root={props.root}
      superstate={props.superstate}
      props={newProps}
      contexts={{}}
    >
      {props.children}
    </FrameRootView>
  );
};
CardFrame.displayName = "CardFrame";
