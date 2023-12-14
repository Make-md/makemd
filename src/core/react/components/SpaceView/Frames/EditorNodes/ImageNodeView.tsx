import { Superstate } from "core/superstate/superstate";
import React, { useMemo } from "react";
import { FrameRunInstance, FrameTreeNode } from "types/mframe";

export const ImageNodeView = (props: {
  superstate: Superstate;
  treeNode: FrameTreeNode;
  instance: FrameRunInstance;
  editable: boolean;
}) => {
  const value = props.instance.state[props.treeNode.id].props.value;
  const sourcePath = useMemo(() => {
    return props.superstate.ui.getUIPath(value);
  }, [value]);
  return (
    props.instance.state[props.treeNode.id] && (
      <img
        className="mk-image-node"
        style={
          {
            width: props.instance.state[props.treeNode.id]?.styles.width,
            height: props.instance.state[props.treeNode.id]?.styles.height,
          } as React.CSSProperties
        }
        src={sourcePath}
      />
    )
  );
};
