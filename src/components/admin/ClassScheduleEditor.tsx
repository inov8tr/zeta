"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import {
  setClassScheduleAction,
  type UpdateClassScheduleState,
} from "@/app/(server)/class-actions";
import WeeklySchedulePicker from "@/components/admin/WeeklySchedulePicker";
import {
  formatScheduleEntries,
  parseScheduleEntries,
  serializeScheduleEntries,
  type WeeklyScheduleEntry,
} from "@/utils/classSchedule";

const initialState: UpdateClassScheduleState = { error: null, success: false, classId: null };

const useFormStateCompat: typeof useFormStateDom = ((action: unknown, initialValue: unknown) => {
  const useActionState = (React as unknown as { useActionState?: typeof useFormStateDom }).useActionState;
  if (typeof useActionState === "function") {
    // @ts-expect-error -- React.useActionState matches useFormState signature when available
    return useActionState(action, initialValue);
  }
  // @ts-expect-error -- upstream typings don't exactly match generic inference
  return useFormStateDom(action, initialValue);
}) as typeof useFormStateDom;

const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save schedule"}
    </button>
  );
};

interface ClassScheduleEditorProps {
  classId: string;
  initialSchedule: string | null;
}

const ClassScheduleEditor = ({ classId, initialSchedule }: ClassScheduleEditorProps) => {
  const initialEntries = React.useMemo(() => parseScheduleEntries(initialSchedule), [initialSchedule]);
  const initialSerialized = React.useMemo(() => serializeScheduleEntries(initialEntries), [initialEntries]);
  const [entries, setEntries] = React.useState<WeeklyScheduleEntry[]>(initialEntries);
  const [state, formAction] = useFormStateCompat(setClassScheduleAction, initialState);
  const [justSaved, setJustSaved] = React.useState(false);

  React.useEffect(() => {
    setEntries(initialEntries);
  }, [initialSerialized, initialEntries]);

  React.useEffect(() => {
    if (state.success) {
      setJustSaved(true);
      const timer = window.setTimeout(() => setJustSaved(false), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.success]);

  const serialized = React.useMemo(() => serializeScheduleEntries(entries), [entries]);
  const dirty = serialized !== initialSerialized;
  const summary = formatScheduleEntries(entries);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="schedule" value={entries.length > 0 ? serialized : ""} />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Weekly schedule</h2>
        <p className="text-sm text-neutral-muted">
          Drag on the calendar to set the days and times for this class. Existing students will see this schedule in their
          timeline once you save.
        </p>
      </div>

      <WeeklySchedulePicker value={entries} onChange={setEntries} />

      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted">
        <span className="font-semibold uppercase text-brand-primary/80">Summary</span>
        <span>{summary}</span>
        {state.error ? <span className="text-red-600">{state.error}</span> : null}
        {state.success && justSaved ? (
          <span className="font-semibold uppercase text-brand-primary/80">Saved</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={!dirty} />
        <button
          type="button"
          onClick={() => setEntries([])}
          className="text-xs font-semibold uppercase text-neutral-500 transition hover:text-neutral-700"
        >
          Clear schedule
        </button>
      </div>
    </form>
  );
};

export default ClassScheduleEditor;
