import { SpaceCommand } from "core/react/components/SpaceEditor/Actions/SpaceActions";
import { ContextEditorProvider } from "core/react/context/ContextEditorContext";
import { FrameInstanceProvider } from "core/react/context/FrameInstanceContext";
import { FrameRootProvider } from "core/react/context/FrameRootContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import { Superstate } from "makemd-core";
import React, { useEffect, useMemo, useState } from "react";
import {
  defaultFrameListViewID,
  defaultFrameListViewSchema,
} from "schemas/mdb";
import { URI } from "shared/types/path";
import { SpaceFragmentType } from "shared/types/spaceFragment";
import { Visualization } from "../../../Visualization/Visualization";
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
  type: SpaceFragmentType;
  contextSchema?: string;
  frameSchema?: string;
  actionSchema?: string;
};

export const SpaceFragmentViewComponent = (
  props: SpaceFragmentViewComponentProps
) => {
  const spaceManager = useSpaceManager();
  
  const path: URI = useMemo(() => {
    const uri = props.superstate.spaceManager.uriByString(
      props.path,
      props.source
    );
    
    // SpaceManager handles path resolution internally
    if (spaceManager.isPreviewMode && uri?.basePath) {
      const adjustedUri = {
        ...uri,
        basePath: props.source || uri.basePath
      };
      return adjustedUri;
    }

    return uri;
  }, [props.path, props.source, spaceManager]);

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
      // SpaceManager handles MKit frame data internally
      if (spaceManager.isPreviewMode) {
        // Try to get frame data from SpaceManager (it handles MKit internally)
        spaceManager.readFrame(path.basePath, path.ref).then((frameData) => {
          if (frameData) {
            const schema = frameData.schema || { id: path.ref, type: 'frame' };
            
            if (schema?.type == "view") {
              setSpaceFragment({
                type: "context",
                path: path.basePath,
                frameSchema: path.ref,
              });
            } else if (schema?.type == "vis") {
              setSpaceFragment({
                type: "vis",
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
          } else {
          }
        }).catch((error) => {
        });
      } else {
        // Fallback for non-preview mode or if SpaceManager didn't find the frame
        spaceManager.readFrame(path.basePath, path.ref).then((s) => {
          let schema = s?.schema;
          if (!schema && path.ref == defaultFrameListViewSchema.id) {
            schema = defaultFrameListViewSchema;
            setSpaceFragment({
              type: "context", 
              path: path.basePath,
              frameSchema: schema.id,
            });
            return;
          }
          if (schema?.type == "view") {
            setSpaceFragment({
              type: "context",
              path: path.basePath,
              frameSchema: path.ref,
            });
          } else if (schema?.type == "vis") {
            setSpaceFragment({
              type: "vis",
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
        }).catch((error) => {
        });
      }
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
  }, [path, spaceManager]);
  
  return (
    <>
      {spaceFragment?.path ? (
        spaceFragment?.type == "context" ? (
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
                path={spaceFragment.path}
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
        ) : spaceFragment?.type == "vis" ? (
          <PathProvider
            superstate={props.superstate}
            path={spaceFragment.path}
            readMode={false}
          >
            <SpaceProvider superstate={props.superstate}>
              <FramesMDBProvider
                superstate={props.superstate}
                schema={spaceFragment.frameSchema}
              >
                <Visualization
                  mdbFrameId={spaceFragment.frameSchema}
                  sourcePath={spaceFragment.path}
                  superstate={props.superstate}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "400px",
                  }}
                />
              </FramesMDBProvider>
            </SpaceProvider>
          </PathProvider>
        ) : spaceFragment?.type == "action" ? (
          <SpaceCommand
            superstate={props.superstate}
            action={props.path}
          ></SpaceCommand>
        ) : (
          <></>
        )
      ) : (
        <></>
      )}
    </>
  );
};
