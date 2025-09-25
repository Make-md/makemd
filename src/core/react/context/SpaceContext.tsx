import { Superstate } from "makemd-core";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SpaceState } from "shared/types/PathState";
import { SpaceInfo } from "shared/types/spaceInfo";
import { PathContext } from "./PathContext";
type SpaceContextProps = {
  spaceInfo: SpaceInfo | null;
  readMode: boolean;
  spaceState: SpaceState;
};
//Instance of SpaceState that Listens to State Changes
export const SpaceContext = createContext<SpaceContextProps>({
  spaceInfo: null,
  readMode: false,
  spaceState: null,
});

export const SpaceProvider: React.FC<
  React.PropsWithChildren<{
    superstate: Superstate;
    spaceInfo?: SpaceInfo
  }>
> = (props) => {
  const { pathState } = useContext(PathContext);

  const spaceInfo: SpaceInfo = useMemo(() => {
    if (props.spaceInfo) return props.spaceInfo
    return props.superstate.spacesIndex.get(pathState.path)?.space;
  }, [pathState]);

  const [spaceState, setSpaceState] = useState<SpaceState>(null);
  const readMode = spaceState?.metadata.readMode ?? spaceInfo?.readOnly;
  useEffect(() => {
    const reloadSpace = () => {
      setSpaceState(props.superstate.spacesIndex.get(pathState.path));
    };

    const refreshSpace = (payload: { path: string }) => {
      if (payload.path == pathState.path) {
        reloadSpace();
      }
    };

    reloadSpace();
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshSpace
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshSpace
      );
    };
  }, [pathState]);
  return (
    <SpaceContext.Provider
      value={{
        spaceState: spaceState,
        readMode,
        spaceInfo,
      }}
    >
      {spaceInfo && props.children}
    </SpaceContext.Provider>
  );
};
