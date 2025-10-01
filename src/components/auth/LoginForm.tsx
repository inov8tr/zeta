"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginDictionary } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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
      setError(dictionary.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple" | "kakao") => {
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/oauth/callback` : undefined;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      console.error(signInError);
      setError(dictionary.errorGeneric);
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

        <Button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 text-sm font-semibold">
          {isSubmitting ? "…" : dictionary.signIn}
        </Button>
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
