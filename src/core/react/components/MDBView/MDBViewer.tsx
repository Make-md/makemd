import { Superstate } from "makemd-core";
import React from "react";
import { SpaceInfo } from "types/mdb";
import { ContextEditorProvider } from "../../context/ContextEditorContext";
import { ContextMDBProvider } from "../../context/ContextMDBContext";
import { FramesMDBProvider } from "../../context/FramesMDBContext";
import { SpaceContextProvider } from "../../context/SpaceContext";
import { ContextListView } from "../SpaceView/Contexts/ContextListView";
export const MDBViewer = (props: {
  superstate: Superstate;
  space: SpaceInfo;
  schema: string;
}) => {
  return (
    <SpaceContextProvider superstate={props.superstate} space={props.space}>
      <ContextMDBProvider superstate={props.superstate} schema={props.schema}>
        <FramesMDBProvider superstate={props.superstate}>
          <ContextEditorProvider superstate={props.superstate}>
            <ContextListView superstate={props.superstate}></ContextListView>
          </ContextEditorProvider>
        </FramesMDBProvider>
      </ContextMDBProvider>
    </SpaceContextProvider>
  );
};
