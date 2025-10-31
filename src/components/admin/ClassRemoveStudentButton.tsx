"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { setClassMembershipAction, type UpdateClassMembershipState } from "@/app/(server)/class-actions";

interface ClassRemoveStudentButtonProps {
  userId: string;
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
      className="text-xs font-semibold uppercase text-brand-primary transition hover:text-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
};

const ClassRemoveStudentButton = ({ userId }: ClassRemoveStudentButtonProps) => {
  const [state, formAction] = useFormStateCompat(setClassMembershipAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="class_id" value="" />
      <SubmitButton />
      {state.error ? <p className="text-[10px] text-red-600">{state.error}</p> : null}
    </form>
  );
};

export default ClassRemoveStudentButton;
