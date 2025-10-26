import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { NavigatorContext } from "core/react/context/SidebarContext";
import { DragProjection } from "core/utils/dnd/dragPath";
import { dropPathsInSpaceAtIndex } from "core/utils/dnd/dropPath";
import { isTouchScreen } from "core/utils/ui/screen";
import { Superstate } from "makemd-core";
import React, { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SortablePinnedSpaceItem } from "./Focus";
export const FocusSelector = (props: { superstate: Superstate }) => {
  const {
    focuses: focuses,
    modifier,
    setModifier,
    setFocuses: setFocuses,
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
    const focus = focuses.find((f, i) => i == overId);
    if (!focus) return;
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
  }, [overId, dragPaths, offset, modifier, focuses, activeId]);
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

  const dragStarted = (id: number) => {
    setActiveId(id);
  };
  const dragOver = (id: number, x: number) => {
    setOffset(x);
    if (activeId == null) {
      setOverId(id);
    } else {
      if (id == activeId) return;
      setFocuses(arrayMove(focuses, activeId, id));
      setActiveId(id);
    }
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
      const toIndex = overId;

      if (activeId !== null) {
        const fromIndex = activeId;
        setFocuses(arrayMove(focuses, fromIndex, toIndex));
      } else {
        setFocuses(
          focuses.map((f, i) =>
            i == toIndex ? { ...f, paths: [...f.paths, dragPaths[0]] } : f
          )
        );
      }
    }
    resetState();
  };

  // useDndMonitor({
  //   onDragStart: handleDragStart,
  //   onDragMove: handleDragMove,
  //   onDragOver: handleDragOver,
  //   onDragEnd: handleDragEnd,
  //   onDragCancel: handleDragCancel,
  // });

  function handleDragStart(event: DragStartEvent) {
    const {
      active: { id: activeId },
    } = event;
    if (event.active.data.current.type != "path") return;
    dragStarted(activeId as number);
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    // offset.current = { x: Math.max(1, delta.x), y: delta.y };
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overId = over?.id;
    if (overId !== null) {
      if (activeId == null) {
        setOverId(overId);
      } else {
        setFocuses(arrayMove(focuses, overId as number, parseInt(activeId)));
      }

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
  const width = isTouchScreen(props.superstate.ui) ? 48 : 32;
  const isTouch = isTouchScreen(props.superstate.ui);
  const menuRef = useRef<HTMLDivElement>();
  const calcXOffset = (index: number) => {
    if (!projected || projected.insert) return 0;
    const fromIndex = activeId;
    const targetIndex = overId;
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
        className="mk-focuses nav-header"
        onDragEnter={() => dragEnter()}
        onDragLeave={() => dragLeave()}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="mk-focuses-inner nav-buttons-container">
          {focuses.map((pin, i) => (
            <SortablePinnedSpaceItem
              id={i}
              superstate={props.superstate}
              highlighted={
                overId == i &&
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
              key={i}
              dragStart={dragStarted}
              dragOver={dragOver}
              dragEnded={dragEnded}
              dragActive={activeId !== null}
              ghost={activeId === i}
            ></SortablePinnedSpaceItem>
          ))}
          <div
            className="mk-waypoint-new"
            onClick={(e) => {
              const newFocuses = [
                ...focuses,
                { sticker: "ui//spaces", name: "", paths: [] },
              ];
              props.superstate.settings.currentWaypoint = newFocuses.length - 1;
              setFocuses(newFocuses);
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
          {isTouch && (
            <div
              className="mk-waypoint-menu"
              ref={menuRef}
              onClick={(e) => {
                props.superstate.ui.mainMenu(menuRef.current, props.superstate);
              }}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//options"),
              }}
            ></div>
          )}
          {overId != null && activeId === null && (
            <SortablePinnedSpaceItem
              id={focuses.length}
              superstate={props.superstate}
              highlighted={false}
              index={focuses.length}
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
                index={activeId}
                indicator={false}
                pin={focuses[activeId]}
              ></SortablePinnedSpaceItem>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </>
  );
};
