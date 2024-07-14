import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
import { FrameView } from "./FrameView";

export const FrameInstanceView = (props: {
  superstate: Superstate;
  source?: string;
  children?: React.ReactNode;
}) => {
  const { saveState, instance } = useContext(FrameInstanceContext);
  return (
    instance.exec && (
      <FrameView
        superstate={props.superstate}
        treeNode={instance.exec}
        instance={instance}
        saveState={saveState}
        source={props.source}
      >
        {props.children}
      </FrameView>
    )
  );
};
