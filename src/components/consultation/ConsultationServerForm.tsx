"use client";

import { useTransition, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookConsultation } from "@/app/(server)/consultation-actions";
import { Button } from "@/components/ui/Button";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { EnrollmentDictionary } from "@/lib/i18n";
import type { IconType } from "react-icons";
import { FaGoogle, FaApple } from "react-icons/fa";
import { SiKakaotalk } from "react-icons/si";

const oauthProviders: { key: "google" | "apple" | "kakao"; label: string; icon: IconType }[] = [
  { key: "google", label: "Google", icon: FaGoogle },
  { key: "apple", label: "Apple", icon: FaApple },
  { key: "kakao", label: "KakaoTalk", icon: SiKakaotalk },
];

const BookingSchema = z.object({
  appointment_type: z.enum(["consultation", "entrance_test"]),
  full_name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(3, "Please enter a phone number."),
  preferred_start: z.string().min(1, "Pick a date/time."),
  notes: z.string().max(2000).optional(),
});
type BookingValues = z.infer<typeof BookingSchema>;

const Schema = BookingSchema.extend({
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasPassword = Boolean(data.password?.trim().length);
  const hasConfirm = Boolean(data.confirmPassword?.trim().length);

  if (hasPassword || hasConfirm) {
    if (!hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password is required to create an account.",
      });
    }
    if (!hasConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Please confirm your password.",
      });
    }
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at least 6 characters.",
      });
    }
    if (data.password && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  }
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  dictionary?: EnrollmentDictionary;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
  readOnlyEmail?: boolean;
  session: Session | null;
  supabase: SupabaseClient;
}

const ConsultationServerForm = ({
  dictionary,
  initialFullName,
  initialEmail,
  initialPhone,
  readOnlyEmail = false,
  session,
  supabase,
}: Props) => {
  const card = dictionary?.card;
  const [pending, startTransition] = useTransition();
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      appointment_type: "consultation",
      full_name: initialFullName ?? "",
      email: initialEmail ?? "",
      phone: initialPhone ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const getRedirectUrl = () => {
    const base = typeof window !== "undefined" ? window.location : undefined;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const origin = siteUrl ?? base?.origin;
    if (!origin) {
      return undefined;
    }
    const redirect = new URL("/auth/callback", origin);
    const pathname = base?.pathname ?? "/";
    redirect.searchParams.set("redirect", pathname);
    return redirect.toString();
  };

  const passwordValue = form.watch("password");
  const wantsAccount = Boolean(passwordValue?.trim().length && !session);
  const isSubmitting = pending || authPending;

  const handleOAuth = async (provider: "google" | "apple" | "kakao") => {
    setOk(null);
    setErr(null);
    setAuthMessage(null);
    setAuthPending(true);
    try {
      const redirectTo = getRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Social sign up failed.";
      setErr(message);
    } finally {
      setAuthPending(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setOk(null);
    setErr(null);
    setAuthMessage(null);
    const { password, ...rest } = values;
    const { confirmPassword: confirmPasswordValue, ...bookingWithoutConfirm } = rest;
    void confirmPasswordValue;
    const bookingPayload: BookingValues = {
      ...bookingWithoutConfirm,
    };

    if (!session && password?.trim()) {
      setAuthPending(true);
      const { data, error } = await supabase.auth.signUp({
        email: bookingPayload.email,
        password,
        options: {
          data: {
            full_name: bookingPayload.full_name,
          },
          emailRedirectTo: getRedirectUrl(),
        },
      });
      setAuthPending(false);

      if (error) {
        setErr(error.message);
        return;
      }

      if (!data.session) {
        setAuthMessage(
          dictionary?.form?.emailConfirmationMessage ??
            "Check your email to confirm your new account. We'll finish booking below."
        );
      } else {
        setAuthMessage(
          dictionary?.form?.accountCreatedMessage ??
            "Account created! You're now signed in so we can save this booking."
        );
      }
    }

    startTransition(async () => {
      const res = await bookConsultation(bookingPayload);
      if (res?.error) {
        setErr(res.error);
      } else {
        setOk(dictionary?.form?.success ?? "Thanks! We’ll confirm shortly by email.");
        form.reset({
          appointment_type: bookingPayload.appointment_type,
          full_name: initialFullName ?? "",
          email: initialEmail ?? "",
          phone: initialPhone ?? "",
          preferred_start: "",
          notes: "",
          password: "",
          confirmPassword: "",
        });
      }
    });
  };

  const selectedType = form.watch("appointment_type");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
          {card?.stepOneLabel ?? "Step 1"}
        </h3>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {card?.stepOneTitle ?? "Choose appointment type"}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => form.setValue("appointment_type", "consultation", { shouldValidate: true })}
            className={`rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
              selectedType === "consultation"
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            <span className="block text-base font-semibold">
              {card?.consultation?.title ?? "Free Consultation"}
            </span>
            <span className="mt-1 block text-sm text-neutral-600">
              {card?.consultation?.description ??
                "Meet a Zeta teacher to discuss learning goals and class placement."}
            </span>
          </button>
          <button
            type="button"
            onClick={() => form.setValue("appointment_type", "entrance_test", { shouldValidate: true })}
            className={`rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
              selectedType === "entrance_test"
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            <span className="block text-base font-semibold">
              {card?.entranceTest?.title ?? "Entrance Test (₩20,000)"}
            </span>
            <span className="mt-1 block text-sm text-neutral-600">
              {card?.entranceTest?.description ??
                "Reserve a detailed placement exam with feedback and recommendations."}
            </span>
          </button>
        </div>
        {form.formState.errors.appointment_type && (
          <p className="mt-2 text-sm text-red-600">{form.formState.errors.appointment_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
          {card?.stepTwoLabel ?? "Step 2"}
        </h3>
        <p className="text-lg font-semibold text-neutral-900">
          {card?.stepTwoTitle ?? "Tell us when you're available"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.fullName ?? "Full name"}</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            {...form.register("full_name")}
          />
          {form.formState.errors.full_name && (
            <p className="text-sm text-red-600">{form.formState.errors.full_name.message}</p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.email ?? "Email"}</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 disabled:bg-neutral-100"
            type="email"
            {...form.register("email")}
            readOnly={readOnlyEmail}
            disabled={readOnlyEmail}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.phone ?? "Phone"}</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-neutral-800">
            {dictionary?.form?.start ?? "Preferred start (local time)"}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            type="datetime-local"
            {...form.register("preferred_start")}
          />
          {form.formState.errors.preferred_start && (
            <p className="text-sm text-red-600">{form.formState.errors.preferred_start.message}</p>
          )}
        </label>
      </div>

      {!session && (
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div>
            <span className="text-sm font-medium text-neutral-800">
              {card?.passwordTitle ?? "Create a password (optional)"}
            </span>
            <p className="mt-1 text-xs text-neutral-500">
              {card?.passwordDescription ??
                "Add a password to create an account and manage consultations. Leave blank to continue as a guest."}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className="block text-sm font-medium text-neutral-800">
                {dictionary?.form?.password ?? "Password"}
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </label>
            <label>
              <span className="block text-sm font-medium text-neutral-800">
                {dictionary?.form?.confirmPassword ?? "Confirm password"}
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                type="password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
              )}
            </label>
          </div>
        </div>
      )}

      <label>
        <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.notes ?? "Notes"}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          rows={4}
          placeholder={card?.notesPlaceholder ?? "Anything specific you want to cover?"}
          {...form.register("notes")}
        />
      </label>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? dictionary?.form?.submitting ?? "Booking…"
          : wantsAccount
            ? dictionary?.form?.createAccountSubmit ?? "Create account & book"
            : dictionary?.form?.submit ?? "Book consultation"}
      </Button>
      {authMessage && <p className="text-sm text-emerald-600">{authMessage}</p>}
      {ok && <p className="text-green-700">{dictionary?.form?.success ?? ok}</p>}
      {err && <p className="text-red-700">{dictionary?.form?.error ?? err}</p>}

      {!session && (
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <p className="text-sm font-medium text-neutral-800">Or sign up with</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {oauthProviders.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 border-neutral-300 text-sm font-semibold"
                onClick={() => handleOAuth(key)}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default ConsultationServerForm;
