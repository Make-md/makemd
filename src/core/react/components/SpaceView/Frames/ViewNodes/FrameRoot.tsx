import { Superstate } from "core/superstate/superstate";
import { applyPropsToRoot, replaceSubtree } from "core/utils/frames/ast";
import { executeTreeNode } from "core/utils/frames/runner";
import _, { uniqueId } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import {
  FrameContexts,
  FrameRunInstance,
  FrameState,
  FrameTreeNode,
  FrameTreeProp,
} from "types/mframe";
import { FrameView } from "./FrameView";

export const FrameRootView = (props: {
  superstate: Superstate;
  root: FrameTreeNode;
  props: FrameTreeProp;
  contexts: FrameContexts;
  source?: string;
  children?: React.ReactNode;
}) => {
  const [instance, setInstance] = useState<FrameRunInstance>({
    state: {},
    id: null,
    root: null,
  });
  const activeRunID = useRef(null);
  const runRoot = () => {
    if (props.root) {
      const root = _.cloneDeep(props.root);
      const runID = uniqueId();
      activeRunID.current = runID;
      executeTreeNode(
        applyPropsToRoot(root, props.props),
        {},
        props.superstate.api,
        saveState,
        root,
        runID
      ).then((s) => {
        setInstance((p) => s);
        activeRunID.current = s.id;
      });
    }
  };
  useEffect(() => {
    runRoot();
  }, [props.root]);
  useEffect(() => runRoot(), []);
  const saveState = (state: FrameState, instance: FrameRunInstance) => {
    const { root, state: prevState, id: runID } = instance;

    if (runID != activeRunID.current) return;

    executeTreeNode(
      applyPropsToRoot(root, props.props),
      prevState,
      props.superstate.api,
      saveState,
      root,
      runID,
      state
    ).then((s) =>
      setInstance((p) => ({
        ...s,
        root: replaceSubtree(p.root, s.root),
      }))
    );
  };
  useEffect(
    () => () => {
      activeRunID.current = null;
    },
    []
  );

  return (
    instance.root && (
      <FrameView
        superstate={props.superstate}
        treeNode={instance.root}
        instance={instance}
        saveState={saveState}
        source={props.source}
      >
        {props.children}
      </FrameView>
    )
  );
};
