"use client";

import { useCallback, useEffect, useMemo, useTransition, useState } from "react";
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
import ConsultationSlotPicker from "@/components/consultation/ConsultationSlotPicker";

const oauthProviders: { key: "google" | "apple" | "kakao"; label: string; icon: IconType }[] = [
  { key: "google", label: "Google", icon: FaGoogle },
  { key: "apple", label: "Apple", icon: FaApple },
  { key: "kakao", label: "KakaoTalk", icon: SiKakaotalk },
];

const BookingSchema = z.object({
  appointment_type: z.enum(["consultation", "entrance_test"]),
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email."),
  phone: z
    .string()
    .trim()
    .min(3, "Please enter a phone number."),
  preferred_start: z.string().min(1, "Pick a date/time."),
  notes: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2000 characters.")
    .optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be under 32 characters.")
    .regex(/^[a-z0-9_-]+$/i, "Use only letters, numbers, underscores, or hyphens.")
    .transform((value) => value.toLowerCase()),
});
type BookingValues = z.infer<typeof BookingSchema>;

const buildSchema = (requirePassword: boolean) =>
  BookingSchema.extend({
    password: requirePassword
      ? z
          .string()
          .trim()
          .min(6, "Password must be at least 6 characters.")
      : z.string().trim().optional(),
    confirmPassword: requirePassword ? z.string().trim() : z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    const hasPassword = Boolean(data.password?.trim().length);
    const hasConfirm = Boolean(data.confirmPassword?.trim().length);

    if (requirePassword) {
      if (!hasPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password is required.",
        });
      }
      if (!hasConfirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Please confirm your password.",
        });
      }
    }

    if ((hasPassword && !hasConfirm) || (!hasPassword && hasConfirm)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasPassword ? ["confirmPassword"] : ["password"],
        message: "Enter and confirm your password.",
      });
    }

    if (hasPassword && hasConfirm && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface Props {
  dictionary?: EnrollmentDictionary;
  contactPhone?: string;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialUsername?: string;
  readOnlyEmail?: boolean;
  session: Session | null;
  supabase: SupabaseClient;
}

const ConsultationServerForm = ({
  dictionary,
  contactPhone,
  initialFullName,
  initialEmail,
  initialPhone,
  initialUsername,
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
  type UserRole = "admin" | "teacher" | "student" | "parent";
  const metadata = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const allowedRoles = new Set<UserRole>(["admin", "teacher", "student", "parent"]);
  const sessionUserType: UserRole =
    typeof metadata.user_type === "string" && allowedRoles.has(metadata.user_type.toLowerCase() as UserRole)
      ? (metadata.user_type.toLowerCase() as UserRole)
      : "student";
  const requirePassword = !session;
  const schema = useMemo(() => buildSchema(requirePassword), [requirePassword]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      appointment_type: "consultation",
      full_name: initialFullName ?? "",
      email: initialEmail ?? "",
      phone: initialPhone ?? "",
      preferred_start: "",
      notes: "",
      username: initialUsername?.toLowerCase() ?? "",
      password: "",
      confirmPassword: "",
    },
  });
  useEffect(() => {
    form.register("preferred_start");
  }, [form]);
  const preferredStartValue = form.watch("preferred_start");
  const handleSlotChange = useCallback(
    (isoString: string | null) => {
      form.setValue("preferred_start", isoString ?? "", {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form],
  );

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

  const mustCreateAccount = requirePassword;
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
    const { password, confirmPassword: _confirmPassword, ...bookingWithoutConfirm } = values;
    void _confirmPassword;
    const bookingPayload: BookingValues = {
      ...bookingWithoutConfirm,
    };
    if (!bookingPayload.notes) {
      bookingPayload.notes = undefined;
    }

    let signupUserId: string | null = null;

    if (!session) {
      const passwordValue = password?.trim();
      if (!passwordValue) {
        setErr("Password is required.");
        return;
      }
      setAuthPending(true);
      const { data, error } = await supabase.auth.signUp({
        email: bookingPayload.email,
        password: passwordValue,
        options: {
          data: {
            full_name: bookingPayload.full_name,
            username: bookingPayload.username,
            user_type: sessionUserType,
          },
          emailRedirectTo: getRedirectUrl(),
        },
      });
      setAuthPending(false);

      if (error) {
        setErr(error.message);
        return;
      }

      signupUserId = data.user?.id ?? null;

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
      const res = await bookConsultation({
        ...bookingPayload,
        user_type: sessionUserType,
        authUserId: signupUserId ?? undefined,
      });
      if (res?.error) {
        const pieces = [res.error];
        if (res.code) {
          pieces.push(`(${res.code})`);
        }
        if (res.details && res.details !== res.error) {
          pieces.push(`– ${res.details}`);
        }
        setErr(pieces.filter(Boolean).join(" "));
      } else {
        if (res?.invitedUser) {
          setAuthMessage(
            dictionary?.form?.inviteMessage ??
              "Check your email to set a password. We sent you an invite to finish creating your account."
          );
        }
        setOk(dictionary?.form?.success ?? "Thanks! We’ll confirm shortly by email.");
        form.reset({
          appointment_type: bookingPayload.appointment_type,
          full_name: bookingPayload.full_name,
          email: bookingPayload.email,
          phone: bookingPayload.phone,
          preferred_start: "",
          notes: "",
          username: bookingPayload.username,
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

      <div>
        <label>
          <span className="block text-sm font-medium text-neutral-800">
            {dictionary?.form?.username ?? "Username"}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            {...form.register("username")}
          />
          {dictionary?.form?.usernameHelp && (
            <p className="mt-1 text-xs text-neutral-500">{dictionary?.form?.usernameHelp}</p>
          )}
          {form.formState.errors.username && (
            <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
          )}
        </label>
      </div>

      <div className="space-y-4">
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
        <ConsultationSlotPicker
          label={dictionary?.form?.start ?? "Preferred start (local time)"}
          value={preferredStartValue}
          onChange={handleSlotChange}
          contactPhone={contactPhone}
          error={form.formState.errors.preferred_start?.message}
        />
        <label>
          <span className="block text-sm font-medium text-neutral-800">
            {dictionary?.form?.notes ?? "Notes"}
          </span>
          <textarea
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            rows={4}
            placeholder={card?.notesPlaceholder ?? "Anything specific you want to cover?"}
            {...form.register("notes")}
          />
        </label>
      </div>

      {!session && (
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div>
            <span className="text-sm font-medium text-neutral-800">
              {card?.passwordTitle ?? "Create a password"}
            </span>
            <p className="mt-1 text-xs text-neutral-500">
              {card?.passwordDescription ??
                "Create your password so you can sign in and manage consultations."}
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
                required={requirePassword}
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
                required={requirePassword}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
              )}
            </label>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? dictionary?.form?.submitting ?? "Booking…"
          : mustCreateAccount
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
