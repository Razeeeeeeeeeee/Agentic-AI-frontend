"use client";

import { useMemo } from "react";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { RiCalendarEventLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import {
  EventItem,
  getAgendaEventsForDay,
} from "@/components/event-calendar";
import type { CalendarEvent } from "@/components/event-calendar";

interface ScheduleViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onStarClick?: (event: CalendarEvent) => void;
  daysToShow?: number;
}

export function ScheduleView({
  currentDate,
  events,
  onEventSelect,
  onStarClick,
  daysToShow = 7, // Default to 7 days
}: ScheduleViewProps) {
  // Show events for the next N days
  const days = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) =>
      addDays(startOfDay(currentDate), i),
    );
  }, [currentDate, daysToShow]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Group events by time slots
  const timeSlots = useMemo(() => {
    const slots: Array<{ time: string; label: string }> = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        label: format(new Date(0, 0, 0, hour), "h a"),
      });
    }
    return slots;
  }, []);

  // Check if there are any events
  const hasEvents = days.some(
    (day) => getAgendaEventsForDay(events, day).length > 0,
  );

  return (
    <div className="flex-1 overflow-auto">
      {!hasEvents ? (
        <div className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
          <RiCalendarEventLine
            size={32}
            className="text-muted-foreground/50 mb-2"
          />
          <h3 className="text-lg font-medium">No events scheduled</h3>
          <p className="text-muted-foreground">
            There are no events scheduled for this time period.
          </p>
        </div>
      ) : (
        <div className="p-3 sm:p-6">
          {/* Days header - Only show on larger screens */}
          <div className="sticky top-0 z-10 bg-background pb-4 mb-4 border-b hidden md:block">
            <div className="grid gap-2 sm:gap-4" style={{ gridTemplateColumns: `80px repeat(${Math.min(daysToShow, 7)}, 1fr)` }}>
              <div className="text-xs font-medium text-muted-foreground">Time</div>
              {days.slice(0, 7).map((day) => {
                const dayEvents = getAgendaEventsForDay(events, day);
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "text-center transition-colors rounded-lg p-2",
                      isToday(day) && "bg-primary/10",
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium",
                        isToday(day) ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-semibold mt-1",
                        isToday(day) && "text-primary",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule grid */}
          <div className="space-y-6">
            {days.map((day) => {
              const dayEvents = getAgendaEventsForDay(events, day);

              if (dayEvents.length === 0) return null;

              // Group events by hour
              const eventsByHour = new Map<number, CalendarEvent[]>();
              dayEvents.forEach((event) => {
                const eventStart = new Date(event.start);
                const hour = event.allDay ? -1 : eventStart.getHours();
                
                if (!eventsByHour.has(hour)) {
                  eventsByHour.set(hour, []);
                }
                eventsByHour.get(hour)?.push(event);
              });

              return (
                <div key={day.toString()} className="space-y-2">
                  <div
                    className={cn(
                      "text-sm font-semibold sticky top-0 bg-background py-2 border-b z-[5]",
                      isToday(day) && "text-primary",
                    )}
                  >
                    {format(day, "EEEE, MMMM d, yyyy")}
                  </div>

                  {/* All-day events */}
                  {eventsByHour.has(-1) && (
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground mb-2 font-medium">
                        All Day
                      </div>
                      <div className="space-y-2 ml-20">
                        {eventsByHour.get(-1)?.map((event) => (
                          <EventItem
                            key={event.id}
                            event={event}
                            view="schedule"
                            onClick={(e) => handleEventClick(event, e)}
                            onStarClick={onStarClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timed events */}
                  <div className="space-y-3">
                    {Array.from(eventsByHour.entries())
                      .filter(([hour]) => hour !== -1)
                      .sort(([a], [b]) => a - b)
                      .map(([hour, events]) => (
                        <div key={hour} className="flex gap-4">
                          <div className="w-16 text-xs text-muted-foreground font-medium pt-1">
                            {format(new Date(0, 0, 0, hour), "h:mm a")}
                          </div>
                          <div className="flex-1 space-y-2">
                            {events.map((event) => (
                              <EventItem
                                key={event.id}
                                event={event}
                                view="schedule"
                                onClick={(e) => handleEventClick(event, e)}
                                onStarClick={onStarClick}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
