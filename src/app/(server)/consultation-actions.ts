"use server";

import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createAdminClient } from "@/lib/supabaseAdmin";

const USER_ROLES = ["admin", "teacher", "student", "parent"] as const;
type UserRole = (typeof USER_ROLES)[number];
const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? null;

const buildAuthRedirect = () => {
  if (!SITE_URL) {
    return undefined;
  }
  try {
    return new URL("/auth/callback", SITE_URL).toString();
  } catch (error) {
    console.error("Invalid SITE_URL for auth redirect", error);
    return undefined;
  }
};

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) {
      throw error;
    }
    return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
  } catch (error) {
    console.error("Failed to look up user by email", error);
    return null;
  }
}


interface Input {
  appointment_type: "consultation" | "entrance_test";
  full_name: string;
  email: string;
  phone: string;
  preferred_start: string; // ISO from datetime-local
  timezone?: string;
  notes?: string;
  username: string;
  user_type?: UserRole | string;
  authUserId?: string;
}

const DEFAULT_DURATION_MINUTES = 45;

export async function bookConsultation(input: Input) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const admin = createAdminClient();
    const normalizedUsername = input.username.trim().toLowerCase();
    const normalizedPhone = input.phone.trim();
    const requestedRole = input.user_type;
    const role: UserRole = isUserRole(requestedRole) ? requestedRole : "student";

    let userId = session?.user.id ?? null;
    let email = session?.user.email ?? input.email.trim().toLowerCase();
    let invitedUser = false;

    if (!userId && input.authUserId) {
      try {
        const { data: lookup, error: lookupError } = await admin.auth.admin.getUserById(input.authUserId);
        if (!lookupError && lookup?.user) {
          const lookupEmail = lookup.user.email ?? undefined;
          if (!lookupEmail || lookupEmail.toLowerCase() !== email.toLowerCase()) {
            console.warn("Auth user ID email mismatch, skipping association.");
          } else {
            userId = lookup.user.id;
            email = lookupEmail.toLowerCase();
          }
        }
      } catch (verificationError) {
        console.error("Failed to verify sign-up user:", verificationError);
      }
    }

    if (!userId) {
      const existing = await findUserByEmail(admin, email);
      if (existing) {
        userId = existing.id;
        email = existing.email?.toLowerCase() ?? email;
      }
    }

    if (!userId) {
      try {
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: input.full_name,
            username: normalizedUsername,
            user_type: role,
          },
          redirectTo: buildAuthRedirect(),
        });
        if (inviteError) {
          throw inviteError;
        }
        invitedUser = true;
        userId = inviteData.user?.id ?? null;
        email = inviteData.user?.email?.toLowerCase() ?? email;
      } catch (inviteError) {
        console.error("Failed to invite user by email", inviteError);
        const fallback = await findUserByEmail(admin, email);
        if (fallback) {
          userId = fallback.id;
          email = fallback.email?.toLowerCase() ?? email;
        }
      }
    }

    if (!userId) {
      throw new Error("Unable to resolve Supabase user for booking");
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          full_name: input.full_name,
          phone: normalizedPhone || null,
          username: normalizedUsername,
          role,
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Failed to upsert profile", profileError);
      if (typeof profileError.code === "string" && profileError.code === "23505") {
        throw new Error("That test ID is already in use. Please choose a different one.");
      }
      throw new Error("Unable to save your profile right now. Please try again.");
    }

    const start = parseISO(input.preferred_start);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Invalid start time");
    }
    const end = addMinutes(start, DEFAULT_DURATION_MINUTES);

    const { data: booking, error } = await admin
      .from("consultations")
      .insert({
        user_id: userId,
        type: input.appointment_type,
        full_name: input.full_name,
        email,
        phone: normalizedPhone || null,
        preferred_start: start.toISOString(),
        preferred_end: end.toISOString(),
        timezone: input.timezone ?? "Asia/Seoul",
        status: "pending",
        notes: input.notes ?? null,
        username: normalizedUsername,
        user_type: role,
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

    revalidatePath("/admin", "page");

    // optional email notifications
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && process.env.ALERT_FROM) {
      const resend = new Resend(resendKey);
      const startText = start.toLocaleString("en-US", { hour12: false });
      const endText = end.toLocaleString("en-US", { hour12: false });
      const tz = input.timezone ?? "Asia/Seoul";
      await Promise.all([
        resend.emails.send({
          from: process.env.ALERT_FROM!,
          to: email,
          subject: "Your booking request — Zeta English",
          text: `Hi ${input.full_name},\n\nThanks for booking a ${
            input.appointment_type === "entrance_test" ? "placement test" : "consultation"
          }. We tentatively reserved: ${startText} → ${endText} (${tz}).\n\nYour username is ${normalizedUsername}.\n\nWe’ll confirm shortly.`,
        }),
        process.env.ALERT_TO
          ? resend.emails.send({
              from: process.env.ALERT_FROM!,
              to: process.env.ALERT_TO!,
              subject: `New ${input.appointment_type} request — ${input.full_name}`,
              text: `Type: ${input.appointment_type}\nRole: ${role}\nUsername: ${normalizedUsername}\nName: ${input.full_name}\nEmail: ${email}\nPhone: ${normalizedPhone || "-"}\nWhen: ${startText} → ${endText} (${tz})\nNotes: ${input.notes ?? "-"}\nBooking ID: ${booking.id}`,
            })
          : Promise.resolve(),
      ]);
    }

    return { ok: true, id: booking?.id, invitedUser };
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Booking failed";
    return { error: message };
  }
}

export async function updateConsultationStatusAction(formData: FormData): Promise<void> {
  try {
    const id = String(formData.get("id"));
    const status = String(formData.get("status"));
    if (!id || !["pending", "confirmed", "cancelled"].includes(status)) {
      throw new Error("Invalid input");
    }
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();
    if (profileError || profile?.role !== "admin") {
      throw new Error("Forbidden");
    }
    const admin = createAdminClient();
    const { error } = await admin
      .from("consultations")
      .update({ status })
      .eq("id", id);
    if (error) {
      throw error;
    }
    revalidatePath("/admin", "page");
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Update failed";
    throw new Error(message);
  }
}
