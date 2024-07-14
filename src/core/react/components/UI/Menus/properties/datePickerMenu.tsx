import { UIManager } from "core/middleware/ui";
import { Anchors, Rect } from "types/Pos";

import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { CaptionProps, DayPicker, useNavigation } from "react-day-picker";

export enum DatePickerTimeMode {
  None,
  Toggle,
  Always,
}

export const showDatePickerMenu = (
  ui: UIManager,
  rect: Rect,
  win: Window,
  value: Date,
  setValue: (date: Date) => void,
  time: DatePickerTimeMode,
  format?: string,
  anchor?: Anchors
) => {
  return ui.openCustomMenu(
    rect,
    <DatePicker ui={ui} value={value} setValue={setValue} time={time} />,
    {},
    win,
    anchor
  );
};

const DatePickerHeader = (props: CaptionProps & { ui: UIManager }) => {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  return (
    <div className="mk-date-picker-header">
      <button
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        dangerouslySetInnerHTML={{
          __html: props.ui.getSticker("ui//chevron-left"),
        }}
      ></button>
      {format(props.displayMonth, "MMM yyy")}

      <button
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        dangerouslySetInnerHTML={{
          __html: props.ui.getSticker("ui//chevron-right"),
        }}
      ></button>
    </div>
  );
};

export const DatePicker = (props: {
  ui: UIManager;
  value: Date;
  setValue: (date: Date) => void;
  time?: DatePickerTimeMode;
}) => {
  const [hour, setHour] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [date, setDate] = useState(props.value);
  useEffect(() => {
    const date = props.value ?? new Date();
    setHour(date.getHours());
    setMinutes(date.getMinutes());
    setSeconds(date.getSeconds());
    setDate(date);
  }, [props.value]);

  const updateDate = () => {
    const newDate = new Date(date);
    if (props.time) {
      newDate.setHours(hour);
      newDate.setMinutes(minutes);
      newDate.setSeconds(seconds);
    }
    props.setValue(newDate);
  };

  return (
    <div className="mk-date-picker-container">
      <DayPicker
        defaultMonth={date}
        mode="single"
        selected={date}
        classNames={{
          root: "mk-date-picker",
          day: "mk-date-picker-day",
          cell: "mk-date-picker-cell",
          months: "mk-date-picker-months",
          month: "mk-date-picker-month",
          day_today: "mk-date-picker-today",
          day_selected: "mk-date-picker-selected",
        }}
        components={{
          Caption: (_props) => DatePickerHeader({ ui: props.ui, ..._props }),
        }}
        labels={{
          labelMonthDropdown: () => undefined,
          labelYearDropdown: () => undefined,
          labelNext: () => undefined,
          labelPrevious: () => undefined,
          labelDay: () => undefined,
          labelWeekday: () => undefined,
          labelWeekNumber: () => undefined,
        }}
        onSelect={(date: Date, s, a, e) => {
          setDate(date);
          props.setValue(date);
          e.stopPropagation();
        }}
      />
      {props.time != DatePickerTimeMode.None && (
        <div className="mk-date-picker-time">
          <div
            dangerouslySetInnerHTML={{
              __html: props.ui.getSticker("ui//clock"),
            }}
          ></div>
          <input
            type="text"
            value={hour.toString().padStart(2, "0")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                setHour((hour + 1) % 24);
                updateDate();
              } else if (e.key === "ArrowDown") {
                setHour((hour + 23) % 24);
                updateDate();
              }
            }}
            onChange={(e) => {
              setHour(+e.target.value);
              updateDate();
            }}
          />
          :
          <input
            type="text"
            value={minutes.toString().padStart(2, "0")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                setMinutes((minutes + 1) % 60);
                updateDate();
              } else if (e.key === "ArrowDown") {
                setMinutes((minutes + 59) % 60);
                updateDate();
              }
            }}
            onChange={(e) => {
              setMinutes(+e.target.value);
              updateDate();
            }}
          />
          <button
            className="mk-date-picker-meridiem"
            onClick={() => {
              setHour((hour + 12) % 24);
              updateDate();
            }}
          >
            {hour < 12 ? "AM" : "PM"}
          </button>
          <button
            onClick={() => updateDate()}
            dangerouslySetInnerHTML={{
              __html: props.ui.getSticker("ui//close"),
            }}
          ></button>
        </div>
      )}
    </div>
  );
};
