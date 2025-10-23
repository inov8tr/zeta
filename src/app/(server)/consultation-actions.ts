"use server";

import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { Database } from "@/lib/database.types";

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

type SupabaseErrorShape = {
  message?: string;
  code?: string;
  details?: string;
};

function extractError(err: unknown): { message: string; code?: string; details?: string } {
  if (typeof err === "string") {
    return { message: err };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  if (err && typeof err === "object") {
    const { message, code, details } = err as SupabaseErrorShape;
    if (message) {
      return { message, code, details };
    }
  }
  return { message: "Booking failed" };
}

export async function bookConsultation(input: Input) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const admin = createAdminClient();
    const normalizedUsername = input.username.trim().toLowerCase();
    let usernameValue = normalizedUsername.length > 0 ? normalizedUsername : null;
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

    if (usernameValue) {
      try {
        const { data: existingUsername } = await admin
          .from("profiles")
          .select("user_id")
          .eq("username", usernameValue)
          .maybeSingle();
        if (existingUsername && existingUsername.user_id !== userId) {
          usernameValue = null;
        }
      } catch (lookupError) {
        console.error("Failed to check username availability", lookupError);
      }
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          full_name: input.full_name,
          phone: normalizedPhone || null,
          username: usernameValue,
          role,
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Failed to upsert profile", profileError);
      if (typeof profileError.code === "string" && profileError.code === "23505") {
        const { error: fallbackError } = await admin
          .from("profiles")
          .upsert(
            {
              user_id: userId,
              full_name: input.full_name,
              phone: normalizedPhone || null,
              username: null,
              role,
            },
            { onConflict: "user_id" }
          );
        if (fallbackError) {
          console.error("Fallback profile upsert failed", fallbackError);
          throw new Error("That username is already taken. Please choose a different one.");
        }
        usernameValue = null;
      } else {
        throw new Error("Unable to save your profile right now. Please try again.");
      }
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
        username: usernameValue,
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
      const resolvedUsername = usernameValue ?? (normalizedUsername || "(not set)");

      await Promise.all([
        resend.emails.send({
          from: process.env.ALERT_FROM!,
          to: email,
          subject: "Your booking request — Zeta English",
          text: `Hi ${input.full_name},\n\nThanks for booking a ${
            input.appointment_type === "entrance_test" ? "placement test" : "consultation"
          }. We tentatively reserved: ${startText} → ${endText} (${tz}).\n\nYour username is ${resolvedUsername}.\n\nWe’ll confirm shortly.`,
        }),
        process.env.ALERT_TO
          ? resend.emails.send({
              from: process.env.ALERT_FROM!,
              to: process.env.ALERT_TO!,
              subject: `New ${input.appointment_type} request — ${input.full_name}`,
              text: `Type: ${input.appointment_type}\nRole: ${role}\nUsername: ${resolvedUsername}\nName: ${input.full_name}\nEmail: ${email}\nPhone: ${normalizedPhone || "-"}\nWhen: ${startText} → ${endText} (${tz})\nNotes: ${input.notes ?? "-"}\nBooking ID: ${booking.id}`,
            })
          : Promise.resolve(),
      ]);
    }

    return { ok: true, id: booking?.id, invitedUser };
  } catch (err: unknown) {
    const { message, code, details } = extractError(err);
    console.error("bookConsultation error", { err, message, code, details });
    return { error: message, code, details };
  }
}

export async function updateConsultationAction(input: {
  consultationId: string;
  slotId?: string | null;
  status?: string;
}) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
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
    return { error: "Only admins can update consultations." };
  }

  const admin = createAdminClient();
  const { data: consultation, error: consultationError } = await admin
    .from("consultations")
    .select("id, user_id, slot_id")
    .eq("id", input.consultationId)
    .maybeSingle<{ id: string; user_id: string | null; slot_id: string | null }>();

  if (consultationError || !consultation) {
    return { error: "Consultation not found." };
  }

  const updates: Database["public"]["Tables"]["consultations"]["Update"] = {};

  if (Object.prototype.hasOwnProperty.call(input, "slotId")) {
    const nextSlotId = input.slotId ?? null;

    if (consultation.slot_id && consultation.slot_id !== nextSlotId) {
      const { error: releaseError } = await admin
        .from("consultation_slots")
        .update({ is_booked: false, booked_by: null })
        .eq("id", consultation.slot_id);
      if (releaseError) {
        console.error("Failed to release previous slot", releaseError);
        return { error: "Could not release previous slot." };
      }
    }

    if (nextSlotId) {
      const { data: targetSlot, error: slotError } = await admin
        .from("consultation_slots")
        .select("id, is_booked")
        .eq("id", nextSlotId)
        .maybeSingle<{ id: string; is_booked: boolean }>();

      if (slotError || !targetSlot) {
        return { error: "Selected slot not found." };
      }

      if (targetSlot.is_booked && consultation.slot_id !== nextSlotId) {
        return { error: "That slot is already booked." };
      }

      const { error: bookError } = await admin
        .from("consultation_slots")
        .update({ is_booked: true, booked_by: consultation.user_id ?? null })
        .eq("id", nextSlotId);
      if (bookError) {
        console.error("Failed to book slot", bookError);
        return { error: "Could not book the selected slot." };
      }
    }

    updates.slot_id = nextSlotId;
  }

  if (input.status) {
    const allowedStatuses = new Set(["pending", "confirmed", "cancelled"]);
    if (!allowedStatuses.has(input.status)) {
      return { error: "Invalid status." };
    }

    const effectiveSlotId = Object.prototype.hasOwnProperty.call(input, "slotId")
      ? input.slotId
      : consultation.slot_id;

    const nextStatus = input.status as "pending" | "confirmed" | "cancelled";

    if (nextStatus === "confirmed" && !effectiveSlotId) {
      return { error: "Assign a slot before confirming." };
    }

    updates.status = nextStatus;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin
      .from("consultations")
      .update(updates)
      .eq("id", input.consultationId);
    if (updateError) {
      console.error("updateConsultationAction", updateError);
      return { error: "Failed to update consultation." };
    }
  }

  revalidatePath("/dashboard/consultations");
  revalidatePath("/dashboard");
  return {};
}
