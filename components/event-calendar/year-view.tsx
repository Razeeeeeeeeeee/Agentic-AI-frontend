"use client";

import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { cn } from "@/lib/utils";
import { getEventsForDay } from "@/components/event-calendar";
import type { CalendarEvent } from "@/components/event-calendar";

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export function YearView({
  currentDate,
  events,
  onEventSelect,
  onDateClick,
}: YearViewProps) {
  const months = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [currentDate]);

  const weekdays = useMemo(() => {
    return ["S", "M", "T", "W", "T", "F", "S"];
  }, []);

  const MonthGrid = ({ monthDate }: { monthDate: Date }) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: Date[][] = [];
    let week: Date[] = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7 || i === days.length - 1) {
        weeks.push(week);
        week = [];
      }
    }

    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-center text-xs font-semibold mb-2">
          {format(monthDate, "MMM")}
        </div>
        <div className="grid grid-cols-7 gap-px mb-1">
          {weekdays.map((day, i) => (
            <div
              key={i}
              className="text-center text-[9px] text-muted-foreground/60 h-4 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const dayEvents = getEventsForDay(events, day);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={day.toString()}
                onClick={() => {
                  if (isCurrentMonth) {
                    onDateClick?.(day);
                  }
                }}
                className={cn(
                  "relative h-7 w-full text-[10px] rounded-sm transition-colors",
                  "hover:bg-accent/50",
                  isToday(day) &&
                    "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
                  !isCurrentMonth && "text-muted-foreground/30",
                  isCurrentMonth && !isToday(day) && "text-foreground/80",
                )}
                disabled={!isCurrentMonth}
              >
                <span className="relative z-10">{format(day, "d")}</span>
                {hasEvents && isCurrentMonth && (
                  <div
                    className={cn(
                      "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full",
                      isToday(day) ? "bg-primary-foreground" : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto">
        {months.map((month) => (
          <div
            key={month.toString()}
            className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 hover:border-border hover:shadow-sm transition-all"
          >
            <MonthGrid monthDate={month} />
          </div>
        ))}
      </div>
    </div>
  );
}
