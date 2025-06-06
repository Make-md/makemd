import { useDraggable } from "@dnd-kit/core";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { formatDate } from "core/utils/date";
import { Superstate } from "makemd-core";
import React, { useMemo } from "react";
import { PathPropertyName } from "shared/types/context";
import { DBRow } from "shared/types/mdb";

export const MonthWeekItem = (props: {
  superstate: Superstate;
  data: DBRow;
  index: number;
  startEvent: number;
  endEvent: number;
  allDay: boolean;
  repeat?: boolean;
  editRepeat?: (e: React.MouseEvent) => void;
  style: React.CSSProperties;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "event-" + props.index,
    data: {
      type: "event",
      index: props.index,
    },
  });
  const timeString = useMemo(() => {
    const startDate = new Date(props.startEvent);

    const startFormat = `h${startDate.getMinutes() == 0 ? "" : ":mm"} a`;
    return !props.allDay
      ? `${formatDate(props.superstate.settings, startDate, startFormat)}`
      : null;
  }, [props.startEvent, props.endEvent, props.allDay]);
  return (
    <div
      className="mk-month-event"
      ref={setNodeRef}
      style={props.style}
      {...attributes}
      {...listeners}
    >
      {!props.allDay && <div className="mk-day-block-inner-indicator"></div>}
      <PathCrumb
        superstate={props.superstate}
        path={props.data[PathPropertyName]}
        hideIcon
      />
      <div className="mk-day-block-time">{timeString}</div>
      {(props.repeat || props.editRepeat) && (
        <div
          onClick={(e) => props.editRepeat(e)}
          className={`mk-icon-xsmall mk-day-block-repeat ${
            !props.repeat && "mk-day-block-repeat-hover"
          }`}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//sync"),
          }}
        ></div>
      )}
    </div>
  );
};
