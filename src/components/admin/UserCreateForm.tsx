"use client";

import * as React from "react";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { createUserAction, type CreateUserState } from "@/app/(server)/user-actions";

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

interface UserCreateFormProps {
  classes: ClassOption[];
  classError?: string | null;
}

const initialState: CreateUserState = { error: null };

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Creating..." : "Create user"}
    </button>
  );
};

const useFormStateCompat: typeof useFormStateDom = ((action: unknown, initialValue: unknown) => {
  const useActionState = (React as unknown as { useActionState?: typeof useFormStateDom }).useActionState;
  if (typeof useActionState === "function") {
    // @ts-expect-error -- React.useActionState matches useFormState signature when available
    return useActionState(action, initialValue);
  }
  // @ts-expect-error -- upstream typings don't exactly match generic inference
  return useFormStateDom(action, initialValue);
}) as typeof useFormStateDom;

const UserCreateForm = ({ classes, classError }: UserCreateFormProps) => {
  const [state, formAction] = useFormStateCompat(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="name@example.com"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Full name</span>
          <input
            type="text"
            name="full_name"
            required
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Confirm password</span>
          <input
            type="password"
            name="confirm_password"
            required
            minLength={8}
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Role</span>
          <select
            name="role"
            defaultValue="student"
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
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Phone (optional)</span>
          <input
            type="tel"
            name="phone"
            placeholder="+82 10-0000-0000"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Assign class</span>
          <select
            name="class_id"
            defaultValue=""
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          >
            <option value="">Unassigned</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.level ? ` — Section ${item.level}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Initial test status</span>
          <input
            type="text"
            name="test_status"
            defaultValue="none"
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
              className="h-4 w-4 rounded border-brand-primary/40 text-brand-primary focus:ring-brand-primary"
            />
            <div className="space-y-1">
              <label htmlFor="classroom_enabled" className="text-sm font-semibold text-brand-primary-dark">
                Allow access to the Classes tab
              </label>
              <p className="text-xs text-neutral-muted">
                Enable this if the student should connect Google Classroom and see class assignments in their dashboard.
              </p>
            </div>
          </div>
        </label>
      </div>

      <p className="text-xs text-neutral-muted">
        Passwords must be at least eight characters. We will reuse an existing account with the same email if it already
        exists.
      </p>

      {classError ? <p className="text-xs text-amber-600">{classError}</p> : null}

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
};

export default UserCreateForm;
