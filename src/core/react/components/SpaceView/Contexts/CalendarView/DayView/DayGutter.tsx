import React from "react";
import i18n from "shared/i18n";

export const DayGutter = (props: {
  hourHeight: number;
  startHour: number;
  endHour: number;
  allDay?: boolean;
}) => {
  return (
    <div className="mk-day-view-gutter">
      {props.allDay && <div className="mk-day-view-hour-title">{i18n.labels.allDay}</div>}
      {Array.from({ length: props.endHour - props.startHour + 1 }).map(
        (_, index) => {
          const hour = index + props.startHour;
          return (
            <div key={hour} className="mk-day-view-hour-title">
              <span>{hour % 12 === 0 ? 12 : hour % 12}</span>{" "}
              {hour < 12 ? "AM" : "PM"}
            </div>
          );
        }
      )}
    </div>
  );
};
