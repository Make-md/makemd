import React, { useMemo } from "react";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const AudioNodeView = (props: FrameNodeViewProps) => {
  const value = props.state.props.value;
  const sourcePath = useMemo(() => {
    return props.superstate.ui.getUIPath(value);
  }, [value]);

  return props.state?.props.value?.length > 0 ? (
    <audio controls preload="none" src={sourcePath} />
  ) : (
    <></>
  );
};
