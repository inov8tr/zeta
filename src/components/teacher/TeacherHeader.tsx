"use client";

import { useState } from "react";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface TeacherHeaderProps {
  teacherName?: string | null;
}

const TeacherHeader = ({ teacherName }: TeacherHeaderProps) => {
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.replace("/login");
    } catch (error) {
      console.error("TeacherHeader: sign out failed", error);
      setSigningOut(false);
    }
  };

  return (
    <header className="bg-white/90 shadow-sm backdrop-blur print:hidden">
      <div className="flex flex-col gap-4 border-b border-brand-primary/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-primary/70">Teacher workspace</p>
          <h2 className="text-lg font-semibold text-neutral-900">
            {teacherName ? `Welcome back, ${teacherName.split(" ")[0]}` : "Welcome back"}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
};

export default TeacherHeader;
