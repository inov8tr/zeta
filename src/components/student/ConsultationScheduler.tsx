"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import ConsultationSlotPicker, { type SlotSelection } from "@/components/consultation/ConsultationSlotPicker";
import { scheduleConsultationSlotAction } from "@/app/(server)/consultation-actions";
import { formatDateTime } from "@/lib/formatDateTime";

type ExistingConsultation = {
  status: string | null;
  preferred_start: string | null;
  preferred_end: string | null;
};

type StudentConsultationSchedulerProps = {
  hasUpcoming: boolean;
  existingConsultation: ExistingConsultation | null;
  contactPhone?: string | null;
};

const StudentConsultationScheduler = ({
  hasUpcoming,
  existingConsultation,
  contactPhone,
}: StudentConsultationSchedulerProps) => {
  const router = useRouter();
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (hasUpcoming) {
      setStatus({
        error: "You already have an upcoming consultation. Contact support to make changes.",
      });
      return;
    }
    if (!selection) {
      setStatus({ error: "Select an available slot before scheduling." });
      return;
    }

    startTransition(async () => {
      const result = await scheduleConsultationSlotAction({
        slotId: selection.slotId,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setStatus(result);
      if (!result?.error) {
        setSelection(null);
        setNotes("");
        router.refresh();
      }
    });
  };

  const upcomingLabel =
    existingConsultation?.preferred_start &&
    formatDateTime(existingConsultation.preferred_start, undefined, { timeStyle: "short", dateStyle: "medium" });

  return (
    <section className="rounded-3xl border border-student-primary/20 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Schedule a consultation</h2>
          <p className="text-sm text-neutral-600">
            Pick an available time from the calendar below. We&rsquo;ll confirm by email once a teacher accepts the slot.
          </p>
        </div>
        {upcomingLabel ? (
          <span className="rounded-full bg-student-primary/10 px-3 py-1 text-xs font-semibold uppercase text-student-primary">
            Upcoming: {upcomingLabel}
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <ConsultationSlotPicker
          label="Pick a consultation time"
          value={selection}
          onChange={(next) => {
            setSelection(next);
            setStatus(null);
          }}
          contactPhone={contactPhone ?? undefined}
        />

        {hasUpcoming ? (
          <p className="text-sm text-neutral-600">
            You already have a consultation on the calendar. If you need to change it, please contact support before
            booking a new time.
          </p>
        ) : null}

        <div>
          <label htmlFor="consultation-notes" className="block text-sm font-medium text-neutral-700">
            Notes for your teacher <span className="text-neutral-500">(optional)</span>
          </label>
          <textarea
            id="consultation-notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-lightest px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-student-primary focus:outline-none focus:ring-2 focus:ring-student-primary/20 disabled:cursor-not-allowed"
            placeholder="Add any context you want your teacher to know before the meeting."
            disabled={isPending || hasUpcoming}
          />
        </div>

        {status?.error ? <p className="text-sm text-red-600">{status.error}</p> : null}
        {status?.success ? <p className="text-sm text-green-700">{status.success}</p> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || hasUpcoming}
            className="inline-flex items-center rounded-full bg-student-primary px-5 py-2 text-xs font-semibold uppercase text-white transition hover:bg-student-primary-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Scheduling…" : "Request this consultation"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default StudentConsultationScheduler;
