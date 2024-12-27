import { Superstate } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
import { PathState } from "shared/types/PathState";
import { SpaceFragmentViewComponent } from "../SpaceView/Editor/EmbedView/SpaceFragmentView";
import { NoteView } from "./NoteView";

export const PathView = (props: {
  id: string;
  superstate: Superstate;
  path: string;
  styles: React.CSSProperties;
  containerRef: React.RefObject<HTMLDivElement>;
  readOnly: boolean;
}) => {
  const [pathState, setPathState] = useState<PathState>(
    props.superstate.pathsIndex.get(props.path)
  );
  const ref = useRef(null);
  useEffect(() => {
    const uri = props.superstate.spaceManager.uriByString(props.path);
    const pathState = props.superstate.pathsIndex.get(props.path);
    if (!pathState && (uri?.scheme == "https" || uri?.scheme == "http")) {
      setPathState({
        path: props.path,
        label: {
          sticker: uri.scheme,
          name: uri.path,
          color: "",
        },
        hidden: false,
        readOnly: true,
        subtype: "md",
        type: "remote",
      });
      return;
    }

    setPathState(pathState);
  }, [props.path]);

  return (
    <div className="mk-path-view" style={{ ...(props.styles ?? {}) }}>
      {pathState?.type == "remote" ? (
        pathState.subtype == "note" ? (
          <NoteView
            superstate={props.superstate}
            path={props.path}
            load={true}
            classname="mk-flow-node"
          ></NoteView>
        ) : (
          <iframe src={props.path}></iframe>
        )
      ) : pathState?.type == "space" ? (
        <SpaceFragmentViewComponent
          id={props.id}
          showTitle={true}
          containerRef={ref}
          superstate={props.superstate}
          path={props.path}
        ></SpaceFragmentViewComponent>
      ) : props.superstate.ui
          .availableViews()
          .some((f) => f == props.path?.split(".").pop()) ? (
        <NoteView
          superstate={props.superstate}
          path={props.path}
          load={true}
          classname="mk-flow-node"
        ></NoteView>
      ) : (
        <></>
      )}
    </div>
  );
};
