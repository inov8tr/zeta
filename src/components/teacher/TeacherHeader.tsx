"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface TeacherHeaderProps {
  teacherName?: string | null;
}

const TeacherHeader = ({ teacherName }: TeacherHeaderProps) => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("TeacherHeader: sign out failed", error);
      setSigningOut(false);
    }
  };

  const greeting = teacherName ? `Welcome back, ${teacherName.split(" ")[0]}` : "Welcome back";

  return (
    <header className="bg-white/90 shadow-sm backdrop-blur print:hidden">
      <div className="flex flex-col gap-4 border-b border-teacher-primary/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teacher-primary-text/70">Teacher workspace</p>
          <h2 className="text-lg font-semibold text-teacher-primary-text">{greeting}</h2>
          <p className="text-sm text-neutral-muted">Guide students forward with real-time classroom insight.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="mailto:info@zeta-eng.co.kr"
            className="inline-flex items-center justify-center rounded-full border border-teacher-primary/20 bg-white px-4 py-2 text-sm font-semibold text-teacher-primary-text transition hover:border-teacher-primary hover:bg-teacher-primary/10"
          >
            Need help?
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center justify-center rounded-full bg-teacher-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-teacher-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;
