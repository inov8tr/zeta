"use client";

import { useState, useTransition } from "react";

import { sendPasswordResetAction } from "@/app/(server)/user-actions";

interface SendPasswordResetButtonProps {
  userId: string;
  disabled?: boolean;
}

const SendPasswordResetButton = ({ userId, disabled }: SendPasswordResetButtonProps) => {
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await sendPasswordResetAction(userId);
      setStatus(result);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className="inline-flex items-center rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send password reset email"}
      </button>
      {status?.error ? <p className="text-xs text-red-600">{status.error}</p> : null}
      {status?.success ? <p className="text-xs text-brand-primary-dark">{status.success}</p> : null}
    </div>
  );
};

export default SendPasswordResetButton;

