"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState as useFormStateDom, useFormStatus } from "react-dom";

import { createClassAction, type CreateClassState } from "@/app/(server)/class-actions";
import WeeklySchedulePicker from "@/components/admin/WeeklySchedulePicker";
import {
  formatScheduleEntries,
  serializeScheduleEntries,
  type WeeklyScheduleEntry,
} from "@/utils/classSchedule";

type TeacherOption = {
  id: string;
  name: string | null;
};

type StudentOption = {
  user_id: string;
  full_name: string | null;
  class_id: string | null;
  class_name: string | null;
  username?: string | null;
};

interface CreateClassFormProps {
  teachers: TeacherOption[];
  students: StudentOption[];
}

const initialState: CreateClassState = { error: null, success: false, classId: null };

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
      {pending ? "Creating..." : "Create class"}
    </button>
  );
};

const CreateClassForm = ({ teachers, students }: CreateClassFormProps) => {
  const [state, formAction] = useFormStateCompat(createClassAction, initialState);
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [scheduleEntries, setScheduleEntries] = React.useState<WeeklyScheduleEntry[]>([]);
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const scheduleValue = React.useMemo(
    () => (scheduleEntries.length > 0 ? serializeScheduleEntries(scheduleEntries) : ""),
    [scheduleEntries],
  );
  const scheduleSummary = React.useMemo(() => formatScheduleEntries(scheduleEntries), [scheduleEntries]);
  const selectedStudentDetails = React.useMemo(
    () => students.filter((student) => selectedStudents.includes(student.user_id)),
    [students, selectedStudents],
  );

  React.useEffect(() => {
    if (state.success && state.classId) {
      router.push(`/dashboard/classes/${state.classId}`);
    } else if (state.success) {
      formRef.current?.reset();
      setScheduleEntries([]);
      setSelectedStudents([]);
      setSearchTerm("");
    }
  }, [state.success, state.classId, router]);

  const filteredStudents = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length === 0) {
      return students;
    }
    return students.filter((student) => {
      const haystack = `${student.full_name ?? ""} ${student.class_name ?? ""} ${student.username ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [students, searchTerm]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map((student) => student.user_id);
    setSelectedStudents((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearSelected = () => {
    setSelectedStudents([]);
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="schedule" value={scheduleValue} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Class name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Sapphire Cohort"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Section</span>
          <input
            type="text"
            name="level"
            placeholder="e.g. Discussion"
            className="rounded-2xl border border-brand-primary/20 px-4 py-2 text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-neutral-800 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Teacher</span>
          <select
            name="teacher_id"
            defaultValue=""
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

      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Weekly schedule</span>
          <p className="text-sm text-neutral-muted">
            Drag on the grid to add class sessions. Selecting multiple blocks adds each meeting time to the weekly schedule.
          </p>
        </div>
        <WeeklySchedulePicker value={scheduleEntries} onChange={setScheduleEntries} />
        <p className="text-xs text-neutral-muted">
          Summary: <span className="font-medium text-brand-primary-dark">{scheduleSummary}</span>
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Add students</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search students by name or class"
              className="w-full rounded-2xl border border-brand-primary/20 px-4 py-2 text-sm text-brand-primary-dark shadow-sm focus:border-brand-primary focus:outline-none sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="rounded-full border border-brand-primary px-3 py-1 font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10"
              >
                Add all shown
              </button>
              <button
                type="button"
                onClick={handleClearSelected}
                className="rounded-full border border-neutral-300 px-3 py-1 font-semibold uppercase text-neutral-600 transition hover:bg-neutral-100"
              >
                Clear selected
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-2xl border border-brand-primary/10">
          {filteredStudents.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-muted">No students match your search.</p>
          ) : (
            <ul className="divide-y divide-brand-primary/10">
              {filteredStudents.map((student) => {
                const checked = selectedStudents.includes(student.user_id);
                const hint = student.class_id ? `Currently in ${student.class_name ?? "another class"}` : "Unassigned";
                return (
                  <li key={student.user_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-neutral-800">
                    <label className="flex flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(student.user_id)}
                        className="mt-1 h-4 w-4 rounded border-brand-primary/40 text-brand-primary focus:ring-brand-primary"
                      />
                      <span>
                        <span className="block font-medium text-brand-primary-dark">{student.full_name ?? "Unnamed student"}</span>
                        <span className="block text-xs text-neutral-muted">{hint}</span>
                      </span>
                    </label>
                    {checked ? <span className="text-xs font-semibold uppercase text-brand-primary">Added</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-xs text-neutral-muted">
          Assign existing learners now or leave this blank and add them later. Selecting a student already in a class will move
          them here.
        </p>

        {selectedStudentDetails.length > 0 ? (
          <div className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-brand-primary/70">
              Selected students ({selectedStudentDetails.length})
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-neutral-700 sm:grid-cols-2">
              {selectedStudentDetails.map((student) => (
                <li key={student.user_id}>
                  {student.full_name ?? "Unnamed student"}
                  {student.class_id && student.class_name ? ` • moving from ${student.class_name}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedStudents.map((studentId) => (
        <input key={studentId} type="hidden" name="student_ids" value={studentId} />
      ))}

      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
};

export default CreateClassForm;
