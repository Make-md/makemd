import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { SpaceContextProvider } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React from "react";
import { SpaceComponent } from "../SpaceComponent";

export const SpaceView = (props: { superstate: Superstate; path: string }) => {
  const [spaceState, setSpaceState] = React.useState(
    props.superstate.spacesIndex.get(props.path)
  );

  React.useEffect(() => {
    const update = (payload: { path: string }) => {
      if (payload.path == props.path) {
        setSpaceState(props.superstate.spacesIndex.get(props.path));
      }
    };
    setSpaceState(props.superstate.spacesIndex.get(props.path));
    props.superstate.eventsDispatcher.addListener("spaceStateUpdated", update);
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        update
      );
    };
  }, [props.path]);
  return (
    <div className="mk-space-view">
      {spaceState?.space && (
        <SpaceContextProvider
          superstate={props.superstate}
          space={spaceState.space}
        >
          <FramesMDBProvider superstate={props.superstate} schema={"main"}>
            <SpaceComponent
              path={props.path}
              superstate={props.superstate}
            ></SpaceComponent>
          </FramesMDBProvider>
        </SpaceContextProvider>
      )}
    </div>
  );
};
