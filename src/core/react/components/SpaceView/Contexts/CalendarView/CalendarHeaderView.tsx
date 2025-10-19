import { formatDate } from "core/utils/date";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";

export const CalendarHeaderView = (props: {
  superstate: Superstate;
  date: Date;
  mode: "day" | "week" | "month";
  setDate: (date: Date) => void;
}) => {
  const monthString = formatDate(
    props.superstate.settings,
    props.date,
    props.mode == "day" ? "MMMM d" : "MMMM"
  );
  return (
    <div className="mk-calendar-header">
      <div className="mk-calendar-header-title">
        <span>{monthString}</span>
        {formatDate(props.superstate.settings, props.date, "yyyy")}
      </div>
      <span></span>
      <button
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//chevron-left"),
        }}
        onClick={() => {
          if (props.mode == "day") {
            props.setDate(
              new Date(props.date.setDate(props.date.getDate() - 1))
            );
            return;
          } else if (props.mode == "week") {
            props.setDate(
              new Date(props.date.setDate(props.date.getDate() - 7))
            );
            return;
          }
          props.setDate(
            new Date(props.date.setMonth(props.date.getMonth() - 1))
          );
        }}
      ></button>
      <button
        onClick={() => {
          props.setDate(new Date());
        }}
      >
        {i18n.labels.today}
      </button>
      <button
        onClick={() => {
          if (props.mode == "day") {
            props.setDate(
              new Date(props.date.setDate(props.date.getDate() + 1))
            );
            return;
          }
          if (props.mode == "week") {
            props.setDate(
              new Date(props.date.setDate(props.date.getDate() + 7))
            );
            return;
          }
          props.setDate(
            new Date(props.date.setMonth(props.date.getMonth() + 1))
          );
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//chevron-right"),
        }}
      ></button>
    </div>
  );
};
