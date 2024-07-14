import { buildRootFromMDBFrame } from "core/utils/frames/ast";
import { Superstate } from "makemd-core";
import React, { useEffect, useState } from "react";
import { SpaceProperty } from "types/mdb";
import { FrameExecutable, defaultFrameEditorProps } from "types/mframe";
import { URI } from "types/path";

export type FrameRootContextType = {
  root: FrameExecutable;
  path: string;
};

export const FrameRootContext = React.createContext<FrameRootContextType>({
  root: null,
  path: null,
});
export const FrameRootProvider = (
  props: React.PropsWithChildren<{
    superstate: Superstate;
    path: URI;
    cols: SpaceProperty[];
  }>
) => {
  const [root, setRoot] = useState<FrameExecutable>(null);

  const refreshFrame = (payload: { path: string }) => {
    if (payload.path != props.path.basePath && props.path.authority != "$kit") {
      return;
    }
    if (props.path.authority == "$kit") {
      setRoot(props.superstate.kitFrames.get(props.path.ref));
      return;
    }
    props.superstate.spaceManager
      .readFrame(props.path.basePath, props.path.ref)
      .then((f) =>
        buildRootFromMDBFrame(props.superstate, f, {
          ...defaultFrameEditorProps,
          screenType: props.superstate.ui.getScreenType(),
        })
      )
      .then((f) => setRoot(f));
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "frameStateUpdated",
      refreshFrame
    );
    refreshFrame({ path: props.path.basePath });
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "frameStateUpdated",
        refreshFrame
      );
    };
  }, [props.path]);

  return (
    <FrameRootContext.Provider
      value={{
        root,
        path: props.path.fullPath,
      }}
    >
      {props.children}
    </FrameRootContext.Provider>
  );
};
