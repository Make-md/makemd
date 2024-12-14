import {
  defaultDropAnimation,
  DragOverlay,
  useDndMonitor,
} from "@dnd-kit/core";
import { BlinkMode, openBlinkModal } from "core/react/components/Blink/Blink";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { PathPropertyName } from "core/types/context";
import { applySat } from "core/utils/color";
import {
  formatDate,
  getFreqValue,
  getWeekdayValue,
  isoDateFormat,
  parseDate,
} from "core/utils/date";
import {
  add,
  addHours,
  addMilliseconds,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { Superstate } from "makemd-core";
import React, { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RRule } from "rrule";
import { DBRow, DBRows } from "types/mdb";
import { safelyParseJSON } from "utils/parsers";
import { MonthDayCell } from "./MonthDayCell";
import { MonthWeekItem } from "./MonthWeekItem";

type MonthEventLayout = {
  index: number;
  startDay: number;
  endDay: number;
  allDay: boolean;
  offset?: number;
  startTime: number;
  endTime: number;
};

export const MonthWeekRow = (props: {
  superstate: Superstate;
  date: Date;
  events: DBRows;
  field: string;
  fieldEnd: string;
  fieldRepeat?: string;
  insertItem: (row: DBRow) => void;
  updateItem: (row: DBRow) => void;
}) => {
  const weekStart = startOfWeek(props.date);
  const weekEnd = endOfWeek(weekStart);
  const { source } = useContext(ContextEditorContext);
  const weekEvents: MonthEventLayout[] = useMemo(() => {
    const events: MonthEventLayout[] = [];
    props.events.forEach((event, index) => {
      const instances = [];
      const repeatDef = safelyParseJSON(event[props.fieldRepeat] as any);
      const rowDate = parseDate(event[props.field]);
      const rowEndDate = parseDate(event[props.fieldEnd]) ?? rowDate;
      if (rowDate <= endOfDay(weekEnd) && rowEndDate >= startOfDay(weekStart)) {
        instances.push(event);
      }

      if (repeatDef && repeatDef.freq) {
        const duration =
          parseDate(event[props.fieldEnd]).getTime() - rowDate.getTime();
        const rruleOptions = {
          dtstart: rowDate,
          freq: repeatDef.freq && getFreqValue(repeatDef.freq),
          count: repeatDef.count && Math.min(repeatDef.count, 100),
          interval: parseInt(repeatDef.interval),
          byweekday:
            repeatDef.byweekday &&
            repeatDef.byweekday.map((d: string) => getWeekdayValue(d)),
          until: parseDate(repeatDef.until),
          wkst: repeatDef.wkst && getWeekdayValue(repeatDef.wkst),
        };

        const rule = new RRule(
          Object.entries(rruleOptions)
            .filter(([key, value]) => value !== undefined)
            .reduce((obj, [key, value]) => {
              obj[key] = value;
              return obj;
            }, {} as Record<string, any>)
        );

        const starts: Date[] = rule.between(
          startOfDay(weekStart),
          endOfDay(weekEnd),
          true
        );
        starts.forEach((startDate) => {
          if (startDate.getTime() == rowDate.getTime()) return;
          instances.push({
            ...event,
            [props.field]: formatDate(
              props.superstate,
              startDate,
              isoDateFormat
            ),
            [props.fieldEnd]: formatDate(
              props.superstate,
              addMilliseconds(startDate, duration),
              isoDateFormat
            ),
          });
        });
      }
      instances.forEach((instance) => {
        const start = parseDate(instance[props.field]);
        const end =
          parseDate(instance[props.fieldEnd]) ??
          startOfDay(start).getTime() == start.getTime()
            ? startOfDay(start)
            : addHours(start, 1);
        const layoutStart = start > weekStart ? start : weekStart;
        const layoutEnd = end < weekEnd ? end : weekEnd;
        const startDay = layoutStart.getDay();
        const endDay = layoutEnd.getDay();
        events.push({
          index,
          startDay,
          endDay,
          startTime: start.getTime(),
          endTime: end.getTime(),
          allDay:
            (startOfDay(start).getTime() == start.getTime() &&
              startOfDay(end).getTime() == end.getTime()) ||
            startDay != endDay,
        });
      });
    });
    events.sort((a, b) => {
      if (a.startDay == b.startDay) {
        if (a.endDay == b.endDay) {
          return a.allDay ? -1 : 1;
        }
        return b.endDay - a.endDay;
      }
      return a.startDay - b.startDay;
    });
    return events.map((event, index, array) => {
      const offset = array.slice(0, index).reduce((acc, e) => {
        if (e.endDay >= event.startDay) {
          return acc + 1;
        }
        return acc;
      }, 0);
      return {
        ...event,
        offset,
      };
    });
  }, [
    props.events,
    props.fieldRepeat,
    props.field,
    props.fieldEnd,
    weekStart,
    weekEnd,
  ]);

  const [placeholderEvent, setPlaceholderEvent] =
    useState<MonthEventLayout>(null);
  const [dragStartDate, setDragStartDate] = useState<Date>(null);
  useDndMonitor({
    onDragStart: (event) => {
      if (event.active.data.current.type == "day") {
        setDragStartDate(new Date(event.active.data.current.date));
      }
    },
    onDragOver: (event) => {
      if (
        event.active?.data.current.type == "day" &&
        event.over?.data.current.type == "day"
      ) {
        const overDate = new Date(event.over?.data.current.date);
        const startDate = overDate > dragStartDate ? dragStartDate : overDate;
        const endDate = overDate > dragStartDate ? overDate : dragStartDate;

        if (startDate >= weekEnd || endDate <= weekStart) {
          setPlaceholderEvent(null);
          return;
        }
        const offset = weekEvents.reduce((acc, e) => {
          if (e.endDay >= weekEnd.getDay()) {
            return acc + 1;
          }
          return acc;
        }, 0);
        setPlaceholderEvent({
          offset,
          index: -1,
          startDay:
            weekStart < startDate ? startDate.getDay() : weekStart.getDay(),
          endDay: weekEnd > endDate ? endDate.getDay() : weekEnd.getDay(),
          allDay: false,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
        });
      }
    },
    onDragEnd: (event) => {
      if (
        placeholderEvent &&
        event.over?.data.current.weekStart == weekStart.getTime()
      ) {
        const startDate = formatDate(
          props.superstate,
          dragStartDate,
          "yyyy-MM-dd"
        );
        const endDate = formatDate(
          props.superstate,
          new Date(event.over.data.current.date),
          "yyyy-MM-dd"
        );

        openBlinkModal(
          props.superstate,
          BlinkMode.Open,
          window,
          (link) => {
            if (link) {
              props.insertItem({
                [PathPropertyName]: link,
                [props.field]: startDate,
                [props.fieldEnd]: endDate,
              });
            }
            setPlaceholderEvent(null);
          },
          source
        );
      } else {
        setPlaceholderEvent(null);
      }

      setDragStartDate(null);
    },
  });
  return (
    <div className="mk-month-week">
      {Array.from({ length: 7 }).map((_, index) => {
        const date = add(weekStart, { days: index });
        const isActiveMonth = date.getMonth() === props.date.getMonth();
        return (
          <MonthDayCell
            key={index}
            superstate={props.superstate}
            weekStart={weekStart}
            active={isActiveMonth}
            date={date}
            insertItem={() => {
              const latestEventEnd = weekEvents.reduce((acc, event) => {
                const newHour = parseDate(
                  props.events[event.index]
                )?.getHours();
                return newHour > acc ? newHour : acc;
              }, 9);
              const newStart = formatDate(
                props.superstate,
                addHours(startOfDay(date), latestEventEnd),
                isoDateFormat
              );
              const newEnd = formatDate(
                props.superstate,
                addHours(startOfDay(date), latestEventEnd + 1),
                isoDateFormat
              );
              const offset = weekEvents.reduce((acc, e) => {
                if (e.endDay >= index) {
                  return acc + 1;
                }
                return acc;
              }, 0);
              setPlaceholderEvent({
                offset,
                index: -1,
                startDay: index,
                endDay: index,
                startTime: startOfDay(date).getTime(),
                endTime: endOfDay(date).getTime(),
                allDay: false,
              });
              openBlinkModal(
                props.superstate,
                BlinkMode.Open,
                window,
                (link: string) => {
                  if (link) {
                    props.insertItem({
                      [PathPropertyName]: link,
                      [props.field]: newStart,
                      [props.fieldEnd]: newEnd,
                    });
                  }
                  setPlaceholderEvent(null);
                }
              );
            }}
          >
            {placeholderEvent?.startDay == index && (
              <MonthWeekItem
                superstate={props.superstate}
                index={-1}
                style={
                  {
                    "--block-bg-color": applySat(40, "#0098FF"),
                    "--block-color": "#0098FF",
                    "--block-text-color": "var(--mk-ui-text-accent)",
                    top: `${30}px`,
                    width: `${
                      (placeholderEvent.endDay -
                        placeholderEvent.startDay +
                        1) *
                      100
                    }%`,
                  } as React.CSSProperties
                }
                data={{ [PathPropertyName]: "New Event" }}
                startEvent={placeholderEvent.startTime}
                endEvent={placeholderEvent.endTime}
                allDay={false}
              ></MonthWeekItem>
            )}
            {weekEvents
              .filter((f) => f.startDay == index)
              .map((event, i) => {
                const collidesWithPlaceholderEvent = placeholderEvent
                  ? event.startDay <= placeholderEvent.endDay &&
                    event.endDay >= placeholderEvent.startDay
                  : false;
                return (
                  <MonthWeekItem
                    superstate={props.superstate}
                    key={i}
                    index={event.index}
                    startEvent={event.startTime}
                    endEvent={event.endTime}
                    allDay={event.allDay}
                    style={
                      {
                        "--block-bg-color": event.allDay
                          ? applySat(40, "#0098FF")
                          : "transparent",
                        "--block-color": "#0098FF",
                        "--block-text-color": event.allDay
                          ? "var(--mk-ui-text-accent)"
                          : "var(--mk-ui-text-primary)",
                        top: `${
                          event.offset * 22 +
                          30 +
                          (collidesWithPlaceholderEvent ? 22 : 0)
                        }px`,
                        width: `${(event.endDay - event.startDay + 1) * 100}%`,
                      } as React.CSSProperties
                    }
                    data={props.events[event.index]}
                  ></MonthWeekItem>
                );
              })}
          </MonthDayCell>
        );
      })}

      {dragStartDate &&
        createPortal(
          <DragOverlay dropAnimation={defaultDropAnimation}></DragOverlay>,
          document.body
        )}
    </div>
  );
};
