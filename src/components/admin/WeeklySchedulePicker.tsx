"use client";

import * as React from "react";
import {
  Calendar as BigCalendar,
  Views,
  dateFnsLocalizer,
  type CalendarProps,
  type SlotInfo,
  type Formats,
} from "react-big-calendar";
import { addMinutes, format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";

import type { WeeklyScheduleEntry } from "@/utils/classSchedule";
import { normalizeScheduleEntries } from "@/utils/classSchedule";

import "react-big-calendar/lib/css/react-big-calendar.css";

type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  entry: WeeklyScheduleEntry;
};

interface WeeklySchedulePickerProps {
  value: WeeklyScheduleEntry[];
  onChange: (entries: WeeklyScheduleEntry[]) => void;
}

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const RBCalendar = BigCalendar as React.ComponentType<CalendarProps<CalendarEvent>>;

const startOfCurrentWeek = () => startOfWeek(new Date(), { weekStartsOn: 0 });

const entryToDates = (entry: WeeklyScheduleEntry) => {
  const base = startOfCurrentWeek();
  const [startHours, startMinutes] = entry.start.split(":").map(Number);
  const [endHours, endMinutes] = entry.end.split(":").map(Number);

  const start = new Date(base);
  start.setDate(base.getDate() + entry.day);
  start.setHours(startHours, startMinutes, 0, 0);

  const end = new Date(base);
  end.setDate(base.getDate() + entry.day);
  end.setHours(endHours, endMinutes, 0, 0);

  if (end <= start) {
    return { start, end: addMinutes(start, 60) };
  }

  return { start, end };
};

const slotsToEntry = (slot: SlotInfo): WeeklyScheduleEntry | null => {
  if (!slot.start || !slot.end) {
    return null;
  }
  const day = slot.start.getDay();
  const startTime = format(slot.start, "HH:mm");
  const endTime = format(slot.end, "HH:mm");
  if (startTime === endTime) {
    const adjustedEnd = format(addMinutes(slot.end, 60), "HH:mm");
    return { day, start: startTime, end: adjustedEnd };
  }
  return { day, start: startTime, end: endTime };
};

const buildEvents = (entries: WeeklyScheduleEntry[]): CalendarEvent[] =>
  entries.map((entry, index) => {
    const { start, end } = entryToDates(entry);
    return {
      id: `${entry.day}-${entry.start}-${entry.end}-${index}`,
      start,
      end,
      title: "Class session",
      entry,
    };
  });

const WeeklySchedulePicker = ({ value, onChange }: WeeklySchedulePickerProps) => {
  const [mounted, setMounted] = React.useState(false);
  const [entries, setEntries] = React.useState<WeeklyScheduleEntry[]>(() => normalizeScheduleEntries(value));

  React.useEffect(() => {
    setEntries(normalizeScheduleEntries(value));
  }, [value]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = React.useCallback(
    (nextEntries: WeeklyScheduleEntry[]) => {
      const normalized = normalizeScheduleEntries(nextEntries);
      setEntries(normalized);
      onChange(normalized);
    },
    [onChange],
  );

  const handleSelectSlot = React.useCallback(
    (slot: SlotInfo) => {
      const entry = slotsToEntry(slot);
      if (!entry) {
        return;
      }
      handleChange([...entries, entry]);
    },
    [entries, handleChange],
  );

  const handleSelectEvent = React.useCallback(
    (event: CalendarEvent) => {
      handleChange(entries.filter((item) => !(item.day === event.entry.day && item.start === event.entry.start && item.end === event.entry.end)));
    },
    [entries, handleChange],
  );

  const events = React.useMemo(() => buildEvents(entries), [entries]);
  const calendarFormats = React.useMemo<Partial<Formats>>(
    () => ({
      weekdayFormat: (date, culture, loc) => loc?.format(date, "EEE", culture) ?? format(date, "EEE"),
      dayFormat: (date, culture, loc) => loc?.format(date, "EEE", culture) ?? format(date, "EEE"),
      dayHeaderFormat: (date, culture, loc) => loc?.format(date, "EEE", culture) ?? format(date, "EEE"),
      dayRangeHeaderFormat: ({ start }, culture, loc) => loc?.format(start, "'Week of' MMM d", culture) ?? format(start, "'Week of' MMM d"),
    }),
    []
  );

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-brand-primary/10 bg-white/50 text-sm text-neutral-muted">
        Loading calendar…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RBCalendar
        localizer={localizer}
        events={events}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        toolbar={false}
        step={60}
        timeslots={1}
        selectable
        style={{ height: 280 }}
        defaultDate={startOfCurrentWeek()}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        min={new Date(1970, 1, 1, 7, 0, 0)}
        max={new Date(1970, 1, 1, 21, 0, 0)}
        popup={false}
        formats={calendarFormats}
      />
      <p className="text-xs text-neutral-muted">
        Click and drag to add a session. Blocks snap to one-hour increments; select an existing block to remove it.
      </p>
    </div>
  );
};

export default WeeklySchedulePicker;
