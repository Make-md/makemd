import { FrameSelectionProvider } from "core/react/context/FrameSelectionContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext, PathProvider } from "core/react/context/PathContext";
import { SpaceContext, SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React, { PropsWithChildren, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { SpaceTableColumn } from "types/mdb";
import { FrameEditorMode } from "types/mframe";
import { ErrorFallback } from "../../Navigator/MainList";
import { FrameContainerView } from "./ContextBuilder/FrameContainerView";

export const SpaceView = (
  props: PropsWithChildren<{
    superstate: Superstate;
    path: string;
    readOnly: boolean;
  }>
) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PathProvider
        superstate={props.superstate}
        path={props.path}
        readMode={false}
      >
        <SpaceProvider superstate={props.superstate}>
          <SpaceRoot superstate={props.superstate}>
            <FrameSelectionProvider
              id={"main"}
              superstate={props.superstate}
              editMode={
                props.readOnly ? FrameEditorMode.Read : FrameEditorMode.Page
              }
            >
              {props.children}
            </FrameSelectionProvider>
          </SpaceRoot>
        </SpaceProvider>
      </PathProvider>
    </ErrorBoundary>
  );
};

export const SpaceRoot = (
  props: React.PropsWithChildren<{ superstate: Superstate }>
) => {
  const { pathState } = useContext(PathContext);
  const { spaceInfo } = useContext(SpaceContext);
  const { tableData } = useContext(FramesMDBContext);
  const cols: SpaceTableColumn[] = [
    ...[...(props.superstate.spacesMap.get(pathState.path) ?? [])].flatMap(
      (f) =>
        props.superstate.contextsIndex
          .get(f)
          ?.contextTable?.cols.map((g) => ({ ...g, table: f }))
    ),
    ...(tableData?.cols.map((f) => ({ ...f, table: "" })) ?? []),
  ];
  return (
    <FrameContainerView
      uri={props.superstate.spaceManager.uriByString(`${spaceInfo.path}#*main`)}
      superstate={props.superstate}
      editMode={
        spaceInfo.readOnly ? FrameEditorMode.Read : FrameEditorMode.Page
      }
      cols={cols}
    >
      {props.children}
    </FrameContainerView>
  );
};
