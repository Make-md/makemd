import { Superstate } from "core/superstate/superstate";
import { SpaceState } from "core/types/superstate";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SpaceInfo } from "types/mdb";
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
  }>
> = (props) => {
  const { pathState } = useContext(PathContext);

  const spaceInfo: SpaceInfo = useMemo(() => {
    return props.superstate.spacesIndex.get(pathState.path)?.space;
  }, [pathState]);

  const readMode = spaceInfo?.readOnly;
  const [spaceState, setSpaceState] = useState<SpaceState>(null);

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
