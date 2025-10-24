"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { disconnectGoogleClassroomAction } from "@/app/(server)/google-classroom-actions";

const DisconnectClassroomButton = () => {
  const router = useRouter();
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await disconnectGoogleClassroomAction();
      setStatus(result);
      if (!result?.error) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Disconnecting…" : "Disconnect Google Classroom"}
      </button>
      {status?.error ? <p className="text-xs text-red-600">{status.error}</p> : null}
      {status?.success ? <p className="text-xs text-green-600">{status.success}</p> : null}
    </div>
  );
};

export default DisconnectClassroomButton;
