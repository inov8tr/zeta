"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { setClassMembershipAction, type UpdateClassMembershipState } from "@/app/(server)/class-actions";

type StudentOption = {
  user_id: string;
  full_name: string | null;
  class_id: string | null;
  class_name: string | null;
};

interface ClassAddStudentFormProps {
  classId: string;
  students: StudentOption[];
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

const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Adding..." : "Add student"}
    </button>
  );
};

const ClassAddStudentForm = ({ classId, students }: ClassAddStudentFormProps) => {
  const [state, formAction] = useFormStateCompat(setClassMembershipAction, initialState);
  const [selectedUser, setSelectedUser] = React.useState<string>("");

  React.useEffect(() => {
    if (state.success) {
      setSelectedUser("");
    }
  }, [state.success]);

  const selectedStudent = selectedUser.length > 0 ? students.find((item) => item.user_id === selectedUser) ?? null : null;
  const helperCopy =
    selectedUser.length > 0
      ? (() => {
          if (!selectedStudent) {
            return null;
          }
          if (!selectedStudent.class_id) {
            return "Currently unassigned.";
          }
          if (selectedStudent.class_id === classId) {
            return "Already in this class.";
          }
          return `Currently in ${selectedStudent.class_name ?? "another class"}. Adding will move them.`;
        })()
      : "Choose a student to add them to this class.";
  const disableSubmit = selectedUser.length === 0 || (selectedStudent?.class_id ?? null) === classId;

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
      <input type="hidden" name="class_id" value={classId} />
      <label className="flex flex-col gap-2 text-sm text-neutral-800">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Student</span>
        <select
          name="user_id"
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
          required
          className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.user_id} value={student.user_id}>
              {student.full_name ?? "Unnamed student"}
              {student.class_id ? ` — ${student.class_name ?? "Another class"}` : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-neutral-muted">{helperCopy}</p>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      <SubmitButton disabled={disableSubmit} />
    </form>
  );
};

export default ClassAddStudentForm;
