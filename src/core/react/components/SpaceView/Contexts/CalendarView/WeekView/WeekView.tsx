import { formatDate, isValidDate, parseDate } from "core/utils/date";
import { add, addDays, startOfDay, startOfWeek } from "date-fns";
import { Superstate } from "makemd-core";
import React, { useMemo, useState } from "react";
import { PathPropertyName } from "shared/types/context";
import { DBRow, DBRows } from "shared/types/mdb";
import { CalendarHeaderView } from "../CalendarHeaderView";
import { DayGutter } from "../DayView/DayGutter";
import { DayView } from "../DayView/DayView";
import { AllDayCell } from "./AllDayCell";
import { AllDayItem } from "./AllDayItem";

type AllDayLayout = {
  index: number;
  startDay: number;
  endDay: number;
  topOffset: number;
};

export const WeekView = (props: {
  superstate: Superstate;
  weekStart?: Date;
  data?: DBRows;
  field: string;
  fieldEnd: string;
  fieldRepeat: string;
  hourHeight?: number;
  header?: boolean;
  startHour?: number;
  endHour?: number;
  insertItem: (row: DBRow) => void;
  updateItem: (row: DBRow) => void;
}) => {
  const hourHeight = props.hourHeight;
  const [date, setDate] = useState<Date>(
    isValidDate(props.weekStart)
      ? startOfWeek(props.weekStart)
      : startOfWeek(new Date())
  );

  const startHour = props.startHour ?? 0;
  const endHour = props.endHour ?? 24;

  const [maxOffset, setMaxOffset] = useState(0);

  const allDayRows = useMemo(() => {
    const rows: AllDayLayout[] = [];
    props.data.forEach((row, index) => {
      const rowDate = parseDate(row[props.field]);
      const endDate = parseDate(row[props.fieldEnd]) ?? rowDate;
      if (
        endDate >= date &&
        rowDate <= add(date, { days: 7 }) &&
        startOfDay(rowDate).getTime() == rowDate.getTime() &&
        startOfDay(endDate).getTime() == endDate.getTime()
      )
        rows.push({
          index,
          startDay: new Date(
            Math.max(date.getTime(), rowDate.getTime())
          ).getDay(),
          endDay: new Date(
            Math.min(add(date, { days: 7 }).getTime(), endDate.getTime())
          ).getDay(),
          topOffset: 0,
        });
    });
    let _maxOffset = 0;
    rows.forEach((row, index) => {
      for (let i = 0; i < index; i++) {
        if (
          rows[i].startDay <= row.startDay &&
          rows[i].endDay >= row.endDay &&
          rows[i].topOffset == rows[index].topOffset
        ) {
          rows[index].topOffset += 1;
          _maxOffset = Math.max(_maxOffset, rows[index].topOffset);
        }
      }
    });
    setMaxOffset(_maxOffset);
    return rows;
  }, [props.data, date, props.field, props.weekStart]);
  return (
    <div
      className="mk-week-view"
      style={
        {
          "--hour-height": `${hourHeight}px`,
        } as React.CSSProperties
      }
    >
      {props.header && (
        <CalendarHeaderView
          superstate={props.superstate}
          date={date}
          mode="week"
          setDate={setDate}
        ></CalendarHeaderView>
      )}
      <div className="mk-week-view-header">
        <div className="mk-day-view-gutter"></div>
        {Array.from({ length: 7 }).map((_, day) => {
          return (
            <div key={day}>
              {formatDate(props.superstate, add(date, { days: day }), "EEE d")}
            </div>
          );
        })}
      </div>
      <div className="mk-week-view-all-day">
        <div className="mk-day-view-gutter">
          <div
            className="mk-day-view-hour-title"
            style={{
              height: `${maxOffset * 30}px`,
            }}
          >
            all day
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, day) => {
          return (
            <AllDayCell
              key={day}
              height={maxOffset + 1}
              superstate={props.superstate}
              date={addDays(date, day)}
              insertItem={(path: string) => {
                props.insertItem({
                  [props.field]: formatDate(
                    props.superstate,
                    addDays(date, day),
                    "yyyy-MM-dd"
                  ),
                  [props.fieldEnd]: formatDate(
                    props.superstate,
                    addDays(date, day),
                    "yyyy-MM-dd"
                  ),
                  [PathPropertyName]: path,
                });
              }}
            >
              {allDayRows
                .filter((f) => f.startDay == day)
                .map((row, i) => (
                  <AllDayItem
                    superstate={props.superstate}
                    data={props.data[row.index]}
                    index={row.index}
                    startDay={row.startDay}
                    endDay={row.endDay}
                    topOffset={row.topOffset}
                    key={i}
                  ></AllDayItem>
                ))}
            </AllDayCell>
          );
        })}
      </div>
      <div className="mk-week-view-content">
        <DayGutter
          hourHeight={hourHeight}
          startHour={startHour}
          endHour={endHour}
        />
        {Array.from({ length: 7 }).map((_, day) => {
          return (
            <DayView
              superstate={props.superstate}
              key={formatDate(props.superstate, add(date, { days: day }))}
              field={props.field}
              fieldEnd={props.fieldEnd}
              fieldRepeat={props.fieldRepeat}
              date={add(date, { days: day })}
              data={props.data}
              hourHeight={hourHeight}
              startHour={startHour}
              endHour={endHour}
              insertItem={(row: DBRow) => {
                props.insertItem(row);
              }}
              updateItem={(row: DBRow) => {
                props.updateItem(row);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
