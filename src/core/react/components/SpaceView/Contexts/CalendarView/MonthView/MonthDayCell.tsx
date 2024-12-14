import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useCombinedRefs } from "core/react/hooks/useCombinedRef";
import { Superstate } from "makemd-core";
import React, { PropsWithChildren } from "react";

export const MonthDayCell = (
  props: PropsWithChildren<{
    superstate: Superstate;
    active: boolean;
    weekStart: Date;
    insertItem: () => void;
    date: Date;
  }>
) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: "day-" + props.date.getTime(),
    data: {
      type: "day",
      date: props.date.getTime(),
    },
  });
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: "day-" + props.date.getTime(),
    data: {
      type: "day",
      weekStart: props.weekStart.getTime(),
      date: props.date.getTime(),
    },
  });
  const isToday = props.date.toDateString() === new Date().toDateString();
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`mk-month-day ${props.active ? "mk-active" : "mk-inactive"} ${
        isToday ? "mk-today" : ""
      }`}
      onClick={(e) => {
        if (e.detail == 2) {
          props.insertItem();
        }
      }}
      style={{
        opacity: "1 !important",
      }}
    >
      <div className="mk-month-day-number">{props.date.getDate()}</div>
      {props.children}
    </div>
  );
};
