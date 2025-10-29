"use client";

import { useTransition } from "react";

import { assignEntranceTestAction } from "@/app/(server)/test-actions";

interface AssignTestButtonProps {
  studentId: string;
}

const AssignTestButton = ({ studentId }: AssignTestButtonProps) => {
  const [pending, startTransition] = useTransition();

  const handleAssign = (followUp: boolean) => {
    startTransition(async () => {
      await assignEntranceTestAction({ studentId, followUp });
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleAssign(false)}
        disabled={pending}
        className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Assigning..." : "Assign Entrance Test"}
      </button>
      <button
        type="button"
        onClick={() => handleAssign(true)}
        disabled={pending}
        className="inline-flex items-center rounded-full border border-brand-accent px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-accent hover:text-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Assigning..." : "Assign Follow-up"}
      </button>
    </div>
  );
};

export default AssignTestButton;
