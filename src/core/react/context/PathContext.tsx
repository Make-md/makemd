import {
  addPathToSpaceAtIndex,
  removePathsFromSpace,
} from "core/superstate/utils/spaces";
import { Superstate } from "makemd-core";
import React, { createContext, useEffect, useState } from "react";
import { PathState } from "shared/types/PathState";
import { genId } from "shared/utils/uuid";
type PathContextProps = {
  uid: string;
  pathState: PathState;
  readMode: boolean;
  addToSpace: (spacePath: string) => void;
  removeFromSpace: (spacePath: string) => void;
};

export const PathContext = createContext<PathContextProps>({
  uid: "",
  readMode: false,
  pathState: null,
  addToSpace: () => null,
  removeFromSpace: () => null,
});

export const PathProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    path: string;
    pathState?: PathState;
    readMode: boolean;
  }>
> = (props) => {
  const [pathState, setPathState] = useState<PathState>(
    props.pathState ?? props.superstate.pathsIndex.get(props.path)
  );

  const addToSpace = async (spacePath: string) => {
    const spaceCache = props.superstate.spacesIndex.get(spacePath);
    if (spaceCache) {
      addPathToSpaceAtIndex(props.superstate, spaceCache, pathState.path, -1);
    }
  };
  const removeFromSpace = (spacePath: string) => {
    removePathsFromSpace(props.superstate, spacePath, [pathState.path]);
  };

  const readMode = pathState?.readOnly || props.readMode;
  useEffect(() => {
    const reloadPath = () => {
      if (!props.pathState)
        setPathState(props.superstate.pathsIndex.get(props.path));
    };

    const changePath = (payload: { path: string; newPath: string }) => {
      if (payload.path == pathState?.path) {
        setPathState(props.superstate.pathsIndex.get(payload.newPath));
      }
    };
    const refreshPath = (payload: { path: string }) => {
      if (payload.path == props.path) {
        reloadPath();
      }
    };
    reloadPath();
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      refreshPath
    );
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      reloadPath
    );

    props.superstate.eventsDispatcher.addListener("pathChanged", changePath);
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        reloadPath
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        refreshPath
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathChanged",
        changePath
      );
    };
  }, [props.path]);

  return (
    <PathContext.Provider
      value={{
        uid: genId(),
        readMode,
        pathState,
        addToSpace,
        removeFromSpace,
      }}
    >
      {pathState ? props.children : <></>}
    </PathContext.Provider>
  );
};
