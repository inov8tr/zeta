"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { resendSignupVerificationEmailAction } from "@/app/(server)/user-actions";

interface LoginFormProps {
  dictionary: LoginDictionary;
  initialError?: string | null;
}

const roleRedirectMap: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const oauthProviders: { key: "google" | "apple" | "kakao"; label: string }[] = [
  { key: "google", label: "Google" },
  { key: "apple", label: "Apple" },
  { key: "kakao", label: "KakaoTalk" },
];

const LoginForm = ({ dictionary, initialError = null }: LoginFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase is not configured.");
      return null;
    }
    return createClientComponentClient();
  }, []);
  const strings = dictionary as unknown as Record<string, string | undefined>;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResendMessage(null);
    setNeedsConfirmation(false);

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw signInError;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Missing user session");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const role = profile?.role?.toLowerCase();
      const redirectPath = role ? roleRedirectMap[role] : null;

      if (!redirectPath) {
        setError(dictionary.errorRole);
        return;
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      console.error(err);
      const messageLower =
        err instanceof Error ? err.message.toLowerCase() : typeof err === "string" ? err.toLowerCase() : "";
      if (messageLower.includes("email not confirmed") || messageLower.includes("email_not_confirmed")) {
        setNeedsConfirmation(true);
      }
      const message =
        err instanceof Error && err.message.toLowerCase().includes("invalid login credentials")
          ? dictionary.errorGeneric
          : err instanceof Error
            ? err.message
            : dictionary.errorGeneric;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setResendMessage(dictionary.emailPlaceholder ?? "Enter your email first.");
      return;
    }
    setIsResending(true);
    setResendMessage(null);
    try {
      const result = await resendSignupVerificationEmailAction(email);
      if (result?.error) {
        setResendMessage(result.error);
        return;
      }
      setResendMessage(
        result?.success ??
          strings.confirmationResent ??
          "Verification email sent. Please check your inbox (and spam folder).",
      );
    } catch (resendErr) {
      console.error(resendErr);
      const msg =
        resendErr instanceof Error && resendErr.message
          ? resendErr.message
          : dictionary.errorGeneric ?? "Unable to resend confirmation email.";
      setResendMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple" | "kakao") => {
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = siteUrl
      ? `${siteUrl}/auth/callback`
      : typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      console.error(signInError);
      const message = signInError.message?.toLowerCase().includes("invalid login credentials")
        ? dictionary.errorGeneric
        : signInError.message;
      setError(message ?? dictionary.errorGeneric);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm lg:flex-row">
      <form onSubmit={handleSubmit} className="basis-1/2 space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
            {dictionary.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={dictionary.emailPlaceholder}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-neutral-800">
            {dictionary.passwordLabel}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={dictionary.passwordPlaceholder}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {needsConfirmation ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <p>
              {strings.emailConfirmationNeeded ??
                "Please confirm your email before signing in. We can resend the confirmation email if you need it."}
            </p>
            <button
              type="button"
              className="mt-2 inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleResendConfirmation}
              disabled={isResending}
            >
              {isResending
                ? strings.resendingLabel ?? "Resending…"
                : strings.resendConfirmationLabel ?? "Resend confirmation email"}
            </button>
            {resendMessage ? <p className="mt-2 text-xs text-brand-primary-dark">{resendMessage}</p> : null}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 text-sm font-semibold">
          {isSubmitting ? "…" : dictionary.signIn}
        </Button>
        <div className="text-center text-sm">
          <Link href="/auth/forgot-password" className="text-brand-primary underline">
            {dictionary.forgotPasswordLink ?? "Forgot your password?"}
          </Link>
        </div>
      </form>

      <div className="basis-1/2 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
          {dictionary.providers?.title ?? "Sign in with"}
        </h2>
        <div className="grid gap-3">
          {oauthProviders.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-neutral-300 text-sm font-semibold"
              onClick={() => handleOAuth(key)}
            >
              {dictionary.providers?.[key] ?? `Continue with ${label}`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
