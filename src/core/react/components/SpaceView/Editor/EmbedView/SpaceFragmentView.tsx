import { SpaceCommand } from "core/react/components/SpaceEditor/Actions/SpaceActions";
import { ContextEditorProvider } from "core/react/context/ContextEditorContext";
import { FrameInstanceProvider } from "core/react/context/FrameInstanceContext";
import { FrameRootProvider } from "core/react/context/FrameRootContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useMemo, useState } from "react";
import {
  defaultFrameListViewID,
  defaultFrameListViewSchema,
} from "schemas/mdb";
import { URI } from "types/path";
import { ContextListContainer } from "../../Contexts/ContextListContainer";
import { FrameInstanceView } from "../../Frames/ViewNodes/FrameInstance";

export interface SpaceFragmentViewComponentProps {
  path: string;
  id: string;
  superstate: Superstate;
  source?: string;
  minMode?: boolean;
  showTitle?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  setFrameSchema?: (schema: string) => void;
}

type SpaceFragmentObject = {
  path: string;
  type: "context" | "frame" | "action";
  contextSchema?: string;
  frameSchema?: string;
  actionSchema?: string;
};

export const SpaceFragmentViewComponent = (
  props: SpaceFragmentViewComponentProps
) => {
  const path: URI = useMemo(() => {
    const uri = props.superstate.spaceManager.uriByString(
      props.path,
      props.source
    );

    return uri;
  }, [props.path, props.source]);

  const [spaceFragment, setSpaceFragment] = useState<SpaceFragmentObject>(null);
  useEffect(() => {
    if (path.refType == "context") {
      setSpaceFragment({
        type: "context",
        path: path.basePath,
        contextSchema: path.ref,
        frameSchema: path.query?.frameSchema,
      });
    } else if (path.refType == "frame") {
      props.superstate.spaceManager
        .readFrame(path.basePath, path.ref)
        .then((s) => {
          let schema = s.schema;
          if (!schema && path.ref == defaultFrameListViewSchema.id) {
            schema = defaultFrameListViewSchema;
            setSpaceFragment({
              type: "context",
              path: path.basePath,
              frameSchema: schema.id,
            });
          }
          if (schema?.type == "view") {
            setSpaceFragment({
              type: "context",
              path: path.basePath,
              frameSchema: path.ref,
            });
          } else {
            setSpaceFragment({
              type: "frame",
              path: path.basePath,
              frameSchema: path.ref,
            });
          }
        });
    } else if (path.refType == "action") {
      setSpaceFragment({
        type: "action",
        path: path.basePath,
        actionSchema: path.ref,
      });
    } else {
      setSpaceFragment({
        type: "context",
        path: path.basePath,
        frameSchema: defaultFrameListViewID,
      });
    }
  }, [path]);
  return (
    <>
      {spaceFragment?.path &&
        (spaceFragment?.type == "context" ? (
          <PathProvider
            superstate={props.superstate}
            path={spaceFragment.path}
            readMode={false}
          >
            <SpaceProvider superstate={props.superstate}>
              <FramesMDBProvider
                superstate={props.superstate}
                contextSchema={spaceFragment.contextSchema}
                schema={spaceFragment.frameSchema}
              >
                <ContextEditorProvider superstate={props.superstate}>
                  <ContextListContainer
                    showTitle={props.showTitle}
                    superstate={props.superstate}
                    minMode={props.minMode}
                    containerRef={props.containerRef}
                    setView={props.setFrameSchema}
                  ></ContextListContainer>
                </ContextEditorProvider>
              </FramesMDBProvider>
            </SpaceProvider>
          </PathProvider>
        ) : spaceFragment?.type == "frame" ? (
          <FrameRootProvider
            superstate={props.superstate}
            path={path}
            cols={[]}
          >
            <FrameInstanceProvider
              id={props.id}
              superstate={props.superstate}
              props={{}}
              editable={false}
            >
              <FrameInstanceView
                superstate={props.superstate}
                source={props.source}
              ></FrameInstanceView>
            </FrameInstanceProvider>
          </FrameRootProvider>
        ) : spaceFragment?.type == "action" ? (
          <SpaceCommand
            superstate={props.superstate}
            action={props.path}
          ></SpaceCommand>
        ) : (
          <></>
        ))}
    </>
  );
};
