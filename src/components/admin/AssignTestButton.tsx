"use client";

import { useTransition } from "react";

import { assignEntranceTestAction } from "@/app/(server)/test-actions";

interface AssignTestButtonProps {
  studentId: string;
}

const AssignTestButton = ({ studentId }: AssignTestButtonProps) => {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await assignEntranceTestAction({ studentId });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Assigning..." : "Assign Entrance Test"}
    </button>
  );
};

export default AssignTestButton;
