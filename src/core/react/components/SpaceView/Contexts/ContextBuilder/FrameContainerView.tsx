import { FrameEditorProvider } from "core/react/context/FrameEditorRootContext";
import { FrameRootProvider } from "core/react/context/FrameRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
import { SpaceProperty } from "types/mdb";
import { FrameEditorMode } from "types/mframe";
import { URI } from "types/path";

export const FrameContainerView = (props: {
  superstate: Superstate;
  uri: URI;
  cols: SpaceProperty[];
  children?: React.ReactNode;
  editMode: FrameEditorMode;
}) => {
  const { selected: _selected } = useContext(FrameSelectionContext);
  return props.editMode >= FrameEditorMode.Page &&
    props.uri.authority != "$kit" ? (
    <FramesMDBProvider superstate={props.superstate} schema={props.uri.ref}>
      <FrameEditorProvider
        superstate={props.superstate}
        cols={props.cols}
        editMode={props.editMode}
      >
        {props.children}
      </FrameEditorProvider>
    </FramesMDBProvider>
  ) : (
    <FrameRootProvider
      superstate={props.superstate}
      path={props.uri}
      cols={props.cols}
    >
      {props.children}
    </FrameRootProvider>
  );
};
