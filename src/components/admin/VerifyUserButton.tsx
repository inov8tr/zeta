"use client";

import { useState, useTransition } from "react";

import { verifyUserEmailAction } from "@/app/(server)/user-actions";

interface VerifyUserButtonProps {
  userId: string;
  emailConfirmed: boolean;
}

const VerifyUserButton = ({ userId, emailConfirmed }: VerifyUserButtonProps) => {
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (emailConfirmed) {
    return null;
  }

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await verifyUserEmailAction(formData);
      setStatus(result);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <form action={onSubmit} className="inline-flex">
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Verifying…" : "Mark email verified"}
        </button>
      </form>
      {status?.error ? <p className="text-xs text-red-600">{status.error}</p> : null}
      {status?.success ? <p className="text-xs text-brand-primary-dark">{status.success}</p> : null}
    </div>
  );
};

export default VerifyUserButton;
