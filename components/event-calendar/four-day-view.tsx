"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  addDays,
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachHourOfInterval,
  format,
  getHours,
  getMinutes,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";

import {
  DraggableEvent,
  DroppableCell,
  EventItem,
  isMultiDayEvent,
  useCurrentTimeIndicator,
  WeekCellsHeight,
  type CalendarEvent,
} from "@/components/event-calendar";
import { StartHour, EndHour } from "@/components/event-calendar/constants";
import { cn } from "@/lib/utils";

interface FourDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
  onStarClick?: (event: CalendarEvent) => void;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export function FourDayView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  onStarClick,
}: FourDayViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Show 4 days starting from currentDate
  const days = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => addDays(currentDate, i));
  }, [currentDate]);

  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  // Get all-day events and multi-day events
  const allDayEvents = useMemo(() => {
    return events
      .filter((event) => {
        return event.allDay || isMultiDayEvent(event);
      })
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return days.some(
          (day) =>
            isSameDay(day, eventStart) ||
            isSameDay(day, eventEnd) ||
            (day > eventStart && day < eventEnd),
        );
      });
  }, [events, days]);

  // Process events for each day to calculate positions
  const processedDayEvents = useMemo(() => {
    const result = days.map((day) => {
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start);
        return (
          isSameDay(day, eventStart) &&
          !event.allDay &&
          !isMultiDayEvent(event)
        );
      });

      return processEventsForDay(dayEvents, day);
    });

    return result;
  }, [events, days]);

  // Calculate event positions to avoid overlaps
  function processEventsForDay(
    dayEvents: CalendarEvent[],
    day: Date,
  ): PositionedEvent[] {
    if (dayEvents.length === 0) return [];

    const sorted = [...dayEvents].sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      if (aStart !== bStart) return aStart - bStart;
      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();
      return bEnd - aEnd;
    });

    const positioned: PositionedEvent[] = [];
    const columns: Array<{ end: number; events: PositionedEvent[] }> = [];

    sorted.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const startMinutes =
        getHours(eventStart) * 60 + getMinutes(eventStart) - StartHour * 60;
      const duration = differenceInMinutes(eventEnd, eventStart);
      const top = (startMinutes / 60) * WeekCellsHeight;
      const height = Math.max((duration / 60) * WeekCellsHeight, 24);

      let column = columns.findIndex(
        (col) => col.end <= eventStart.getTime(),
      );
      if (column === -1) {
        column = columns.length;
        columns.push({ end: eventEnd.getTime(), events: [] });
      } else {
        columns[column].end = eventEnd.getTime();
      }

      const totalColumns = columns.length;
      const width = 100 / totalColumns;
      const left = (column / totalColumns) * 100;

      const positionedEvent: PositionedEvent = {
        event,
        top,
        height,
        left,
        width,
        zIndex: column,
      };

      positioned.push(positionedEvent);
      columns[column].events.push(positionedEvent);
    });

    return positioned;
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "week",
  );

  useEffect(() => {
    if (gridRef.current) {
      const scrollPosition = WeekCellsHeight * 6;
      gridRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border/70 grid border-b" style={{ gridTemplateColumns: "60px repeat(4, 1fr)" }}>
        <div className="border-border/70 border-r" />
        {days.map((day) => (
          <div
            key={day.toString()}
            className={cn(
              "border-border/70 border-r py-2 text-center last:border-r-0",
              isToday(day) && "bg-primary/5",
            )}
          >
            <div className={cn("text-xs", isToday(day) && "text-primary font-medium")}>
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "text-2xl font-semibold",
                isToday(day) && "text-primary",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {allDayEvents.length > 0 && (
        <div className="border-border/70 grid border-b" style={{ gridTemplateColumns: "60px repeat(4, 1fr)" }}>
          <div className="border-border/70 border-r p-2 text-right text-xs text-muted-foreground">
            All day
          </div>
          {days.map((day) => {
            const dayAllDayEvents = allDayEvents.filter((event) => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              return (
                isSameDay(day, eventStart) ||
                isSameDay(day, eventEnd) ||
                (day > eventStart && day < eventEnd)
              );
            });

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-border/70 border-r p-1 last:border-r-0",
                  isToday(day) && "bg-primary/5",
                )}
              >
                <div className="space-y-1">
                  {dayAllDayEvents.map((event) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    const isFirstDay = isSameDay(day, eventStart);
                    const isLastDay = isSameDay(day, eventEnd);

                    return (
                      <DraggableEvent
                        key={event.id}
                        event={event}
                        view="week"
                        onClick={(e) => handleEventClick(event, e)}
                        onStarClick={onStarClick}
                        isFirstDay={isFirstDay}
                        isLastDay={isLastDay}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={gridRef}
        className="relative flex-1 overflow-y-auto"
        style={{ height: `${WeekCellsHeight * (EndHour - StartHour)}px` }}
      >
        <div className="grid" style={{ gridTemplateColumns: "60px repeat(4, 1fr)" }}>
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour.toString()}
                className="border-border/70 relative border-b text-right"
                style={{ height: `${WeekCellsHeight}px` }}
              >
                <span className="text-muted-foreground absolute -top-2 right-2 text-xs">
                  {format(hour, "ha")}
                </span>
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div
              key={day.toString()}
              className={cn(
                "border-border/70 relative border-r last:border-r-0",
                isToday(day) && "bg-primary/5",
              )}
            >
              {hours.map((hour) => {
                const cellDate = new Date(day);
                cellDate.setHours(getHours(hour), 0, 0, 0);
                const cellId = `4day-cell-${cellDate.toISOString()}`;

                return (
                  <div
                    key={hour.toString()}
                    className="border-border/70 border-b"
                    style={{ height: `${WeekCellsHeight}px` }}
                  >
                    <DroppableCell
                      id={cellId}
                      date={cellDate}
                      onClick={() => onEventCreate(cellDate)}
                    >
                      <div className="h-full w-full" />
                    </DroppableCell>
                  </div>
                );
              })}

              {processedDayEvents[dayIndex].map((positioned) => (
                <div
                  key={positioned.event.id}
                  className="absolute"
                  style={{
                    top: `${positioned.top}px`,
                    height: `${positioned.height}px`,
                    left: `${positioned.left}%`,
                    width: `${positioned.width}%`,
                    zIndex: positioned.zIndex,
                  }}
                >
                  <div className="h-full px-0.5">
                    <DraggableEvent
                      event={positioned.event}
                      view="week"
                      onClick={(e) => handleEventClick(positioned.event, e)}
                      onStarClick={onStarClick}
                    />
                  </div>
                </div>
              ))}

              {isToday(day) && currentTimeVisible && (
                <div
                  className="absolute left-0 right-0 z-50"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="relative">
                    <div className="bg-primary absolute -left-1 -top-1 size-2 rounded-full" />
                    <div className="bg-primary h-0.5 w-full" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
