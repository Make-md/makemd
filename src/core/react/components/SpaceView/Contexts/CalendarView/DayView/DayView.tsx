import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { applySat } from "core/utils/color";
import {
  formatDate,
  getFreqValue,
  getWeekdayValue,
  isoDateFormat,
  parseDate,
} from "core/utils/date";
import { add, addMilliseconds, startOfDay } from "date-fns";
import { Superstate } from "makemd-core";
import { useContext, useEffect, useMemo, useState } from "react";
import { RRule } from "rrule";
import { PathPropertyName } from "shared/types/context";
import { DBRow, DBRows } from "shared/types/mdb";

import { BlinkMode } from "core/react/components/Blink/Blink";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import React from "react";
import { safelyParseJSON } from "utils/parsers";
import { CalendarHeaderView } from "../CalendarHeaderView";
import { AllDayItem } from "../WeekView/AllDayItem";
import { DayGutter } from "./DayGutter";
import { DayItem } from "./DayItem";

type EventBlock = {
  index: number;
  start?: Date;
  end?: Date;
  startOffset: number;
  endOffset: number;
  repeat?: boolean;
};

export type EventLayout = EventBlock & {
  leftOffset: number;
  widthPercentage: number;
  column: number;
  columnTotal: number;
  allDay?: boolean;
};

export const DayView = (props: {
  superstate: Superstate;
  date?: Date;
  header?: boolean;
  field?: string;
  fieldEnd?: string;
  data: DBRows;
  fieldRepeat?: string;
  gutter?: boolean;
  hourHeight?: number;
  startHour?: number;
  endHour?: number;
  insertItem?: (row: DBRow) => void;
  updateItem?: (row: DBRow) => void;
}) => {
  const { hourHeight } = props;
  const [date, setDate] = useState<Date>(props.date ?? startOfDay(new Date()));
  const { source } = useContext(ContextEditorContext);
  const [placeholderEvent, setPlaceholderEvent] = useState<EventLayout | null>(
    null
  );
  const containerId = `day-view-${date.toDateString()}`;
  const startHour = props.startHour ?? 0;
  const calculateEventBlocks = (
    events: DBRows,
    blockDate: Date,
    start: string,
    end: string,
    repeat: string
  ) => {
    if (!events || !start || !end) return [];
    const columnGroups: EventBlock[][] = [];

    const eventLayout: EventLayout[] = [];
    events.forEach((event, index) => {
      const repeatDef = safelyParseJSON(event[repeat]) as Record<string, any>;
      const instances = [];
      const rowDate = parseDate(event[start]);
      if (rowDate >= blockDate && rowDate <= add(blockDate, { days: 1 })) {
        instances.push(event);
      }

      if (repeatDef && repeatDef.freq) {
        const duration = parseDate(event[end]).getTime() - rowDate.getTime();
        const rruleOptions = {
          dtstart: rowDate,
          freq: repeatDef.freq && getFreqValue(repeatDef.freq),
          count: repeatDef.count && Math.min(parseInt(repeatDef.count), 100),
          interval: repeatDef.interval && parseInt(repeatDef.interval),
          byweekday:
            repeatDef.byweekday &&
            repeatDef.byweekday.map((d: string) => getWeekdayValue(d)),
          until:
            repeatDef.until &&
            new Date(
              Math.min(
                (
                  parseDate(repeatDef.until) ?? add(blockDate, { days: 1 })
                ).getTime(),
                add(blockDate, { days: 1 }).getTime()
              )
            ),
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
          blockDate,
          add(blockDate, { days: 1 }),
          true
        );
        starts.forEach((startDate) => {
          if (startDate.getTime() == rowDate.getTime()) return;
          instances.push({
            ...event,
            [start]: formatDate(props.superstate, startDate, isoDateFormat),
            [end]: formatDate(
              props.superstate,
              addMilliseconds(startDate, duration),
              isoDateFormat
            ),
          });
        });
      }

      instances.forEach((event) => {
        const dayStart = startOfDay(date).getTime();
        const dayEnd = add(date, { days: 1 }).getTime();
        const startDate = parseDate(event[start]);
        const endDate = parseDate(event[end])
          ? parseDate(event[end])
          : startOfDay(startDate).getTime() == startDate.getTime()
          ? startDate
          : add(startDate, { hours: 1 });

        const startOffset = Math.max(
          startHour * 60,
          (startDate.getTime() - dayStart) / 60000
        );
        const endOffset =
          Math.min(endDate.getTime() - dayStart, dayEnd - dayStart) / 60000;
        const allDay = startDate.getTime() == startOfDay(startDate).getTime();
        if (allDay) {
          eventLayout.push({
            index,
            start: startDate,
            end: endDate,
            startOffset: startHour * 60,
            endOffset: 60 * 24,
            leftOffset: 0,
            widthPercentage: 100,
            column: 0,
            columnTotal: 1,
            allDay: true,
          });
          return;
        }

        let placed = false;
        for (let i = 0; i < columnGroups.length; i++) {
          const group = columnGroups[i];
          const firstEventInGroup = group[0];
          if (
            startOffset >= firstEventInGroup.startOffset - 15 &&
            startOffset <= firstEventInGroup.startOffset + 15
          ) {
            group.push({
              index,
              start: startDate,
              end: endDate,
              repeat: !!repeatDef,
              startOffset,
              endOffset,
            });
            placed = true;
            break;
          }
        }

        if (!placed) {
          columnGroups.push([
            {
              index,
              repeat: !!repeatDef,
              start: startDate,
              end: endDate,
              startOffset,
              endOffset,
            },
          ]);
        }
      });
    });

    columnGroups.forEach((group, columnIndex) => {
      group.forEach((event, eventIndex) => {
        eventLayout.push({
          ...event,
          leftOffset: 0,
          widthPercentage: 100 / group.length,
          column: eventIndex,
          columnTotal: group.length,
        });
      });
    });

    eventLayout.sort((a, b) => a.startOffset - b.startOffset);

    for (let i = 0; i < eventLayout.length; i++) {
      for (let j = i + 1; j < eventLayout.length; j++) {
        if (
          eventLayout[i].column === eventLayout[j].column &&
          eventLayout[i].endOffset > eventLayout[j].startOffset &&
          eventLayout[i].startOffset < eventLayout[j].endOffset &&
          !eventLayout[i].allDay
        ) {
          eventLayout[j].leftOffset += 1;
        }
      }
    }

    return eventLayout;
  };

  const endHour = Math.min(props.endHour ? props.endHour + 1 : 24, 24);

  const eventBlocks: EventLayout[] = useMemo(
    () =>
      calculateEventBlocks(
        props.data,
        date,
        props.field,
        props.fieldEnd,
        props.fieldRepeat
      ),
    [props.data, date, props.field, props.fieldEnd, props.fieldRepeat]
  );

  const [active, setActive] = useState<number | null>(null);
  const [overPath, setOverPath] = useState<string | null>(null);
  const [offset, setOffset] = useState(null);

  const [cursorOffset, setCursorOffset] = useState(null);

  const reset = () => {
    setActive(null);
    setOverPath(null);
    setOffset(null);
    setCursorOffset(null);
  };
  const roundToQuarter = (_offset: number) => {
    return Math.round(_offset / 15) * 15;
  };

  useDndMonitor({
    onDragStart: (event) => {
      if (event.active.data.current.type !== "event") {
        return;
      }
      setActive(event.active.data.current.index);
      setPlaceholderEvent(null);
    },
    onDragOver: (event) => {
      if (event.over?.id != containerId) {
        return;
      }
      setActive(event.active.data.current.index);
      if (event.active.data.current.type === "event") {
        return;
      }
      const cursorY = (event.activatorEvent as any).clientY;
      const containerTop = event.over.rect.top;
      setCursorOffset(cursorY - containerTop);
      setOverPath(event.active?.data.current.path);
    },
    onDragMove: (e) => {
      if (e.over?.id != containerId) {
        return;
      }
      if (e.active.data.current.type != "event") {
        setOverPath(e.active?.data.current.path);
      }

      const containerRect = e.over.rect;
      const newY = e.delta.y;
      const roundedY = 2 * Math.round(newY / 2);
      if (offset !== roundedY) {
        setOffset(roundedY);
      }
    },
    onDragCancel: () => {
      reset();
    },
    onDragEnd: (event) => {
      if (
        event.active.data.current.type === "event" &&
        event.over?.id == containerId
      ) {
        const { index } = event.active.data.current;
        const _event = eventBlocks.find((f) => f.index == index);
        if (!_event) {
          reset();
          return;
        }
        const newStart = add(date, {
          minutes: Math.round(
            roundToQuarter(_event.startOffset + (offset / hourHeight) * 60)
          ),
        });
        const newEnd = add(date, {
          minutes: Math.round(
            roundToQuarter(_event.endOffset + (offset / hourHeight) * 60)
          ),
        });
        props.updateItem({
          ...props.data[index],
          [props.field]: formatDate(props.superstate, newStart, isoDateFormat),
          [props.fieldEnd]: formatDate(props.superstate, newEnd, isoDateFormat),
        });
      } else if (overPath) {
        const newStart = add(date, {
          minutes: Math.round((offset / hourHeight) * 60),
        });
        const newEnd = add(date, {
          minutes: Math.round((offset / hourHeight) * 60) + 60,
        });
        props.insertItem({
          [props.field]: formatDate(props.superstate, newStart, isoDateFormat),
          [props.fieldEnd]: formatDate(props.superstate, newEnd, isoDateFormat),
          [PathPropertyName]: overPath,
        });
      }
      reset();
    },
  });
  const { setNodeRef } = useDroppable({
    id: containerId,
    data: { type: "day-view", date },
  });
  const isToday = new Date().toDateString() === date.toDateString();
  const [nowOffset, setNowOffset] = useState(0);
  const activeEvent = eventBlocks.find((f) => f.index == active);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isToday) {
      setNowOffset(
        (new Date().getHours() - startHour) * 60 + new Date().getMinutes()
      );
      interval = setInterval(() => {
        setNowOffset(
          (new Date().getHours() - startHour) * 60 + new Date().getMinutes()
        );
      }, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);
  return (
    <div
      className="mk-day-view-container"
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
          mode={"day"}
          setDate={setDate}
        ></CalendarHeaderView>
      )}

      {props.gutter && (
        <div className="mk-day-view-all-day">
          <div className="mk-day-view-gutter">
            <div className="mk-day-view-hour-title">all day</div>
          </div>
          <div className="mk-day-view-hour">
            {eventBlocks
              .filter((f) => f.allDay)
              .map((event, i) => (
                <AllDayItem
                  superstate={props.superstate}
                  key={i}
                  index={event.index}
                  startDay={0}
                  endDay={0}
                  topOffset={0}
                  data={props.data[event.index]}
                  style={
                    {
                      position: "relative",
                      "--block-bg-color": applySat(40, "#0098FF"),
                      "--block-color": "#0098FF",
                    } as React.CSSProperties
                  }
                ></AllDayItem>
              ))}
          </div>
        </div>
      )}
      <div className="mk-day-view">
        {props.gutter && (
          <DayGutter
            hourHeight={hourHeight}
            startHour={startHour}
            endHour={endHour}
          ></DayGutter>
        )}
        <div
          className="mk-day-view-content"
          ref={setNodeRef}
          onMouseDown={(event) => {
            if (event.button != 0) return;
            const scrollOffset = event.currentTarget.scrollTop;
            const offset =
              event.clientY -
              event.currentTarget.getBoundingClientRect().top +
              scrollOffset;
            setPlaceholderEvent({
              index: -1,
              startOffset: roundToQuarter(
                (offset / hourHeight + startHour) * 60
              ),
              endOffset: roundToQuarter((offset / hourHeight + startHour) * 60),
              leftOffset: 0,
              widthPercentage: 100,
              column: 0,
              columnTotal: 1,
            });
          }}
          onMouseMove={(event) => {
            if (placeholderEvent) {
              const scrollOffset = event.currentTarget.scrollTop;
              const offset =
                event.clientY -
                event.currentTarget.getBoundingClientRect().top +
                scrollOffset;
              const newOffset = roundToQuarter(
                (offset / hourHeight + startHour) * 60
              );
              if (newOffset <= placeholderEvent.startOffset) {
                setPlaceholderEvent({
                  ...placeholderEvent,
                  startOffset: newOffset,
                });
              } else {
                setPlaceholderEvent({
                  ...placeholderEvent,
                  endOffset: newOffset,
                });
              }
              event.preventDefault();
            }
          }}
          onMouseUp={(event) => {
            if (
              !placeholderEvent ||
              placeholderEvent.startOffset == placeholderEvent.endOffset
            ) {
              setPlaceholderEvent(null);
              return;
            }
            const startTime = add(date, {
              minutes: placeholderEvent.startOffset,
            });
            const endTime = add(date, {
              minutes: placeholderEvent.endOffset,
            });
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            props.superstate.ui.quickOpen(
              BlinkMode.Open,
              rect,
              window,
              (path) => {
                if (!path) return;

                props.insertItem({
                  [props.field]: formatDate(
                    props.superstate,
                    startTime,
                    isoDateFormat
                  ),
                  [props.fieldEnd]: formatDate(
                    props.superstate,
                    endTime,
                    isoDateFormat
                  ),
                  [PathPropertyName]: path,
                });
              },
              source
            );
            setPlaceholderEvent(null);
          }}
        >
          {Array.from({ length: endHour - startHour }).map((_, hour) => (
            <div key={hour} className="mk-day-view-hour"></div>
          ))}
          {isToday && nowOffset > 0 && (
            <div
              className="mk-day-view-hour-current"
              style={{
                top: `${(nowOffset * hourHeight) / 60}px`,
              }}
            ></div>
          )}
          {eventBlocks
            .filter((f) => !f.allDay)
            .map((event, i) => (
              <DayItem
                superstate={props.superstate}
                key={i}
                event={event}
                item={props.data[event.index]}
                hourHeight={hourHeight}
                startHour={startHour}
                updateStartEnd={(startOffset, endOffset) => {
                  const newStart = add(date, {
                    minutes: startOffset,
                  });
                  const newEnd = add(date, {
                    minutes: endOffset,
                  });
                  props.updateItem({
                    ...props.data[event.index],
                    [props.field]: formatDate(
                      props.superstate,
                      newStart,
                      isoDateFormat
                    ),
                    [props.fieldEnd]: formatDate(
                      props.superstate,
                      newEnd,
                      isoDateFormat
                    ),
                  });
                }}
              ></DayItem>
            ))}
          {placeholderEvent &&
            placeholderEvent.endOffset > placeholderEvent.startOffset && (
              <DayItem
                superstate={props.superstate}
                event={placeholderEvent}
                item={{}}
                hourHeight={hourHeight}
                startHour={startHour}
                clone
              ></DayItem>
            )}
          {active !== null && activeEvent ? (
            <DayItem
              superstate={props.superstate}
              event={{
                ...activeEvent,
                start: null,
                end: null,
                startOffset: Math.round(
                  roundToQuarter(
                    activeEvent.startOffset + (offset / hourHeight) * 60
                  )
                ),
                endOffset: Math.round(
                  roundToQuarter(
                    activeEvent.endOffset + (offset / hourHeight) * 60
                  )
                ),
              }}
              item={props.data[active]}
              hourHeight={hourHeight}
              startHour={startHour}
              clone
            ></DayItem>
          ) : overPath ? (
            <DayItem
              superstate={props.superstate}
              event={{
                index: -1,
                startOffset: 0,
                endOffset: 60,
                leftOffset: 0,
                widthPercentage: 100,
                column: 0,
                columnTotal: 1,
              }}
              startHour={props.startHour}
              item={{
                [PathPropertyName]: overPath,
              }}
              hourHeight={hourHeight}
              style={{
                transform: `translateY(${offset + cursorOffset}px)`,
              }}
              clone
            ></DayItem>
          ) : null}
        </div>
      </div>
    </div>
  );
};
