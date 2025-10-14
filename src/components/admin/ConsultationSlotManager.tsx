"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type CalendarProps,
  type DateRange,
  type SlotInfo,
  Views,
  type View,
} from "react-big-calendar";
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";

import type { Database } from "@/lib/database.types";

import "react-big-calendar/lib/css/react-big-calendar.css";

type SlotRow = Database["public"]["Tables"]["consultation_slots"]["Row"];

type SlotEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  variant: "booked" | "open" | "pending";
  pendingKey?: string;
};

type PendingSlot = {
  start: Date;
  end: Date;
};

type ConsultationSlotManagerProps = {
  initialSlots: SlotRow[];
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

const DEFAULT_SLOT_LENGTH_MINUTES = 30;

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

const buildSlotEvents = (rows: SlotRow[]): SlotEvent[] =>
  rows
    .filter((slot) => Boolean(slot.slot_date))
    .map((slot) => {
      const start = combineDateAndTime(slot.slot_date, slot.start_time);
      const endBase = combineDateAndTime(slot.slot_date, slot.end_time);
      const end =
        slot.end_time && isAfter(endBase, start)
          ? endBase
          : addMinutes(start, DEFAULT_SLOT_LENGTH_MINUTES);

      const variant: SlotEvent["variant"] = slot.is_booked ? "booked" : "open";

      return {
        id: slot.id,
        start,
        end,
        title: slot.is_booked ? "Booked consultation" : "Open slot",
        variant,
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

const formatTimeRange = (start: Date, end: Date) => `${format(start, "EEE, MMM d • h:mma")} – ${format(end, "h:mma")}`;

const formatSlotPayload = (slot: PendingSlot) => ({
  slot_date: format(slot.start, "yyyy-MM-dd"),
  start_time: format(slot.start, "HH:mm"),
  end_time: format(slot.end, "HH:mm"),
});

const stringifyKey = (slot: PendingSlot) => `${slot.start.toISOString()}|${slot.end.toISOString()}`;

const dedupePendingSlots = (slots: PendingSlot[]) => {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = stringifyKey(slot);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const RBCalendar = BigCalendar as React.ComponentType<CalendarProps<SlotEvent>>;

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

const ConsultationSlotManager = ({ initialSlots }: ConsultationSlotManagerProps) => {
  const [events, setEvents] = useState<SlotEvent[]>(() => buildSlotEvents(initialSlots));
  const [pendingSlots, setPendingSlots] = useState<PendingSlot[]>([]);
  const [deleteQueue, setDeleteQueue] = useState<string[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeRange, setActiveRange] = useState<{ start: Date; end: Date } | null>(
    deriveRangeForView(Views.MONTH, new Date()),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openEvents = useMemo(() => events.filter((event) => event.variant === "open"), [events]);
  const pendingEvents = useMemo<SlotEvent[]>(() => {
    if (pendingSlots.length === 0) {
      return [];
    }
    return pendingSlots.map((slot) => {
      const key = stringifyKey(slot);
      return {
        id: `pending-${key}`,
        start: slot.start,
        end: slot.end,
        title: "Pending slot",
        variant: "pending",
        pendingKey: key,
      };
    });
  }, [pendingSlots]);
  const calendarEvents = useMemo(() => [...events, ...pendingEvents], [events, pendingEvents]);

  const handleRangeChange = useCallback(
    async (range: DateRange | Date[]) => {
      let start: Date;
      let end: Date;
      if (Array.isArray(range)) {
        start = range[0] ? startOfDay(range[0]) : startOfDay(new Date());
        end = range[range.length - 1] ? endOfDay(range[range.length - 1]) : endOfDay(start);
      } else {
        start = startOfDay(range.start ?? new Date());
        end = endOfDay(range.end ?? range.start ?? new Date());
      }

      setActiveRange({ start, end });

      try {
        const params = new URLSearchParams({
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
        });
        const response = await fetch(`/api/consultation-slots?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load availability for the selected range.");
        }

        const payload: { slots: SlotRow[] } = await response.json();
        setEvents(buildSlotEvents(payload.slots));
      } catch (error) {
        console.error(error);
        setFeedback({
          tone: "error",
          message: "We couldn’t refresh slots for that range. Please try again.",
        });
      }
    },
    [],
  );

  const refreshRange = useCallback(async () => {
    const range = activeRange ?? deriveRangeForView(view, currentDate);
    await handleRangeChange(range);
  }, [activeRange, currentDate, handleRangeChange, view]);

  const handleRangeChangeEvent = useCallback((range: DateRange | Date[]) => {
    void handleRangeChange(range);
  }, [handleRangeChange]);

   const handleSelectSlot = useCallback(
     (slot: SlotInfo) => {
       if (view === Views.MONTH) {
         setView(Views.WEEK);
         setCurrentDate(slot.start);
         void handleRangeChange(deriveRangeForView(Views.WEEK, slot.start));
         return;
       }

       if (view === Views.WEEK || view === Views.DAY) {
         if (!isSameDay(slot.start, slot.end)) {
           setFeedback({
             tone: "info",
             message: "Please select a time range within a single day.",
           });
           return;
         }

         if (isBefore(slot.end, slot.start) || differenceInMinutes(slot.end, slot.start) <= 0) {
           setFeedback({
             tone: "info",
             message: "Slot selections need to have a start time before the end time.",
           });
           return;
         }

         const newSlot: PendingSlot = {
           start: slot.start,
           end: slot.end,
         };

         setPendingSlots((existing) => dedupePendingSlots([...existing, newSlot]));
         setFeedback({
           tone: "success",
           message: "Time range added. Review and publish to make it available for booking.",
         });
       }
     },
     [handleRangeChange, view],
   );

  const handleSelectEvent = useCallback(
    (event: SlotEvent) => {
      if (event.variant === "booked") {
        setFeedback({
          tone: "info",
          message: "Booked consultations can’t be removed from here.",
        });
        return;
      }

      if (event.variant === "pending" && event.pendingKey) {
        setPendingSlots((slots) => slots.filter((slot) => stringifyKey(slot) !== event.pendingKey));
        setFeedback({
          tone: "info",
          message: "Pending slot removed from publish queue.",
        });
        return;
      }

      setDeleteQueue((queue) => {
        if (queue.includes(event.id)) {
          return queue.filter((id) => id !== event.id);
        }
        return [...queue, event.id];
      });
    },
    [],
  );

   const handlePublish = useCallback(async () => {
     if (pendingSlots.length === 0) {
       setFeedback({
         tone: "info",
         message: "Select at least one time range before publishing.",
       });
       return;
     }

     setIsSaving(true);
     setFeedback(null);

     try {
       const response = await fetch("/api/consultation-slots", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           slots: pendingSlots.map((slot) => formatSlotPayload(slot)),
         }),
       });

       const payload = await response.json();

       if (!response.ok) {
         throw new Error(payload.error ?? "Unable to publish slots.");
       }

       setPendingSlots([]);
       await refreshRange();

       const insertedCount = Array.isArray(payload.inserted) ? payload.inserted.length : 0;
       const skipped = typeof payload.skipped === "number" ? payload.skipped : 0;

       const messageParts = [];
       if (insertedCount > 0) {
         messageParts.push(`${insertedCount} slot${insertedCount > 1 ? "s" : ""} published`);
       }
       if (skipped > 0) {
         messageParts.push(`${skipped} skipped as duplicates`);
       }

       setFeedback({
         tone: "success",
         message: messageParts.length > 0 ? messageParts.join(". ") : "Availability updated.",
       });
     } catch (error) {
       console.error(error);
       setFeedback({
         tone: "error",
         message: error instanceof Error ? error.message : "Unable to publish slots right now.",
       });
     } finally {
       setIsSaving(false);
     }
   }, [pendingSlots, refreshRange]);

   const handleRemove = useCallback(async () => {
     if (deleteQueue.length === 0) {
       setFeedback({
         tone: "info",
         message: "Select at least one open slot in the calendar to remove it.",
       });
       return;
     }

     setIsSaving(true);
     setFeedback(null);

     try {
       const response = await fetch("/api/consultation-slots", {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ ids: deleteQueue }),
       });

       const payload = await response.json();

       if (!response.ok) {
         throw new Error(payload.error ?? "Unable to remove slots.");
       }

       setDeleteQueue([]);
       await refreshRange();

       const removedCount = typeof payload.removed === "number" ? payload.removed : deleteQueue.length;

       setFeedback({
         tone: "success",
         message: `${removedCount} open slot${removedCount === 1 ? "" : "s"} removed.`,
       });
     } catch (error) {
       console.error(error);
       setFeedback({
         tone: "error",
         message: error instanceof Error ? error.message : "Unable to remove the selected slots.",
       });
     } finally {
       setIsSaving(false);
     }
   }, [deleteQueue, refreshRange]);

   const removePendingSlot = useCallback((index: number) => {
     setPendingSlots((slots) => slots.filter((_, slotIndex) => slotIndex !== index));
   }, []);

  const eventPropGetter = useCallback(
    (event: SlotEvent) => {
      if (event.variant === "booked") {
        return {
          className: "border-0 bg-brand-primary text-white",
        };
      }

      if (event.variant === "pending") {
        return {
          className: "border border-brand-accent bg-brand-accent/10 text-brand-accent-dark",
        };
      }

      const isSelectedForRemoval = deleteQueue.includes(event.id);
      if (isSelectedForRemoval) {
        return {
          className: "border border-red-400 bg-red-100 text-red-700",
        };
      }

      return {
        className: "border border-brand-primary/40 bg-white text-brand-primary-dark",
      };
    },
    [deleteQueue],
  );

   const weekToolbarHint =
     view === Views.MONTH
       ? "Select a day to jump into week view. Use the toolbar if you want to switch manually."
       : "Drag across the week grid to add new availability. Click an open slot to mark it for removal.";

   return (
     <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
       <div className="space-y-4">
         <div className="rounded-3xl border border-brand-primary/10 bg-white p-4 shadow-sm">
           <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
             <h2 className="text-lg font-semibold text-brand-primary-dark">Manage availability</h2>
             <p className="text-xs text-neutral-muted">{weekToolbarHint}</p>
           </div>
           <div className="mt-4 rounded-2xl border border-brand-primary/10">
             {mounted ? (
               <RBCalendar
                 localizer={localizer}
                 events={calendarEvents}
                 view={view}
                 onView={setView}
                 date={currentDate}
                 onNavigate={setCurrentDate}
                 onRangeChange={handleRangeChangeEvent}
                 selectable
                 onSelectSlot={handleSelectSlot}
                 onSelectEvent={handleSelectEvent}
                 startAccessor="start"
                 endAccessor="end"
                 style={{ height: "70vh" }}
                 step={30}
                 timeslots={2}
                 min={new Date(1970, 0, 1, 7)}
                 max={new Date(1970, 0, 1, 21)}
                 eventPropGetter={eventPropGetter}
               />
             ) : (
               <div className="flex h-[70vh] items-center justify-center text-sm text-neutral-600">Loading calendar…</div>
             )}
           </div>
         </div>
       </div>

       <aside className="space-y-6">
         {feedback ? (
           <div
             className={`rounded-3xl border p-4 text-sm shadow-sm ${
               feedback.tone === "success"
                 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                 : feedback.tone === "error"
                   ? "border-red-200 bg-red-50 text-red-700"
                   : "border-brand-primary/10 bg-brand-primary/5 text-brand-primary-dark"
             }`}
           >
             {feedback.message}
           </div>
         ) : null}

         <div className="rounded-3xl border border-brand-primary/10 bg-white p-4 shadow-sm">
           <h3 className="text-sm font-semibold text-brand-primary-dark">Selected to publish</h3>
           {pendingSlots.length === 0 ? (
             <p className="mt-2 text-xs text-neutral-muted">
               In week view, drag across the timetable to add new availability. Pending slots will show up here.
             </p>
           ) : (
             <ul className="mt-3 space-y-2 text-sm text-neutral-800">
               {pendingSlots.map((slot, index) => (
                 <li key={stringifyKey(slot)} className="flex items-center justify-between rounded-2xl bg-brand-primary/5 px-3 py-2">
                   <span>{formatTimeRange(slot.start, slot.end)}</span>
                   <button
                     type="button"
                     className="text-xs font-semibold uppercase text-brand-primary transition hover:text-brand-primary-dark"
                     onClick={() => removePendingSlot(index)}
                   >
                     Remove
                   </button>
                 </li>
               ))}
             </ul>
           )}
           <button
             type="button"
             className="mt-4 inline-flex w-full justify-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
             onClick={handlePublish}
             disabled={isSaving || pendingSlots.length === 0}
           >
             {isSaving ? "Saving…" : "Publish slots"}
           </button>
         </div>

         <div className="rounded-3xl border border-brand-primary/10 bg-white p-4 shadow-sm">
           <h3 className="text-sm font-semibold text-brand-primary-dark">Open slots</h3>
           <p className="mt-2 text-xs text-neutral-muted">
             Click an open slot in the calendar to mark it for removal. Booked consultations stay highlighted in blue.
           </p>
           <div className="mt-3 rounded-2xl bg-brand-primary/5 px-3 py-2 text-xs font-semibold uppercase text-brand-primary">
             {openEvents.length} open slot{openEvents.length === 1 ? "" : "s"}
           </div>
           <button
             type="button"
             className="mt-4 inline-flex w-full justify-center rounded-full border border-brand-primary/40 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
             onClick={handleRemove}
             disabled={isSaving || deleteQueue.length === 0}
           >
             {deleteQueue.length === 0 ? "Select slots to remove" : `Remove ${deleteQueue.length} slot${deleteQueue.length === 1 ? "" : "s"}`}
           </button>
         </div>
       </aside>
     </section>
   );
 };

 export default ConsultationSlotManager;
