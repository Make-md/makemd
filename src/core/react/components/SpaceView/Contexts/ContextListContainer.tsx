import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FrameSelectionProvider } from "core/react/context/FrameSelectionContext";
import { Superstate } from "core/superstate/superstate";
import { initiateString } from "core/utils/strings";
import _ from "lodash";

import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import React, { useContext, useEffect, useState } from "react";
import { FrameEditorMode } from "types/mframe";
import { URI } from "types/path";
import { ContextListEditSelector } from "./ContextBuilder/ContextListEditSelector";
import { ContextListInstance } from "./ContextBuilder/ContextListInstance";
import {
  ContextListSections,
  ContextListView,
} from "./ContextBuilder/ContextListView";
import { FrameContainerView } from "./ContextBuilder/FrameContainerView";
import { FilterBar } from "./FilterBar/FilterBar";
import { TableView } from "./TableView/TableView";
export const ContextListContainer = (props: {
  superstate: Superstate;
  minMode?: boolean;
  showTitle?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  setView?: (view: string) => void;
}) => {
  const { pathState } = useContext(PathContext);
  const { predicate, editMode, setEditMode, dbSchema, tableData } =
    useContext(ContextEditorContext);
  const { frameSchema } = useContext(FramesMDBContext);
  const [editSection, setEditSection] = useState<ContextListSections>(null);
  const [selectedIndex, setSelectedIndex] = useState<string>(null);
  const [uris, setURIs] = useState<{
    listView: URI;
    listGroup: URI;
    listItem: URI;
  }>(
    predicate
      ? {
          listView: props.superstate.spaceManager.uriByString(
            initiateString(predicate.listView, "spaces://$kit/#*listView"),
            pathState.path
          ),
          listGroup: props.superstate.spaceManager.uriByString(
            initiateString(predicate.listGroup, "spaces://$kit/#*listGroup"),
            pathState.path
          ),
          listItem: props.superstate.spaceManager.uriByString(
            initiateString(predicate.listItem, "spaces://$kit/#*rowItem"),
            pathState.path
          ),
        }
      : null
  );
  useEffect(() => {
    if (!predicate) return;
    const newURIs = {
      listView: props.superstate.spaceManager.uriByString(
        initiateString(predicate.listView, "spaces://$kit/#*listView"),
        pathState.path
      ),
      listGroup: props.superstate.spaceManager.uriByString(
        initiateString(predicate.listGroup, "spaces://$kit/#*listGroup"),
        pathState.path
      ),
      listItem: props.superstate.spaceManager.uriByString(
        initiateString(predicate.listItem, "spaces://$kit/#*rowItem"),
        pathState.path
      ),
    };
    setURIs((p) => (!_.isEqual(newURIs, p) ? newURIs : p));
  }, [predicate, pathState]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key == "Escape") {
      setSelectedIndex(null);
    }
    if (e.key == "Enter") {
      return;
    }
    if (e.key == "ArrowDown") {
      setSelectedIndex((p) => {
        if (p == null) {
          return "0";
        } else {
          return (parseInt(p) + 1).toString();
        }
      });

      e.preventDefault();
    }
    if (e.key == "ArrowUp") {
      setSelectedIndex((p) => {
        if (p == null) {
          return null;
        } else if (p == "0") {
          return null;
        } else {
          return (parseInt(p) - 1).toString();
        }
      });
      e.preventDefault();
    }
    if (e.key == "ArrowLeft") {
    }
    if (e.key == "ArrowRight") {
    }
  };

  return tableData ? (
    <div className="mk-context-container">
      {!props.minMode && (
        <FilterBar
          showTitle={props.showTitle}
          superstate={props.superstate}
          setView={props.setView}
        ></FilterBar>
      )}

      {uris ? (
        predicate.view == "table" ||
        predicate.view == "db" ||
        (dbSchema?.primary != "true" && !frameSchema) ? (
          <TableView superstate={props.superstate}></TableView>
        ) : (
          <div className="mk-editor-context" onKeyDown={onKeyDown}>
            <FrameSelectionProvider
              superstate={props.superstate}
              id={"list"}
              editMode={
                editSection == "listView" ? editMode : FrameEditorMode.Read
              }
            >
              {editMode > 0 && (
                <ContextListEditSelector
                  editSection={editSection}
                  superstate={props.superstate}
                  setEditSection={setEditSection}
                  setEditMode={setEditMode}
                ></ContextListEditSelector>
              )}

              <FrameContainerView
                superstate={props.superstate}
                uri={uris.listView}
                cols={[]}
                editMode={
                  editSection == "listView" ? editMode : FrameEditorMode.Read
                }
              >
                <ContextListInstance
                  superstate={props.superstate}
                  id={"listView"}
                  type="listView"
                  uri={uris.listView}
                  props={{
                    _selectedIndex: selectedIndex,
                    ...predicate.listViewProps,
                  }}
                  propSetters={{ _selectedIndex: setSelectedIndex }}
                  containerRef={props.containerRef}
                  editMode={
                    editSection == "listView" ? editMode : FrameEditorMode.Read
                  }
                  cols={[]}
                  contexts={null}
                >
                  <ContextListView
                    superstate={props.superstate}
                    containerRef={props.containerRef}
                    editSection={editSection}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    groupURI={uris.listGroup}
                    itemURI={uris.listItem}
                  ></ContextListView>
                </ContextListInstance>
              </FrameContainerView>
            </FrameSelectionProvider>
          </div>
        )
      ) : (
        <></>
      )}
    </div>
  ) : (
    <></>
  );
};
