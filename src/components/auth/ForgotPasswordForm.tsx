"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/seo";

const ForgotPasswordForm = () => {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    setPending(true);
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
    const redirectTo = `${origin.replace(/\/$/, "")}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setPending(false);

    if (resetError) {
      setError(resetError.message ?? "Unable to send reset email.");
      return;
    }

    setStatus("Check your email for a link to reset your password.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="name@example.com"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full px-6 py-3 text-sm font-semibold">
        {pending ? "Sending reset link…" : "Send reset link"}
      </Button>

      {status && <p className="text-sm text-emerald-600">{status}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
};

export default ForgotPasswordForm;
