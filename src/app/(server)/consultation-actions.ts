"use server";

import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createAdminClient } from "@/lib/supabaseAdmin";

interface Input {
  full_name: string;
  email: string;
  phone?: string;
  preferred_start: string; // ISO from datetime-local
  duration_minutes: number;
  timezone?: string;
  notes?: string;
}

export async function bookConsultation(input: Input) {
  try {
    const admin = createAdminClient();

    // find or create user by email
    let userId: string | null = null;
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }
    const existingUser = list?.users?.find((user) => user.email?.toLowerCase() === input.email.toLowerCase()) ?? null;
    if (existingUser) {
      userId = existingUser.id;
      // best-effort: upsert profile if table exists
      await admin.from("profiles").upsert(
        { user_id: userId, full_name: input.full_name, phone: input.phone ?? null },
        { onConflict: "user_id" }
      );
    } else {
      const created = await admin.auth.admin.createUser({
        email: input.email,
        email_confirm: false,
        user_metadata: { full_name: input.full_name, phone: input.phone ?? null },
      });
      if (created.error) {
        throw created.error;
      }
      userId = created.data.user?.id ?? null;
      if (!userId) {
        throw new Error("Could not create user");
      }
      await admin.from("profiles").insert({
        user_id: userId,
        full_name: input.full_name,
        phone: input.phone ?? null,
      });
    }

    const start = parseISO(input.preferred_start);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Invalid start time");
    }
    const end = addMinutes(start, Math.max(15, Math.min(input.duration_minutes || 30, 180)));

    const { data: booking, error } = await admin
      .from("consultations")
      .insert({
        user_id: userId!,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
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
          to: input.email,
          subject: "Your consultation request — Zeta English",
          text: `Hi ${input.full_name},\n\nThanks for booking a consultation. We tentatively reserved: ${startText} → ${endText} (${tz}).\n\nWe’ll confirm shortly.`,
        }),
        process.env.ALERT_TO
          ? resend.emails.send({
              from: process.env.ALERT_FROM!,
              to: process.env.ALERT_TO!,
              subject: `New consultation request — ${input.full_name}`,
              text: `Name: ${input.full_name}\nEmail: ${input.email}\nPhone: ${input.phone ?? "-"}\nWhen: ${startText} → ${endText} (${tz})\nNotes: ${input.notes ?? "-"}\nBooking ID: ${booking.id}`,
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
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
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
