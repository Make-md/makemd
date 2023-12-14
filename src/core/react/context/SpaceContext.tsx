import { Superstate } from "core/superstate/superstate";
import { PathState, SpaceState } from "core/types/superstate";
import React, { createContext, useEffect, useMemo, useState } from "react";
import { SpaceInfo } from "types/mdb";

type SpaceContextProps = {
  spaceInfo: SpaceInfo | null;
  readMode: boolean;
  spaceState: SpaceState;
  pathState: PathState;
};

export const SpaceContext = createContext<SpaceContextProps>({
  spaceInfo: null,
  readMode: false,
  spaceState: null,
  pathState: null,
});

export const SpaceContextProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    space: SpaceInfo;
  }>
> = (props) => {
  const readMode = props.space?.readOnly;
  const spaceInfo: SpaceInfo = useMemo(() => {
    return props.space;
  }, [props.space]);
  const [spaceState, setSpaceState] = useState<SpaceState>(null);
  const [pathState, setPathState] = useState<PathState>(null);

  useEffect(() => {
    const reloadSpace = () => {
      setSpaceState(props.superstate.spacesIndex.get(spaceInfo.path));
    };
    const reloadPath = () => {
      setPathState(props.superstate.pathsIndex.get(spaceInfo.path));
    };
    const refreshSpace = (payload: { path: string }) => {
      if (payload.path == spaceInfo.path) {
        reloadSpace();
      }
    };

    const refreshPath = (payload: { path: string }) => {
      if (payload.path == spaceInfo.path) {
        reloadPath();
      }
    };
    reloadSpace();
    reloadPath();
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshSpace
    );
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      refreshPath
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshSpace
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        refreshPath
      );
    };
  }, [spaceInfo]);

  return (
    <SpaceContext.Provider
      value={{
        spaceState: spaceState,
        readMode,
        spaceInfo,
        pathState,
      }}
    >
      {props.children}
    </SpaceContext.Provider>
  );
};
