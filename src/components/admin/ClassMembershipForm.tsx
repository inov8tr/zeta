"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { setClassMembershipAction, type UpdateClassMembershipState } from "@/app/(server)/class-actions";

type ClassOption = {
  id: string;
  name: string;
  level: string | null;
};

interface ClassMembershipFormProps {
  userId: string;
  currentClassId: string | null;
  classes: ClassOption[];
}

const initialState: UpdateClassMembershipState = { error: null, success: false, classId: null };

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
      className="inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-[10px] font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
};

const ClassMembershipForm = ({ userId, currentClassId, classes }: ClassMembershipFormProps) => {
  const [state, formAction] = useFormStateCompat(setClassMembershipAction, initialState);
  const [selectedClass, setSelectedClass] = React.useState<string>(currentClassId ?? "");
  const [justSaved, setJustSaved] = React.useState(false);

  React.useEffect(() => {
    setSelectedClass(currentClassId ?? "");
  }, [currentClassId]);

  React.useEffect(() => {
    if (state.success) {
      setJustSaved(true);
      const timer = window.setTimeout(() => setJustSaved(false), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-2 text-sm text-neutral-800">
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <select
          name="class_id"
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className="w-full rounded-2xl border border-brand-primary/20 px-3 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none sm:max-w-xs"
        >
          <option value="">Unassigned</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
              {classItem.level ? ` — Level ${classItem.level}` : ""}
            </option>
          ))}
        </select>
        <SubmitButton />
        {justSaved ? <span className="text-xs font-semibold uppercase text-brand-primary/80">Saved</span> : null}
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
};

export default ClassMembershipForm;
