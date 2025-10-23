"use client";

import { useState, useTransition } from "react";

import { updateConsultationAction } from "@/app/(server)/consultation-actions";

interface SlotOption {
  id: string;
  label: string;
}

interface ConsultationActionsProps {
  consultationId: string;
  currentStatus: string;
  currentSlotId: string | null;
  slotOptions: SlotOption[];
}

const ConsultationActions = ({
  consultationId,
  currentStatus,
  currentSlotId,
  slotOptions,
}: ConsultationActionsProps) => {
  const [status, setStatus] = useState(currentStatus ?? "pending");
  const [selectedSlot, setSelectedSlot] = useState(currentSlotId ?? "");
  const [editedSlot, setEditedSlot] = useState(currentSlotId ?? "");
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const slotSummary =
    selectedSlot && slotOptions.length
      ? slotOptions.find((option) => option.id === selectedSlot)?.label ?? "Custom slot"
      : "No slot assigned";

  const handleStatusUpdate = (nextStatus: "pending" | "confirmed" | "cancelled") => {
    if (pending) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateConsultationAction({ consultationId, status: nextStatus });
      if (result?.error) {
        setError(result.error);
      } else {
        setStatus(nextStatus);
        setMessage(`Status updated to ${nextStatus}`);
      }
    });
  };

  const handleSaveSlot = () => {
    if (pending) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateConsultationAction({
        consultationId,
        slotId: editedSlot ? editedSlot : null,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSelectedSlot(editedSlot);
        setMessage("Slot updated");
        setIsEditingSlot(false);
      }
    });
  };

  const handleStartEdit = () => {
    setEditedSlot(selectedSlot);
    setIsEditingSlot(true);
    setMessage(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditedSlot(selectedSlot);
    setIsEditingSlot(false);
    setMessage(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-3 text-xs text-neutral-muted">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">Current slot</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary-dark">
            {slotSummary}
          </span>
          {isEditingSlot ? (
            <>
              <select
                value={editedSlot}
                disabled={pending}
                onChange={(event) => setEditedSlot(event.target.value)}
                className="rounded-full border border-brand-primary/30 px-3 py-1.5 text-sm text-brand-primary-dark focus:border-brand-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">No slot assigned</option>
                {slotOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={pending}
                className="inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={pending}
                className="inline-flex items-center rounded-full border border-brand-primary/40 px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center rounded-full border border-brand-primary px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit slot
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "confirmed" ? (
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !selectedSlot}
            onClick={() => handleStatusUpdate("confirmed")}
          >
            Confirm
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-brand-primary px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => handleStatusUpdate("pending")}
          >
            Mark pending
          </button>
        )}
        {status !== "cancelled" ? (
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-rose-300 px-3 py-1 text-[11px] font-semibold uppercase text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => handleStatusUpdate("cancelled")}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-brand-primary/40 px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => handleStatusUpdate("pending")}
          >
            Reopen
          </button>
        )}
      </div>

      {message && !error ? <p className="text-[11px] text-emerald-600">{message}</p> : null}
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
};

export default ConsultationActions;
