"use client";

import { useFormState, useFormStatus } from "react-dom";
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
      className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
};

const UserEditForm = ({ profile, classes }: UserEditFormProps) => {
  const [state, formAction] = useFormState(updateUserProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="user_id" value={profile.user_id} />

      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Full name</span>
          <input
            type="text"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone</span>
          <input
            type="tel"
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Role</span>
          <select
            name="role"
            defaultValue={(profile.role ?? "student").toLowerCase()}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Assigned class</span>
          <select
            name="class_id"
            defaultValue={profile.class_id ?? ""}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
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

        <label className="flex flex-col gap-2 text-sm text-neutral-700 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Test status</span>
          <input
            type="text"
            name="test_status"
            defaultValue={profile.test_status ?? ""}
            placeholder="e.g. none, assigned, completed"
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
          />
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
