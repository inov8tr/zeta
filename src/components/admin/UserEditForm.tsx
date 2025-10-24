"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";
import { updateUserProfileAction, type UpdateUserProfileState } from "@/app/(server)/user-actions";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

interface ClassOption {
  id: string;
  name: string;
  level: string | null;
}

interface UserEditFormProps {
  profile: {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    role: string | null;
    class_id: string | null;
    test_status: string | null;
    classroom_enabled: boolean | null;
  };
  classes: ClassOption[];
}

const initialState: UpdateUserProfileState = { error: null };

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
};

const useFormStateCompat: typeof useFormStateDom = ((action: unknown, initialState: unknown) => {
  const useActionState = (React as unknown as { useActionState?: typeof useFormStateDom }).useActionState;
  if (typeof useActionState === "function") {
    // @ts-expect-error -- React.useActionState matches useFormState signature when available
    return useActionState(action, initialState);
  }
  // @ts-expect-error -- upstream typings don't exactly match generic inference
  return useFormStateDom(action, initialState);
}) as typeof useFormStateDom;

const UserEditForm = ({ profile, classes }: UserEditFormProps) => {
  const [state, formAction] = useFormStateCompat(updateUserProfileAction, initialState);
  const [roleValue, setRoleValue] = React.useState((profile.role ?? "student").toLowerCase());
  const classroomEnabled = Boolean(profile.classroom_enabled);
  const allowClassroomToggle = roleValue === "student";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="user_id" value={profile.user_id} />

      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Full name</span>
          <input
            type="text"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Phone</span>
          <input
            type="tel"
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Role</span>
          <select
            name="role"
            defaultValue={(profile.role ?? "student").toLowerCase()}
            onChange={(event) => setRoleValue(event.target.value)}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Assigned class</span>
          <select
            name="class_id"
            defaultValue={profile.class_id ?? ""}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          >
            <option value="">Unassigned</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.level ? ` — Level ${item.level}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Test status</span>
          <input
            type="text"
            name="test_status"
            defaultValue={profile.test_status ?? ""}
            placeholder="e.g. none, assigned, completed"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Classes tab</span>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-primary/10 bg-brand-primary/5 px-4 py-3">
            <input
              type="checkbox"
              name="classroom_enabled"
              id="classroom_enabled"
              defaultChecked={classroomEnabled}
              disabled={!allowClassroomToggle}
              className="h-4 w-4 rounded border-brand-primary/40 text-brand-primary focus:ring-brand-primary disabled:border-neutral-300 disabled:text-neutral-400"
            />
            <div className="space-y-1">
              <label htmlFor="classroom_enabled" className="text-sm font-semibold text-brand-primary-dark">
                Allow access to the Classes tab
              </label>
              <p className="text-xs text-neutral-muted">
                {allowClassroomToggle
                  ? "Enable this if the student should connect Google Classroom and see assignments."
                  : "This option is only available for student accounts."}
              </p>
            </div>
          </div>
        </label>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
};

export default UserEditForm;
