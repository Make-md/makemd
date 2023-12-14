import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  UniqueIdentifier,
  useDndMonitor,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import { toggleWaypoint } from "core/superstate/utils/spaces";
import { DragProjection } from "core/utils/dnd/dragPath";
import { dropPathsInSpaceAtIndex } from "core/utils/dnd/dropPath";
import { pathIsSpace } from "core/utils/spaces/space";
import React, { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { insert } from "utils/array";
import { SortablePinnedSpaceItem } from "./Waypoint";
export const SpaceSwitcher = (props: { superstate: Superstate }) => {
  const {
    waypoints: waypoints,
    modifier,
    setModifier,
  } = useContext(NavigatorContext);

  const { superstate } = props;

  const { dragPaths, setDragPaths } = useContext(NavigatorContext);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const dragCounter = useRef(0);
  const [offset, setOffset] = useState(0);
  const [projected, setProjected] = useState<DragProjection>(null);
  const [dropPlaceholder, setDragPlaceholder] = useState(null);
  useEffect(() => {
    if (overId === null || dragPaths.length == 0) {
      setProjected(null);
      return;
    }
    const waypoint = waypoints.find((f) => f.path == overId);
    if (!waypoint) return;
    if (dragPaths.length > 1) {
      if (waypoint.type == "space") {
        const _projected: DragProjection = {
          depth: 0,
          overId: overId,
          parentId: null,
          sortable: false,
          insert: true,
          droppable: true,
          copy: false,
          reorder: false,
        };
        setProjected(_projected);
        return;
      } else {
        return null;
      }
    } else {
      const insert =
        !activeId &&
        (!pathIsSpace(props.superstate, dragPaths[0]) ||
          modifier == "copy" ||
          modifier == "link");
      const _projected: DragProjection = {
        depth: 0,
        overId: overId,
        parentId: null,
        sortable: false,
        insert: insert,
        droppable: waypoint.type != "space",
        copy: modifier == "copy" || modifier == "link",
        reorder: false,
      };
      setProjected(_projected);
    }
  }, [overId, dragPaths, offset, modifier, waypoints, activeId]);
  const resetState = () => {
    setModifier(null);
    setOverId(null);
    setDragPaths([]);
    setActiveId(null);
    setProjected(null);
    setOffset(0);
    dragCounter.current = 0;
  };
  const handleDragCancel = () => {
    resetState();
  };
  const dragEnter = () => {
    dragCounter.current++;
  };
  const dragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current == 0) {
      setOverId(null);
      setProjected(null);
      setOffset(0);
      dragCounter.current = 0;
    }
  };
  const adjustTranslate: Modifier = ({ transform }) => {
    return {
      ...transform,
      x: transform.x,
      y: transform.y - 10,
    };
  };

  const dragStarted = (id: UniqueIdentifier) => {
    setActiveId(id);
  };
  const dragOver = (id: UniqueIdentifier, x: number) => {
    setOffset(x);
    setOverId(id);
  };
  const dragEnded = () => {
    if (projected && projected.insert) {
      const space = props.superstate.spacesIndex.get(overId);

      if (space)
        dropPathsInSpaceAtIndex(
          props.superstate,
          dragPaths,
          space.path,
          0,
          "link"
        );
    } else if (dragPaths.length == 1) {
      const toIndex = waypoints.findIndex((f) => f.path == overId);

      if (activeId !== null) {
        const fromIndex = waypoints.findIndex((f) => f.path == activeId);
        superstate.settings.waypoints = arrayMove(
          waypoints.map((f) => f.path),
          fromIndex,
          toIndex
        );
        superstate.saveSettings();
      } else {
        superstate.settings.waypoints = insert(
          waypoints.map((f) => f.path).filter((f) => f != dragPaths[0]),
          toIndex,
          dragPaths[0]
        );
        superstate.saveSettings();
      }
    }
    resetState();
  };

  useDndMonitor({
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  });

  function handleDragStart(event: DragStartEvent) {
    const {
      active: { id: activeId },
    } = event;
    const waypoint = waypoints.find((f) => f.path == activeId);
    if (waypoint) {
      setDragPaths([waypoint.path]);
    }
    dragStarted(activeId);
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    // offset.current = { x: Math.max(1, delta.x), y: delta.y };
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overId = over?.id;
    if (overId !== null) {
      setOverId(overId);

      // }
    }
  }
  function handleDragEnd({ active, over }: DragEndEvent) {
    dragEnded();
  }
  useEffect(() => {
    window.addEventListener("dragend", resetState);
    return () => {
      window.removeEventListener("dragend", resetState);
    };
  });
  const width = props.superstate.ui.getScreenType() == "mobile" ? 48 : 32;
  const calcXOffset = (index: number) => {
    if (!projected || projected.insert) return 0;
    const fromIndex = waypoints.findIndex((f) => f.path == activeId);
    const targetIndex = waypoints.findIndex((f) => f.path == overId);
    if (activeId === null) {
      if (index >= targetIndex) return width;
      return 0;
    }

    if (index == fromIndex) {
      return width * (targetIndex - fromIndex);
    } else if (index > fromIndex && index <= targetIndex) {
      return -width;
    } else if (index < fromIndex && index >= targetIndex) {
      return width;
    } else {
      return 0;
    }
  };
  return (
    <>
      <div
        className="mk-waypoints nav-header"
        onDragEnter={() => dragEnter()}
        onDragLeave={() => dragLeave()}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="nav-buttons-container">
          {waypoints.map((pin, i) => (
            <SortablePinnedSpaceItem
              id={pin.path}
              superstate={props.superstate}
              highlighted={
                overId == pin.path &&
                projected &&
                projected.insert &&
                projected.droppable
              }
              style={{
                transform: CSS.Translate.toString({
                  x: calcXOffset(i),
                  y: 0,
                  scaleX: 0,
                  scaleY: 0,
                }),
              }}
              index={i}
              pin={pin}
              key={pin.path}
              dragStart={dragStarted}
              dragOver={dragOver}
              dragEnded={dragEnded}
              dragActive={activeId !== null}
              ghost={activeId === pin.path}
            ></SortablePinnedSpaceItem>
          ))}
          <div
            className="mk-waypoint-new"
            onClick={(e) =>
              showSpacesMenu(
                e,
                props.superstate,
                (link) => {
                  toggleWaypoint(
                    props.superstate,
                    link,
                    false,
                    waypoints.length
                  );
                },
                true,
                true
              )
            }
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("lucide//plus"),
            }}
          ></div>
          {overId != null && activeId === null && (
            <SortablePinnedSpaceItem
              id={waypoints.length}
              superstate={props.superstate}
              highlighted={false}
              index={waypoints.length}
              pin={null}
            ></SortablePinnedSpaceItem>
          )}
        </div>
        {createPortal(
          <DragOverlay
            dropAnimation={null}
            modifiers={[adjustTranslate]}
            zIndex={1600}
          >
            {activeId !== null ? (
              <SortablePinnedSpaceItem
                id={-1}
                superstate={props.superstate}
                highlighted={false}
                clone
                index={waypoints.findIndex((f) => f.path == activeId)}
                indicator={false}
                pin={waypoints.find((f) => f.path == activeId)}
              ></SortablePinnedSpaceItem>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </>
  );
};
