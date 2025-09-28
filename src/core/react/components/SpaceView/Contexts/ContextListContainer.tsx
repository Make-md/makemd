import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { FrameSelectionProvider } from "core/react/context/FrameSelectionContext";
import { initiateString } from "core/utils/strings";
import _ from "lodash";
import { Superstate } from "makemd-core";

import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { PathContext } from "core/react/context/PathContext";
import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import { parseDate } from "core/utils/date";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { DBRow } from "shared/types/mdb";
import { URI } from "shared/types/path";
import { Pos } from "shared/types/Pos";
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
  const flattenedItems = useRef<Record<string, [string, DBRow, Pos]>>({});
  const { pathState } = useContext(PathContext);
  const spaceManager = useSpaceManager();

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
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [uris, setURIs] = useState<{
    listView: URI;
    listGroup: URI;
    listItem: URI;
  }>(
    predicate
      ? {
          listView: spaceManager.uriByString(
            initiateString(predicate.listView, "spaces://$kit/#*listView"),
            pathState.path
          ),
          listGroup: spaceManager.uriByString(
            initiateString(predicate.listGroup, "spaces://$kit/#*listGroup"),
            pathState.path
          ),
          listItem: spaceManager.uriByString(
            initiateString(predicate.listItem, "spaces://$kit/#*rowItem"),
            pathState.path
          ),
        }
      : null
  );
  useEffect(() => {
    if (!predicate) return;
    
    const listViewUri = initiateString(predicate.listView, "spaces://$kit/#*listView");
    const listGroupUri = initiateString(predicate.listGroup, "spaces://$kit/#*listGroup");
    const listItemUri = initiateString(predicate.listItem, "spaces://$kit/#*rowItem");
    
    
    const newURIs = {
      listView: spaceManager.uriByString(listViewUri, pathState.path),
      listGroup: spaceManager.uriByString(listGroupUri, pathState.path),
      listItem: spaceManager.uriByString(listItemUri, pathState.path),
    };
    
    
    setURIs((p) => (!_.isEqual(newURIs, p) ? newURIs : p));
  }, [predicate, pathState, spaceManager]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key == "Escape") {
      setSelectedIndexes([]);
    }
    if (e.key == "Enter") {
      return;
    }
    const findNextIndex = (
      flattenedItems: Record<string, [string, DBRow, Pos]>,
      current: string,
      direction: string
    ): string => {
      const currentPos = flattenedItems?.[current]?.[2] ?? { x: 0, y: 0 };
      const nextIndex = Object.values(flattenedItems).reduce((p, f) => {
        const pos = f[2];
        if (direction == "right") {
          if (pos.x > currentPos.x) {
            return p == null
              ? f
              : pos.x <= p?.[2].x &&
                Math.abs(pos.y - currentPos.y) <=
                  Math.abs(currentPos.y - p?.[2].y)
              ? f
              : p;
          }
        }
        if (direction == "left") {
          if (pos.x < currentPos.x && pos.y == currentPos.y) {
            return p == null
              ? f
              : pos.x >= p?.[2].x &&
                Math.abs(pos.y - currentPos.y) <=
                  Math.abs(currentPos.y - p?.[2].y)
              ? f
              : p;
          }
        }
        if (direction == "down") {
          if (pos.y > currentPos.y) {
            return p == null
              ? f
              : pos.y <= p?.[2].y &&
                Math.abs(pos.x - currentPos.x) <=
                  Math.abs(currentPos.x - p?.[2].x)
              ? f
              : p;
          }
        }
        if (direction == "up") {
          if (pos.y < currentPos.y) {
            return p == null
              ? f
              : pos.y >= p?.[2].y &&
                Math.abs(pos.x - currentPos.x) <=
                  Math.abs(currentPos.x - p?.[2].x)
              ? f
              : p;
          }
        }
        return p;
      }, null as [string, DBRow, Pos] | null);
      return nextIndex ? nextIndex[0] : null;
    };
    if (e.key == "ArrowDown") {
      const lastIndex = selectedIndexes[selectedIndexes.length - 1];
      if (lastIndex) {
        const index = findNextIndex(flattenedItems.current, lastIndex, "down");
        if (index) setSelectedIndexes([index]);
      }
    }
    if (e.key == "ArrowUp") {
      const lastIndex = selectedIndexes[0];
      if (lastIndex) {
        const index = findNextIndex(flattenedItems.current, lastIndex, "up");
        if (index) setSelectedIndexes([index]);
      }
    }
    if (e.key == "ArrowLeft") {
      const lastIndex = selectedIndexes[0];
      if (lastIndex) {
        const index = findNextIndex(flattenedItems.current, lastIndex, "left");
        if (index) setSelectedIndexes([index]);
      }
    }
    if (e.key == "ArrowRight") {
    }
    const lastIndex = selectedIndexes[0];
    if (lastIndex) {
      const index = findNextIndex(flattenedItems.current, lastIndex, "right");
      if (index) setSelectedIndexes([index]);
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
                    _selectedIndexes: selectedIndexes,
                    ...predicate.listViewProps,
                  }}
                  propSetters={{}}
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
                    selectedIndexes={selectedIndexes}
                    setSelectedIndexes={setSelectedIndexes}
                    groupURI={uris.listGroup}
                    itemURI={uris.listItem}
                    flattenedItems={flattenedItems}
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
