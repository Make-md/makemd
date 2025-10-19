import { ContextEditorProvider } from "core/react/context/ContextEditorContext";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { ContextListContainer } from "../../Contexts/ContextListContainer";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const ViewNodeView = (
  props: FrameNodeViewProps & { source?: string }
) => {
  const rawMdbFrameId = props.state?.props?.value; // References MDBFrame ID
  const mdbFrameId = rawMdbFrameId
    ? rawMdbFrameId.replace(/^["']|["']$/g, "")
    : null; // Remove quotes if present
  const sourcePath = useMemo(
    () =>
      props.state?.props?.context
        ? props.superstate.spaceManager.resolvePath(
            props.state?.props?.context,
            props.source
          )
        : props.source,
    [props.state, props.source]
  );

  const {
    selectionMode,
    select,
    selected: frameSelected,
    selection,
  } = useContext(FrameSelectionContext);
  const selected = selection?.includes(props.treeNode.node.id);

  const editable = useMemo(() => {
    if (selectionMode == FrameEditorMode.Read) return false;
    if (selectionMode == FrameEditorMode.Page) return true;
    if (selectionMode == FrameEditorMode.Group && selected) return true;
    if (props.treeNode.isRef) {
      if (props.treeNode.editorProps.linkedNode && frameSelected) return true;
      return false;
    }
    return true;
  }, [props.treeNode, selectionMode, frameSelected, selected]);

  // Log when selection mode changes
  useEffect(() => {}, [selectionMode, selected, editable]);
  // Create a new visualization MDBFrame

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {mdbFrameId ? (
        <PathProvider
          superstate={props.superstate}
          path={sourcePath}
          readMode={false}
        >
          <SpaceProvider superstate={props.superstate}>
            <FramesMDBProvider
              superstate={props.superstate}
              schema={mdbFrameId}
            >
              <ContextEditorProvider superstate={props.superstate}>
                <ContextListContainer
                  showTitle={false}
                  superstate={props.superstate}
                  minMode={props.state?.styles?.["--mk-min-mode"]}
                ></ContextListContainer>
              </ContextEditorProvider>
            </FramesMDBProvider>
          </SpaceProvider>
        </PathProvider>
      ) : editable ? (
        <></>
      ) : (
        <></>
      )}
    </div>
  );
};
