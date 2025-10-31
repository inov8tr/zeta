"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { setClassDetailsAction, type UpdateClassDetailsState } from "@/app/(server)/class-actions";

type TeacherOption = {
  id: string;
  name: string | null;
};

interface ClassDetailsFormProps {
  classId: string;
  initialName: string;
  initialLevel: string | null;
  initialTeacherId: string | null;
  teachers: TeacherOption[];
}

const initialState: UpdateClassDetailsState = { error: null, success: false, classId: null };

const useFormStateCompat: typeof useFormStateDom = ((action: unknown, initialValue: unknown) => {
  const useActionState = (React as unknown as { useActionState?: typeof useFormStateDom }).useActionState;
  if (typeof useActionState === "function") {
    // @ts-expect-error -- React.useActionState matches useFormState signature when available
    return useActionState(action, initialValue);
  }
  // @ts-expect-error -- upstream typings don't exactly match generic inference
  return useFormStateDom(action, initialValue);
}) as typeof useFormStateDom;

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
};

const ClassDetailsForm = ({ classId, initialName, initialLevel, initialTeacherId, teachers }: ClassDetailsFormProps) => {
  const [state, formAction] = useFormStateCompat(setClassDetailsAction, initialState);
  const [editing, setEditing] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(initialName);
  const [levelValue, setLevelValue] = React.useState(initialLevel ?? "");
  const [teacherValue, setTeacherValue] = React.useState(initialTeacherId ?? "");

  const teacherMap = React.useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher) => {
      map.set(teacher.id, teacher.name ?? "Unnamed teacher");
    });
    return map;
  }, [teachers]);

  React.useEffect(() => {
    setNameValue(initialName);
  }, [initialName]);

  React.useEffect(() => {
    setLevelValue(initialLevel ?? "");
  }, [initialLevel]);

  React.useEffect(() => {
    setTeacherValue(initialTeacherId ?? "");
  }, [initialTeacherId]);

  React.useEffect(() => {
    if (state.success) {
      setJustSaved(true);
      setEditing(false);
      const timer = window.setTimeout(() => setJustSaved(false), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.success]);

  if (!editing) {
    return (
      <div className="space-y-4">
        <dl className="grid gap-4 text-sm text-neutral-800 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Class name</dt>
            <dd className="mt-1 text-brand-primary-dark">{nameValue}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Section</dt>
            <dd className="mt-1 text-brand-primary-dark">{levelValue || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Teacher</dt>
            <dd className="mt-1 text-brand-primary-dark">
              {teacherValue ? teacherMap.get(teacherValue) ?? teacherValue : "Unassigned"}
            </dd>
          </div>
        </dl>
        {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {justSaved ? <p className="text-xs font-semibold uppercase text-brand-primary/70">Saved</p> : null}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10"
        >
          Edit details
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="class_id" value={classId} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Class name</span>
          <input
            type="text"
            name="name"
            required
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Section</span>
          <input
            type="text"
            name="level"
            value={levelValue}
            onChange={(event) => setLevelValue(event.target.value)}
            placeholder="e.g. Discussion"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Teacher</span>
          <select
            name="teacher_id"
            value={teacherValue}
            onChange={(event) => setTeacherValue(event.target.value)}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          >
            <option value="">Unassigned</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name ?? "Unnamed teacher"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success && justSaved ? (
        <p className="text-xs font-semibold uppercase text-brand-primary/70">Saved</p>
      ) : null}

      <SubmitButton />
    </form>
  );
};

export default ClassDetailsForm;
