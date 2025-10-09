"use server";

import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createAdminClient } from "@/lib/supabaseAdmin";

interface Input {
  appointment_type: "consultation" | "entrance_test";
  full_name: string;
  email: string;
  phone: string;
  preferred_start: string; // ISO from datetime-local
  timezone?: string;
  notes?: string;
}

const DEFAULT_DURATION_MINUTES = 45;

export async function bookConsultation(input: Input) {
  try {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const admin = createAdminClient();
    const userId = session?.user.id ?? null;
    const email = session?.user.email ?? input.email;

    if (userId) {
      await admin.from("profiles").upsert(
        { user_id: userId, full_name: input.full_name, phone: input.phone.trim() || null },
        { onConflict: "user_id" }
      );
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
        phone: input.phone.trim() || null,
        preferred_start: start.toISOString(),
        preferred_end: end.toISOString(),
        timezone: input.timezone ?? "Asia/Seoul",
        status: "pending",
        notes: input.notes ?? null,
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

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
          }. We tentatively reserved: ${startText} → ${endText} (${tz}).\n\nWe’ll confirm shortly.`,
        }),
        process.env.ALERT_TO
          ? resend.emails.send({
              from: process.env.ALERT_FROM!,
              to: process.env.ALERT_TO!,
              subject: `New ${input.appointment_type} request — ${input.full_name}`,
              text: `Type: ${input.appointment_type}\nName: ${input.full_name}\nEmail: ${email}\nPhone: ${input.phone ?? "-"}\nWhen: ${startText} → ${endText} (${tz})\nNotes: ${input.notes ?? "-"}\nBooking ID: ${booking.id}`,
            })
          : Promise.resolve(),
      ]);
    }

    return { ok: true, id: booking?.id };
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
