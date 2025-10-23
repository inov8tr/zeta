"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { archiveUserAction, restoreUserAction } from "@/app/(server)/user-actions";

interface ArchiveToggleButtonProps {
  userId: string;
  archived: boolean;
}

const ArchiveToggleButton = ({ userId, archived }: ArchiveToggleButtonProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (pending) {
      return;
    }
    setError(null);
    startTransition(() => {
      const action = archived ? restoreUserAction : archiveUserAction;
      action(userId).then((result) => {
        if (result?.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      });
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase transition ${
          archived
            ? "border border-brand-primary text-brand-primary hover:bg-brand-primary/10"
            : "bg-brand-primary text-white hover:bg-brand-primary-dark"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? "Updating..." : archived ? "Restore user" : "Archive user"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default ArchiveToggleButton;
