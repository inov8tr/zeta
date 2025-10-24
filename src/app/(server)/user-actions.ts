"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendSignupConfirmationEmail } from "@/lib/resend/sendSignupConfirmation";
import { Database } from "@/lib/database.types";

export type UpdateUserProfileState = {
  error: string | null;
};

const ROLE_OPTIONS = ["admin", "teacher", "student", "parent"] as const;

type UserStatusActionResult = {
  error?: string;
};

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) {
      throw error;
    }
    return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
  } catch (error) {
    console.error("findUserByEmail: lookup failed", error);
    return null;
  }
}

const getAuthRedirectUrl = () => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!siteUrl) {
    return undefined;
  }
  const url = new URL("/auth/callback", siteUrl);
  return url.toString();
};

const createUserSchema = z
  .object({
    email: z
      .string()
      .email({ message: "A valid email address is required" })
      .transform((value) => value.toLowerCase()),
    full_name: z.string().trim().min(1, { message: "Full name is required" }),
    role: z.enum(ROLE_OPTIONS, { message: "Invalid role" }),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    class_id: z
      .union([z.string().uuid({ message: "Invalid class selection" }), z.literal(""), z.undefined()])
      .transform((value) => (value && value.length > 0 ? value : null)),
    test_status: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : "none")),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z.string().min(8, { message: "Confirm password must be at least 8 characters" }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

export type CreateUserState = {
  error: string | null;
};

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const raw = Object.fromEntries(formData.entries());
  const classroomEnabledInput = formData.get("classroom_enabled");
  const requestedClassroomEnabled = classroomEnabledInput === "on" || classroomEnabledInput === "true";
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message };
  }

  const { confirm_password: _confirmPassword, ...payload } = parsed.data;
  void _confirmPassword;
  const { email, full_name, role, phone, class_id, test_status, password } = payload;
  const classroomEnabled = role === "student" ? requestedClassroomEnabled : false;

  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in." };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("createUserAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions." };
  }

  if ((actorProfile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Only admins can create users." };
  }

  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase();
  let authUserId: string | null = null;

  const existing = await findUserByEmail(admin, normalizedEmail);
  if (existing) {
    authUserId = existing.id ?? null;
    try {
      if (authUserId) {
        await admin.auth.admin.updateUserById(authUserId, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name,
            role,
            phone,
          },
        });
      }
    } catch (updateError) {
      console.error("createUserAction: failed to update existing user", updateError);
      return { error: "Unable to update existing user credentials. Please try again." };
    }
  }

  if (!authUserId) {
    try {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          phone,
        },
      });
      if (createError) {
        throw createError;
      }
      authUserId = createData.user?.id ?? null;
    } catch (createError) {
      console.error("createUserAction: createUser failed", createError);
      return { error: "Unable to create user. Please check the details and try again." };
    }
  }

  if (!authUserId) {
    return { error: "Unable to resolve created user. Please try again." };
  }

  try {
    await admin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        full_name,
        role,
        phone,
      },
    });
  } catch (metaError) {
    console.warn("createUserAction: failed to update user metadata", metaError);
  }

  const now = new Date().toISOString();
  const profilePayload = {
    full_name,
    role,
    phone: phone ?? null,
    class_id: class_id ?? null,
    test_status: test_status ?? "none",
    classroom_enabled: classroomEnabled,
    updated_at: now,
  } satisfies Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", authUserId)
    .maybeSingle<{ user_id: string }>();

  if (profileLookupError) {
    console.error("createUserAction: profile lookup failed", profileLookupError);
    return { error: "User created, but profile lookup failed. Please retry." };
  }

  const profileMutation = existingProfile
    ? admin
        .from("profiles")
        .update(profilePayload as Database["public"]["Tables"]["profiles"]["Update"])
        .eq("user_id", authUserId)
    : admin
        .from("profiles")
        .insert({
          user_id: authUserId,
          ...profilePayload,
          created_at: now,
        } as Database["public"]["Tables"]["profiles"]["Insert"]);

  const { error: profileError } = await profileMutation;
  if (profileError) {
    console.error("createUserAction: profile mutation failed", profileError);
    return { error: "User invite sent, but profile update failed. Please try again." };
  }

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${authUserId}`);
  redirect(`/dashboard/users/${authUserId}`);
}

const schema = z.object({
  user_id: z.string().uuid({ message: "Invalid user id" }),
  full_name: z.string().trim().min(1, { message: "Full name is required" }),
  phone: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
  role: z.enum(ROLE_OPTIONS, { message: "Invalid role" }),
  class_id: z
    .union([z.string().uuid({ message: "Invalid class selection" }), z.literal(""), z.null()])
    .transform((value) => (value === "" || value === null ? null : value))
    .optional(),
  test_status: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

export async function updateUserProfileAction(
  _prevState: UpdateUserProfileState,
  formData: FormData
): Promise<UpdateUserProfileState> {
  const raw = Object.fromEntries(formData.entries());
  const classroomEnabledInput = formData.get("classroom_enabled");
  const requestedClassroomEnabled = classroomEnabledInput === "on" || classroomEnabledInput === "true";

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message };
  }

  const { user_id, full_name, phone, role, class_id, test_status } = parsed.data;
  const classroomEnabled = role === "student" ? requestedClassroomEnabled : false;

  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in." };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("updateUserProfileAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions." };
  }

  if (actorProfile?.role !== "admin") {
    return { error: "Only admins can update users." };
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name,
      phone: phone ?? null,
      role,
      class_id: class_id ?? null,
      test_status: test_status ?? "none",
      classroom_enabled: classroomEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (updateError) {
    console.error("updateUserProfileAction: update failed", updateError);
    return { error: "Failed to update user. Please try again." };
  }

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${user_id}`);
  redirect(`/dashboard/users/${user_id}`);
}

export async function verifyUserEmailAction(formData: FormData): Promise<{ error?: string; success?: string }> {
  const rawUserId = formData.get("user_id");
  const userId = typeof rawUserId === "string" ? rawUserId.trim() : "";
  if (!userId) {
    return { error: "Missing user id." };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in." };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("verifyUserEmailAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions." };
  }

  if (actorProfile?.role !== "admin") {
    return { error: "Only admins can verify users." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (error) {
      console.error("verifyUserEmailAction: updateUserById failed", error);
      return { error: error.message ?? "Failed to verify email." };
    }
  } catch (err) {
    console.error("verifyUserEmailAction: unexpected error", err);
    const message = err instanceof Error ? err.message : "Failed to verify email.";
    return { error: message };
  }

  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath("/dashboard/users");
  return { success: "Email marked as verified." };
}

export async function resendSignupVerificationEmailAction(
  email: string,
): Promise<{ error?: string; success?: string }> {
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!trimmedEmail) {
    return { error: "Email address is required." };
  }

  try {
    const admin = createAdminClient();
    const genericSuccessMessage =
      "If an account exists for that email, we just sent a verification link. Please check your inbox.";
    const user = await findUserByEmail(admin, trimmedEmail);
    if (!user) {
      return { success: genericSuccessMessage };
    }

    if (user.email_confirmed_at) {
      return { success: "This email is already verified. You can sign in now." };
    }

    const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const lastSentRaw = typeof userMetadata.last_verification_email_sent_at === "string"
      ? userMetadata.last_verification_email_sent_at
      : null;
    const lastSentAt = lastSentRaw ? new Date(lastSentRaw) : null;
    const rateLimitMs = 5 * 60 * 1000;
    if (lastSentAt && Date.now() - lastSentAt.getTime() < rateLimitMs) {
      const remainingMs = rateLimitMs - (Date.now() - lastSentAt.getTime());
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
      return {
        error: `Please wait ${remainingMinutes} more minute${remainingMinutes > 1 ? "s" : ""} before requesting another verification email.`,
      };
    }

    const redirectTo = getAuthRedirectUrl();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: trimmedEmail,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) {
      console.error("resendSignupVerificationEmailAction: generateLink failed", error);
      const message = "message" in error && typeof error.message === "string" ? error.message : null;
      return { error: message ?? "Unable to generate verification link." };
    }

    const actionLink = data?.properties?.action_link ?? null;
    if (!actionLink) {
      console.error("resendSignupVerificationEmailAction: missing action link", data);
      return { error: "Unable to create verification link. Please try again later." };
    }

    const generatedUserMetadata = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const nextMetadata: Record<string, unknown> = {
      ...userMetadata,
      ...generatedUserMetadata,
      last_verification_email_sent_at: new Date().toISOString(),
    };
    const userName =
      typeof nextMetadata.full_name === "string"
        ? (nextMetadata.full_name as string)
        : typeof nextMetadata.name === "string"
          ? (nextMetadata.name as string)
          : null;

    await sendSignupConfirmationEmail({
      to: trimmedEmail,
      confirmLink: actionLink,
      userName,
    });

    const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata,
    });
    if (metadataError) {
      console.error("resendSignupVerificationEmailAction: failed to store metadata timestamp", metadataError);
    }

    return { success: "Verification email sent. Please check your inbox (and spam folder)." };
  } catch (err) {
    console.error("resendSignupVerificationEmailAction: unexpected error", err);
    const message = err instanceof Error ? err.message : "Failed to resend verification email.";
    return { error: message };
  }
}

export async function archiveUserAction(userId: string): Promise<UserStatusActionResult> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in." };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError || actorProfile?.role !== "admin") {
    return { error: "Only admins can archive users." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({ archived: true, archived_at: now, updated_at: now })
    .eq("user_id", userId);

  if (updateError) {
    console.error("archiveUserAction: update failed", updateError);
    return { error: "Failed to archive user." };
  }

  try {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "permanent" });
  } catch (error) {
    console.error("archiveUserAction: auth update failed", error);
  }

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath(`/dashboard/users/${userId}/edit`);
  return {};
}

export async function restoreUserAction(userId: string): Promise<UserStatusActionResult> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in." };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError || actorProfile?.role !== "admin") {
    return { error: "Only admins can restore users." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({ archived: false, archived_at: null, updated_at: now })
    .eq("user_id", userId);

  if (updateError) {
    console.error("restoreUserAction: update failed", updateError);
    return { error: "Failed to restore user." };
  }

  try {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  } catch (error) {
    console.error("restoreUserAction: auth update failed", error);
  }

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath(`/dashboard/users/${userId}/edit`);
  return {};
}
