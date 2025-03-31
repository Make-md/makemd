import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FrameSelectionProvider } from "core/react/context/FrameSelectionContext";
import { initiateString } from "core/utils/strings";
import _ from "lodash";
import { Superstate } from "makemd-core";

import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { parseDate } from "core/utils/date";
import React, { useContext, useEffect, useState } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { DBRow } from "shared/types/mdb";
import { URI } from "shared/types/path";
import { DayView } from "./CalendarView/DayView/DayView";
import { MonthView } from "./CalendarView/MonthView/MonthView";
import { WeekView } from "./CalendarView/WeekView/WeekView";
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
  viewType?: string;
}) => {
  const { pathState } = useContext(PathContext);
  const {
    predicate,
    editMode,
    setEditMode,
    dbSchema,
    tableData,
    data,
    updateRow,
  } = useContext(ContextEditorContext);
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

  const viewType = props.viewType ?? predicate?.view;
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
        viewType == "table" ||
        viewType == "db" ||
        (dbSchema?.primary != "true" && !frameSchema) ? (
          <TableView superstate={props.superstate}></TableView>
        ) : viewType == "day" ? (
          <DayView
            superstate={props.superstate}
            field={predicate.listViewProps?.start || "start"}
            fieldEnd={predicate.listViewProps?.end || "end"}
            fieldRepeat={predicate.listViewProps?.repeat}
            startHour={predicate.listViewProps?.startOfDay ?? 0}
            endHour={predicate.listViewProps?.endOfDay ?? 24}
            gutter
            date={
              predicate.listViewProps?.date &&
              parseDate(predicate.listViewProps.date)
            }
            header={predicate.listViewProps?.hideHeader != true}
            hourHeight={60}
            data={data}
            insertItem={(row: DBRow) => {
              updateRow(row, -1);
            }}
            updateItem={(row: DBRow) => {
              updateRow(row, parseInt(row._index));
            }}
          ></DayView>
        ) : viewType == "week" ? (
          <WeekView
            superstate={props.superstate}
            field={predicate.listViewProps?.start || "start"}
            fieldEnd={predicate.listViewProps?.end || "end"}
            fieldRepeat={predicate.listViewProps?.repeat}
            startHour={predicate.listViewProps?.startOfDay ?? 0}
            endHour={predicate.listViewProps?.endOfDay ?? 24}
            hourHeight={40}
            weekStart={
              predicate.listViewProps?.date &&
              parseDate(predicate.listViewProps.date)
            }
            header={predicate.listViewProps?.hideHeader != true}
            data={data}
            insertItem={(row: DBRow) => {
              updateRow(row, -1);
            }}
            updateItem={(row: DBRow) => {
              updateRow(row, parseInt(row._index));
            }}
          ></WeekView>
        ) : viewType == "month" ? (
          <MonthView
            superstate={props.superstate}
            data={data}
            field={predicate.listViewProps?.start || "start"}
            fieldEnd={predicate.listViewProps?.end || "end"}
            fieldRepeat={predicate.listViewProps?.repeat}
            date={
              predicate.listViewProps?.date &&
              parseDate(predicate.listViewProps.date)
            }
            header
            insertItem={(row: DBRow) => {
              updateRow(row, -1);
            }}
            updateItem={(row: DBRow) => {
              updateRow(row, parseInt(row._index));
            }}
          ></MonthView>
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
