import { UIManager } from "core/middleware/ui";
import { Anchors, Rect } from "shared/types/Pos";

import { formatDate } from "core/utils/date";
import { addMonths, startOfDay } from "date-fns";
import i18n from "shared/i18n";
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
  setValue: (date: Date, hasTime: boolean) => void,
  time: DatePickerTimeMode,
  format?: string,
  anchor?: Anchors
) => {
  return ui.openCustomMenu(
    rect,
    <DatePicker ui={ui} value={value} setValue={setValue} time={time} />,
    { width: "280px", height: "280px" },
    win,
    anchor
  );
};

const DatePickerHeader = (
  props: CaptionProps & {
    ui: UIManager;
  }
) => {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const [inputMode, setInputMode] = useState(false);
  return (
    <div className="mk-date-picker-header">
      <button
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        dangerouslySetInnerHTML={{
          __html: props.ui.getSticker("ui//chevron-left"),
        }}
      ></button>
      {inputMode ? (
        <div className="mk-date-picker-header-input">
          <input
            type="text"
            value={props.displayMonth.getMonth() + 1}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                const newDate = addMonths(props.displayMonth, 1);
                goToMonth(newDate);
              } else if (e.key === "ArrowDown") {
                const newDate = addMonths(props.displayMonth, -1);
                goToMonth(newDate);
              }
            }}
            onChange={(e) => {
              const newDate = props.displayMonth;
              newDate.setMonth(+e.target.value - 1);
              goToMonth(newDate);
            }}
          />
          <input
            type="text"
            value={props.displayMonth.getFullYear()}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                const newDate = props.displayMonth;
                newDate.setFullYear(newDate.getFullYear() + 1);
                goToMonth(newDate);
              } else if (e.key === "ArrowDown") {
                const newDate = props.displayMonth;
                newDate.setFullYear(newDate.getFullYear() - 1);
                goToMonth(newDate);
              }
            }}
            onChange={(e) => {
              const newDate = props.displayMonth;
              newDate.setFullYear(+e.target.value);
              goToMonth(newDate);
            }}
          />
        </div>
      ) : (
        <div onClick={() => setInputMode(true)}>
          {formatDate(
            props.ui.superstate.settings,
            props.displayMonth,
            "MMM yyy"
          )}
        </div>
      )}

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
  setValue: (date: Date, hasTime: boolean) => void;
  time?: DatePickerTimeMode;
}) => {
  const [hour, setHour] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [date, setDate] = useState(props.value);
  const [mode, setMode] = useState(props.time == DatePickerTimeMode.Always);
  const [yearMode, setYearMode] = useState(false);
  const resetMode = () => {
    const date = props.value
      ? props.value
      : props.time == DatePickerTimeMode.None
      ? startOfDay(new Date())
      : new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    setHour(h);
    setMinutes(m);
    setSeconds(s);
    setDate(date);

    if (props.time == DatePickerTimeMode.Toggle) {
      if (h == 0 && m == 0 && s == 0 && !mode) {
      } else {
        setMode(true);
      }
    }
  };
  useEffect(() => {
    resetMode();
  }, [props.value, props.time]);
  useEffect(() => {
    resetMode();
  }, []);

  const updateDate = (time?: {
    y?: number;
    mo?: number;
    h?: number;
    m?: number;
    s?: number;
  }) => {
    const newDate = new Date(date);
    const h = time?.h ?? hour;
    const m = time?.m ?? minutes;
    const s = time?.s ?? seconds;
    if (time) {
      time.h !== undefined && setHour(time.h);
      time.m !== undefined && setMinutes(time.m);
      time.s !== undefined && setSeconds(time.s);
    }
    if (props.time) {
      newDate.setHours(h);
      newDate.setMinutes(m);
      newDate.setSeconds(s);
      if (h == 0 && m == 0 && s == 0) {
        setMode(false);
      }
    }
    if (time.y !== undefined) {
      newDate.setFullYear(time.y);
    }
    if (time.mo !== undefined) {
      newDate.setMonth(time.mo);
    }
    props.setValue(
      newDate,
      props.time != DatePickerTimeMode.None && !(h == 0 && m == 0 && s == 0)
    );
  };

  return (
    <div className="mk-date-picker-container">
      <DayPicker
        defaultMonth={date}
        mode="single"
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
          const newDate = date;

          if (mode) {
            newDate.setHours(hour);
            newDate.setMinutes(minutes);
            newDate.setSeconds(seconds);
          }
          setDate(newDate);
          props.setValue(
            newDate,
            props.time != DatePickerTimeMode.None &&
              !(hour == 0 && minutes == 0 && seconds == 0)
          );
          e.stopPropagation();
        }}
      />
      {mode ? (
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
                updateDate({ h: (hour + 1) % 24 });
              } else if (e.key === "ArrowDown") {
                updateDate({ h: (hour + 23) % 24 });
              }
            }}
            onChange={(e) => {
              updateDate({ h: +e.target.value });
            }}
          />
          :
          <input
            type="text"
            value={minutes.toString().padStart(2, "0")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                updateDate({ m: (minutes + 1) % 60 });
              } else if (e.key === "ArrowDown") {
                updateDate({ m: (minutes + 59) % 60 });
              }
            }}
            onChange={(e) => {
              updateDate({ m: +e.target.value });
            }}
          />
          <button
            className="mk-date-picker-meridiem"
            onClick={() => {
              updateDate({ h: (hour + 12) % 24 });
            }}
          >
            {hour < 12 ? "AM" : "PM"}
          </button>
          <button
            onClick={() => updateDate({ h: 0, m: 0, s: 0 })}
            dangerouslySetInnerHTML={{
              __html: props.ui.getSticker("ui//close"),
            }}
          ></button>
        </div>
      ) : props.time == DatePickerTimeMode.Toggle ? (
        <button onClick={() => setMode(true)}>{i18n.buttons.addTime}</button>
      ) : null}
    </div>
  );
};
