import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { endOfDay, format, startOfDay } from "date-fns";

import { Database } from "@/lib/database.types";

type SlotRow = Database["public"]["Tables"]["consultation_slots"]["Row"];

type SlotPayload = {
  slot_date: string;
  start_time: string;
  end_time: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are not fully configured.");
}

const SUPABASE_URL_STR = SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY_STR = SUPABASE_SERVICE_ROLE_KEY as string;

const adminClient = createClient<Database>(SUPABASE_URL_STR, SUPABASE_SERVICE_ROLE_KEY_STR, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function assertAdmin() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("consultation-slots: failed to load user session", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile || profile.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

const isValidDateString = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
};

const isValidTimeString = (value: string | null | undefined) => /^[0-2]\d:[0-5]\d$/.test(value ?? "");

const buildKey = (slot: SlotPayload) => `${slot.slot_date}|${slot.start_time}|${slot.end_time}`;

const mapRowsToResponse = (rows: SlotRow[]) =>
  rows.map((row) => ({
    id: row.id,
    slot_date: row.slot_date,
    start_time: row.start_time,
    end_time: row.end_time,
    is_booked: row.is_booked,
  }));

export async function GET(request: NextRequest) {
  const authResult = await assertAdmin();
  const isAdminRequest = !authResult;

  if (authResult && authResult.status !== 401) {
    return authResult;
  }

  const url = new URL(request.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  const startDate = isValidDateString(startParam) ? new Date(startParam as string) : startOfDay(new Date());
  const endDate = isValidDateString(endParam) ? new Date(endParam as string) : endOfDay(startDate);

  let query = adminClient
    .from("consultation_slots")
    .select("id, slot_date, start_time, end_time, is_booked, booked_by, created_at")
    .gte("slot_date", format(startOfDay(startDate), "yyyy-MM-dd"))
    .lte("slot_date", format(endOfDay(endDate), "yyyy-MM-dd"))
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!isAdminRequest) {
    query = query.eq("is_booked", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = isAdminRequest ? (data ?? []) : mapRowsToResponse((data ?? []) as SlotRow[]);

  return NextResponse.json({ slots: payload });
}

export async function POST(request: NextRequest) {
  const authError = await assertAdmin();
  if (authError) {
    return authError;
  }

  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.slots)) {
    return NextResponse.json({ error: "Provide an array of slots to create." }, { status: 400 });
  }

  const incoming = (body.slots as SlotPayload[]).filter(
    (slot) => isValidDateString(slot.slot_date) && isValidTimeString(slot.start_time) && isValidTimeString(slot.end_time),
  );

  if (incoming.length === 0) {
    return NextResponse.json({ error: "No valid slots to publish." }, { status: 400 });
  }

  const unique = new Map<string, SlotPayload>();
  incoming.forEach((slot) => {
    unique.set(buildKey(slot), {
      slot_date: format(new Date(slot.slot_date), "yyyy-MM-dd"),
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
  });

  const slots = Array.from(unique.values());
  const minDate = slots.reduce((acc, slot) => (slot.slot_date < acc ? slot.slot_date : acc), slots[0].slot_date);
  const maxDate = slots.reduce((acc, slot) => (slot.slot_date > acc ? slot.slot_date : acc), slots[0].slot_date);

  const { data: existingRows, error: existingError } = await adminClient
    .from("consultation_slots")
    .select("slot_date, start_time, end_time")
    .gte("slot_date", minDate)
    .lte("slot_date", maxDate);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingKeys = new Set<string>(
    (existingRows ?? []).map((slot) =>
      buildKey({ slot_date: slot.slot_date, start_time: slot.start_time ?? "", end_time: slot.end_time ?? "" }),
    ),
  );

  const toInsert: Database["public"]["Tables"]["consultation_slots"]["Insert"][] = slots
    .filter((slot) => !existingKeys.has(buildKey(slot)))
    .map((slot) => ({
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_booked: false,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: [], skipped: slots.length }, { status: 200 });
  }

  const { data, error } = await adminClient.from("consultation_slots").insert(toInsert).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: mapRowsToResponse((data ?? []) as SlotRow[]), skipped: slots.length - toInsert.length });
}

export async function DELETE(request: NextRequest) {
  const authError = await assertAdmin();
  if (authError) {
    return authError;
  }

  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Provide an array of slot IDs to remove." }, { status: 400 });
  }

  const ids = (body.ids as string[]).filter((id) => typeof id === "string" && id.length > 0);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid slot IDs supplied." }, { status: 400 });
  }

  const { data, error } = await adminClient.from("consultation_slots").delete().eq("is_booked", false).in("id", ids).select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ removed: (data ?? []).length });
}
