import { PathProvider } from "core/react/context/PathContext";
import { Superstate } from "makemd-core";
import React from "react";
import { SpaceInfo } from "shared/types/spaceInfo";
import { ContextEditorProvider } from "../../context/ContextEditorContext";
import { FramesMDBProvider } from "../../context/FramesMDBContext";
import { SpaceProvider } from "../../context/SpaceContext";
import { ContextListContainer } from "../SpaceView/Contexts/ContextListContainer";
export const MDBViewer = (props: {
  superstate: Superstate;
  space: SpaceInfo;
  schema: string;
}) => {
  return (
    <PathProvider
      superstate={props.superstate}
      path={props.space.path}
      readMode={false}
    >
      <SpaceProvider superstate={props.superstate}>
        <FramesMDBProvider superstate={props.superstate} schema={props.schema}>
          <ContextEditorProvider superstate={props.superstate}>
            <ContextListContainer
              showTitle={false}
              superstate={props.superstate}
            ></ContextListContainer>
          </ContextEditorProvider>
        </FramesMDBProvider>
      </SpaceProvider>
    </PathProvider>
  );
};
