import { FrameRootView } from "core/react/components/SpaceView/Frames/ViewNodes/FrameRoot";
import { ContextEditorProvider } from "core/react/context/ContextEditorContext";
import { ContextMDBProvider } from "core/react/context/ContextMDBContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { SpaceContextProvider } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import { buildRootFromMDBFrame } from "core/utils/frames/ast";
import { frameSchemaToMDBSchema } from "core/utils/frames/nodes";
import React, { useEffect, useMemo, useState } from "react";
import { defaultFrameListViewSchema } from "schemas/mdb";
import { URI } from "types/path";
import { ContextListView } from "../../Contexts/ContextListView";

export const EmbedFrameView = (props: {
  superstate: Superstate;
  path: URI;
  source: string;
}) => {
  const getPathState = (path: string) => {
    if (!path || path == "/") return null;
    const cache = props.superstate.pathsIndex.get(path);
    return cache;
  };
  const [pathState, setFileCache] = useState<PathState>(
    getPathState(props.source)
  );

  const refreshFile = () => {
    return;
  };

  const cacheChanged = (payload: { path: string }) => {
    if (payload.path == props.source) {
      refreshFile();
    }
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      cacheChanged
    );
    refreshFile();
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        cacheChanged
      );
    };
  }, [props.source]);
  const mdbFrame = props.superstate.framesIndex.get(props.path.path)?.frames[
    props.path.ref
  ];
  const root = mdbFrame
    ? buildRootFromMDBFrame(props.superstate, mdbFrame)
    : null;
  return (
    root && (
      <>
        {props.path.fullPath}
        <FrameRootView
          root={root}
          superstate={props.superstate}
          props={props.path.query ?? pathState?.properties ?? {}}
          contexts={{}}
          source={props.source}
        ></FrameRootView>
      </>
    )
  );
};
export const EmbedContextView = (props: {
  superstate: Superstate;
  path: string;
  schema?: string;
  viewSchema?: string;
  minMode?: boolean;
}) => {
  const context = props.superstate.spacesIndex.get(props.path)?.space;

  return (
    context && (
      <SpaceContextProvider superstate={props.superstate} space={context}>
        <ContextMDBProvider superstate={props.superstate} schema={props.schema}>
          <FramesMDBProvider
            superstate={props.superstate}
            schema={props.viewSchema}
          >
            <ContextEditorProvider superstate={props.superstate}>
              <ContextListView
                superstate={props.superstate}
                minMode={props.minMode}
              ></ContextListView>
            </ContextEditorProvider>
          </FramesMDBProvider>
        </ContextMDBProvider>
      </SpaceContextProvider>
    )
  );
};

export interface EmbedContextViewComponentProps {
  path: string;
  superstate: Superstate;
  source?: string;
  minMode?: boolean;
}

type EmbedObject = {
  path: string;
  type: "context" | "frame";
  contextSchema?: string;
  frameSchema?: string;
};

export const EmbedViewComponent = (props: EmbedContextViewComponentProps) => {
  const path = useMemo(
    () => props.superstate.spaceManager.uriByString(props.path),
    [props.path]
  );
  const [embedType, setEmbedType] = useState<EmbedObject>(null);
  useEffect(() => {
    if (path.refType == "context") {
      setEmbedType({
        type: "context",
        path: path.basePath,
        contextSchema: path.ref,
      });
    } else if (path.refType == "frame") {
      let schema = props.superstate.framesIndex
        .get(path.basePath)
        ?.schemas.find((f) => f.id == path.ref);
      if (!schema && path.ref == defaultFrameListViewSchema.id) {
        schema = frameSchemaToMDBSchema(defaultFrameListViewSchema);
        setEmbedType({
          type: "context",
          path: path.basePath,
          frameSchema: schema.id,
        });
      }
      if (schema?.type == "view") {
        setEmbedType({
          type: "context",
          path: path.basePath,
          frameSchema: path.ref,
        });
      } else {
        setEmbedType({
          type: "frame",
          path: path.basePath,
          contextSchema: path.ref,
        });
      }
    } else {
      setEmbedType(null);
    }
  }, [path]);

  return (
    <>
      {embedType?.path &&
        (embedType?.type == "context" ? (
          <EmbedContextView
            superstate={props.superstate}
            path={embedType.path}
            schema={embedType.contextSchema}
            viewSchema={embedType.frameSchema}
            minMode={props.minMode}
          ></EmbedContextView>
        ) : embedType?.type == "frame" ? (
          <EmbedFrameView
            superstate={props.superstate}
            path={path}
            source={props.source}
          ></EmbedFrameView>
        ) : (
          <></>
        ))}
    </>
  );
};
