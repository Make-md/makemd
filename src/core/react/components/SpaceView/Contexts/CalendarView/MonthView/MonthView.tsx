import { useDndMonitor } from "@dnd-kit/core";
import { addWeeks, endOfMonth, startOfMonth } from "date-fns";
import { Superstate } from "makemd-core";
import React, { useMemo, useState } from "react";
import { DBRow, DBRows } from "shared/types/mdb";
import { CalendarHeaderView } from "../CalendarHeaderView";
import { MonthWeekRow } from "./MonthWeekRow";

export const MonthView = (props: {
  superstate: Superstate;
  date?: Date;
  data: DBRows;
  header?: boolean;
  field: string;
  fieldEnd: string;
  fieldRepeat: string;
  insertItem: (row: DBRow) => void;
  updateItem: (row: DBRow) => void;
}) => {
  const [date, setDate] = useState<Date>(props.date ?? new Date());
  const monthWeeks = useMemo(() => {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);
    const weeks = [];
    let current = startDate;
    while (current <= endDate) {
      weeks.push(current);
      current = addWeeks(current, 1);
    }
    return weeks;
  }, [date]);
  const [active, setActive] = useState(null);
  useDndMonitor({
    onDragStart: (event) => {
      setActive(event.active.id);
    },
    onDragEnd: (event) => {
      setActive(null);
    },
  });
  return (
    <div className="mk-month-grid">
      {props.header && (
        <CalendarHeaderView
          superstate={props.superstate}
          date={date}
          setDate={setDate}
          mode="month"
        ></CalendarHeaderView>
      )}
      <div className="mk-month-header">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
      </div>
      {monthWeeks.map((weekDate, index) => (
        <MonthWeekRow
          key={index}
          superstate={props.superstate}
          date={weekDate}
          events={props.data}
          field={props.field}
          fieldEnd={props.fieldEnd}
          fieldRepeat={props.fieldRepeat}
          insertItem={props.insertItem}
          updateItem={props.updateItem}
        ></MonthWeekRow>
      ))}
    </div>
  );
};
