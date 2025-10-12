"use client";

import { useTransition } from "react";

import { startTestAction } from "@/app/(server)/test-actions";

interface StartTestButtonProps {
  testId: string;
  status: string;
}

const StartTestButton = ({ testId, status }: StartTestButtonProps) => {
  const [pending, startTransition] = useTransition();

  const label = status === "in_progress" ? "Resume test" : "Start test";

  const handleClick = () => {
    startTransition(async () => {
      await startTestAction({ testId });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Loading..." : label}
    </button>
  );
};

export default StartTestButton;
