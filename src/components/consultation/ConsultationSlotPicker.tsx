"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type CalendarProps,
  type DateRange,
  type Messages,
  type SlotInfo,
  Views,
  type View,
} from "react-big-calendar";
import {
  addMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";

import type { Database } from "@/lib/database.types";

import "react-big-calendar/lib/css/react-big-calendar.css";

type ConsultationSlot = Pick<
  Database["public"]["Tables"]["consultation_slots"]["Row"],
  "id" | "slot_date" | "start_time" | "end_time" | "is_booked"
>;

export type SlotSelection = {
  slotId: string;
  startIso: string;
  endIso: string;
};

type SlotEvent = {
  id: string;
  slotId: string;
  start: Date;
  end: Date;
  title: string;
  slotStartIso: string;
  slotEndIso: string;
};

type ConsultationSlotPickerProps = {
  label: string;
  value?: SlotSelection | null;
  onChange: (selection: SlotSelection | null) => void;
  contactPhone?: string;
  error?: string;
};

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

const combineDateAndTime = (dateString: string, time: string | null) => {
  const base = new Date(dateString);
  if (!time) {
    return base;
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return base;
  }
  base.setHours(hours, minutes, 0, 0);
  return base;
};

const DEFAULT_SLOT_MINUTES = 30;

const buildEvents = (rows: ConsultationSlot[]): SlotEvent[] =>
  rows
    .filter((slot) => Boolean(slot.slot_date) && slot.is_booked === false)
    .map((slot) => {
      const start = combineDateAndTime(slot.slot_date, slot.start_time);
      const endCandidate = combineDateAndTime(slot.slot_date, slot.end_time);
      const end = slot.end_time && isAfter(endCandidate, start) ? endCandidate : addMinutes(start, DEFAULT_SLOT_MINUTES);
      return {
        id: slot.id,
        slotId: slot.id,
        start,
        end,
        title: format(start, "EEE h:mma"),
        slotStartIso: start.toISOString(),
        slotEndIso: end.toISOString(),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

const RBCalendar = BigCalendar as React.ComponentType<CalendarProps<SlotEvent>>;

const CALENDAR_VIEWS: Partial<Record<View, boolean>> = {
  [Views.MONTH]: true,
  [Views.WEEK]: true,
};

const CALENDAR_MESSAGES: Partial<Messages> = {
  next: ">",
  previous: "<",
};

const deriveRangeForView = (currentView: View, referenceDate: Date) => {
  const baseDate = referenceDate instanceof Date ? referenceDate : new Date();

  if (currentView === Views.DAY) {
    return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
  }

  if (currentView === Views.WEEK) {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
    return { start: startOfDay(weekStart), end: endOfDay(weekEnd) };
  }

  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return { start: startOfDay(rangeStart), end: endOfDay(rangeEnd) };
};

const formatSelectedLabel = (isoString: string | null | undefined) => {
  if (!isoString) {
    return null;
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return format(parsed, "MMM d, h:mma");
};

const ConsultationSlotPicker = ({ label, value, onChange, contactPhone, error }: ConsultationSlotPickerProps) => {
  const [events, setEvents] = useState<SlotEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  const fetchSlots = useCallback(
    async (range: { start: Date; end: Date }) => {
      setLoading(true);
      setFeedback(null);
      try {
        const params = new URLSearchParams({
          start: format(range.start, "yyyy-MM-dd"),
          end: format(range.end, "yyyy-MM-dd"),
        });
        const response = await fetch(`/api/consultation-slots?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load available times.");
        }

        const payload: { slots?: ConsultationSlot[] } = await response.json();
        setEvents(buildEvents(payload.slots ?? []));
      } catch (err) {
        console.error(err);
        setFeedback("We couldn't load availability right now. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleRangeChange = useCallback(
    (range: DateRange | Date[]) => {
      let start: Date;
      let end: Date;
      if (Array.isArray(range)) {
        start = range[0] ? startOfDay(range[0]) : startOfDay(new Date());
        end = range[range.length - 1] ? endOfDay(range[range.length - 1]) : endOfDay(start);
      } else {
        start = startOfDay(range.start ?? new Date());
        end = endOfDay(range.end ?? range.start ?? new Date());
      }

      const nextRange = { start, end };
      void fetchSlots(nextRange);
    },
    [fetchSlots],
  );

  useEffect(() => {
    const initial = deriveRangeForView(view, currentDate);
    void fetchSlots(initial);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIso = value?.startIso ?? null;
  const selectedEventLabel = useMemo(() => formatSelectedLabel(selectedIso), [selectedIso]);

  const handleSelectEvent = useCallback(
    (event: SlotEvent) => {
      if (value && event.slotId === value.slotId) {
        onChange(null);
        return;
      }
      onChange({ slotId: event.slotId, startIso: event.slotStartIso, endIso: event.slotEndIso });
    },
    [onChange, value],
  );

  const eventPropGetter = useCallback(
    (event: SlotEvent) => {
      const isSelected = value ? event.slotId === value.slotId : false;
      if (isSelected) {
        return {
          className: "border-0 bg-brand-primary text-white shadow-md transition",
        };
      }
      return {
        className: "border border-brand-primary/30 bg-white text-brand-primary-dark hover:border-brand-primary",
      };
    },
    [value],
  );

  const hint =
    view === Views.MONTH
      ? "Select a day to jump into week view, then click an available time."
      : "Click a highlighted slot to choose it. Click again to remove it.";

  const availabilitySummary = useMemo(() => {
    if (loading) {
      return "Loading availability…";
    }
    if (events.length === 0) {
      return "No open slots in this view.";
    }
    return `${events.length} open slot${events.length === 1 ? "" : "s"} in view`;
  }, [events.length, loading]);

  const handleDrillDown = useCallback(
    (date: Date) => {
      setView(Views.WEEK);
      setCurrentDate(date);
      const nextRange = deriveRangeForView(Views.WEEK, date);
      void fetchSlots(nextRange);
    },
    [fetchSlots],
  );

  const handleSelectSlot = useCallback(
    (slot: SlotInfo) => {
      if (view !== Views.MONTH) {
        return;
      }
      const slotDate = new Date(slot.start.getTime());
      setView(Views.WEEK);
      setCurrentDate(slotDate);
      const nextRange = deriveRangeForView(Views.WEEK, slotDate);
      void fetchSlots(nextRange);
    },
    [fetchSlots, view],
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-sm font-medium text-neutral-800">{label}</span>
          <p className="text-xs text-neutral-500">{hint}</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{availabilitySummary}</div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-white">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-neutral-600">
            Loading…
          </div>
        ) : null}
        {mounted ? (
          <RBCalendar
            localizer={localizer}
            events={events}
            view={view}
            views={CALENDAR_VIEWS}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onRangeChange={handleRangeChange}
            selectable={view === Views.MONTH}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 420 }}
            step={30}
            timeslots={2}
            min={new Date(1970, 0, 1, 8)}
            max={new Date(1970, 0, 1, 20)}
            eventPropGetter={eventPropGetter}
            messages={CALENDAR_MESSAGES}
            drilldownView={Views.WEEK}
            onDrillDown={handleDrillDown}
          />
        ) : (
          <div className="flex h-[420px] items-center justify-center text-sm text-neutral-600">Loading calendar…</div>
        )}
      </div>
      {selectedEventLabel ? (
        <p className="text-sm font-medium text-brand-primary-dark">Selected: {selectedEventLabel}</p>
      ) : (
        <p className="text-sm text-neutral-600">Choose an available slot to continue.</p>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {feedback ? <p className="text-sm text-red-600">{feedback}</p> : null}
      <p className="text-xs text-neutral-500">
        {contactPhone
          ? `Can't find a time that works? Call us at ${contactPhone}.`
          : "Can't find an available time? Call us and we’ll do our best to help."}
      </p>
    </div>
  );
};

export default ConsultationSlotPicker;
