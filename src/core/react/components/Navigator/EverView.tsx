import { ContextEditorProvider } from "core/react/context/ContextEditorContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import { PathProvider } from "core/react/context/PathContext";
import { SpaceProvider } from "core/react/context/SpaceContext";
import { Superstate } from "makemd-core";
import React, { useEffect, useState } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { ContextListContainer } from "../SpaceView/Contexts/ContextListContainer";
import { FilterBar } from "../SpaceView/Contexts/FilterBar/FilterBar";
import { showSpaceContextMenu } from "../UI/Menus/navigator/spaceContextMenu";
export const EverView = (props: { superstate: Superstate; path: string }) => {
  const ref = React.useRef(null);
  const [title, setTitle] = useState(
    props.superstate.spacesIndex.get(props.path)?.name
  );
  const [itemCount, setItemCount] = useState(
    [...(props.superstate.spacesMap.getInverse(props.path) ?? [])].length
  );
  const refreshTitle = () => {
    setTitle(props.superstate.spacesIndex.get(props.path)?.name);
    setItemCount(
      [...(props.superstate.spacesMap.getInverse(props.path) ?? [])].length
    );
  };
  useEffect(() => {
    refreshTitle();
  }, [props.path]);

  useEffect(() => {
    const conditionalRefresh = (payload: { path: string }) => {
      if (payload.path == props.path) {
        refreshTitle();
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      conditionalRefresh
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        conditionalRefresh
      );
    };
  }, []);

  return (
    <div ref={ref} className="mk-ever-view">
      <div className="mk-ever-view-header">
        <div className="mk-ever-view-header-title">
          <div className="mk-ever-view-title">{title}</div>
          <div className="mk-ever-view-count">{itemCount} items</div>
        </div>
        <button
          className="mk-toolbar-button"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//options"),
          }}
          onClick={(e) => {
            const pathState = props.superstate.pathsIndex.get(props.path);
            showSpaceContextMenu(props.superstate, pathState, e, null);
          }}
        ></button>
      </div>

      {props.path ? (
        <PathProvider
          superstate={props.superstate}
          path={"spaces://$overview"}
          readMode={true}
        >
          <SpaceProvider superstate={props.superstate}>
            <FramesMDBProvider
              superstate={props.superstate}
              contextSchema={defaultContextSchemaID}
              schema={"filesView"}
            >
              <ContextEditorProvider
                superstate={props.superstate}
                source={props.path}
              >
                <div className="mk-ever-view-filters">
                  <FilterBar
                    superstate={props.superstate}
                    minMode={true}
                  ></FilterBar>
                </div>
                <div className="mk-ever-view-contents">
                  <ContextListContainer
                    showTitle={false}
                    superstate={props.superstate}
                    minMode={true}
                    containerRef={ref}
                    setView={null}
                  ></ContextListContainer>
                </div>
              </ContextEditorProvider>
            </FramesMDBProvider>
          </SpaceProvider>
        </PathProvider>
      ) : (
        <div></div>
      )}
    </div>
  );
};
