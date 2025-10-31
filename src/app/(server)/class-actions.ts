"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import type { Database } from "@/lib/database.types";
import { serializeScheduleEntries, scheduleEntriesSchema } from "@/utils/classSchedule";

type ActionState = {
  error: string | null;
  success?: boolean;
  classId?: string | null;
};

const normalizeScheduleInput = (schedule: string | null) => {
  if (!schedule) {
    return { error: null, value: null };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(schedule);
  } catch (parseError) {
    console.error("normalizeScheduleInput: failed to parse schedule", parseError);
    return { error: "Invalid schedule format.", value: null };
  }

  if (!Array.isArray(raw)) {
    return { error: "Schedule payload is invalid.", value: null };
  }

  const sanitized = raw.map((item) => ({
    day: typeof item?.day === "number" ? item.day : Number.NaN,
    start: typeof item?.start === "string" ? item.start : "",
    end: typeof item?.end === "string" ? item.end : "",
  }));

  const result = scheduleEntriesSchema.safeParse(sanitized);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Schedule selection is invalid.";
    return { error: message, value: null };
  }

  return { error: null, value: serializeScheduleEntries(result.data) };
};

const createClassSchema = z.object({
  name: z.string().trim().min(1, { message: "Class name is required" }),
  level: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  schedule: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  teacher_id: z
    .union([z.string().uuid({ message: "Invalid teacher selection" }), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type CreateClassState = ActionState;

export async function createClassAction(_prev: CreateClassState, formData: FormData): Promise<CreateClassState> {
  const rawEntries = Object.fromEntries(formData.entries());
  const studentIdsRaw = formData.getAll("student_ids").map((value) => String(value));

  const parsed = createClassSchema.safeParse(rawEntries);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message, success: false, classId: null };
  }

  const studentIdsResult = z.array(z.string().uuid({ message: "Invalid student selection" })).safeParse(
    studentIdsRaw.filter((value) => value.length > 0),
  );
  if (!studentIdsResult.success) {
    const message = studentIdsResult.error.issues[0]?.message ?? "Invalid student selection.";
    return { error: message, success: false, classId: null };
  }

  const { name, level, schedule, teacher_id } = parsed.data;
  const { error: scheduleError, value: normalizedSchedule } = normalizeScheduleInput(schedule);
  if (scheduleError) {
    return { error: scheduleError, success: false, classId: null };
  }

  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in.", success: false, classId: null };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("createClassAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions.", success: false, classId: null };
  }

  if ((actorProfile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Only admins can create classes.", success: false, classId: null };
  }

  const now = new Date().toISOString();

  const classPayload: Database["public"]["Tables"]["classes"]["Insert"] = {
    name,
    level,
    schedule: normalizedSchedule,
    teacher_id,
    created_at: now,
  };

  const classRows: Database["public"]["Tables"]["classes"]["Insert"][] = [classPayload];

  const { data, error } = await supabase
    .from("classes")
    // @ts-expect-error Supabase typings fail to infer Insert payload correctly with generated types
    .insert(classRows)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("createClassAction: failed to create class", error);
    const message = error.message ?? "Unable to create class. Please try again.";
    return { error: message, success: false, classId: null };
  }

  if (!data?.id) {
    return { error: "Class created, but no id returned. Please try again.", success: false, classId: null };
  }

  const classId = data.id;
  const studentIds = studentIdsResult.data;

  if (studentIds.length > 0) {
    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
      class_id: classId,
      updated_at: now,
    };
    const { error: assignmentError } = await supabase
      .from("profiles")
      // @ts-expect-error Supabase typings fail to infer Update payload
      .update(profileUpdate)
      .in("user_id", studentIds);

    if (assignmentError) {
      console.error("createClassAction: failed to assign students", assignmentError);
      return {
        error: "Class created, but assigning students failed. Please update the roster manually.",
        success: false,
        classId,
      };
    }
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${classId}`);
  studentIds.forEach((studentId) => {
    revalidatePath(`/dashboard/users/${studentId}`);
  });
  if (studentIds.length > 0) {
    revalidatePath("/dashboard/users");
  }

  return { error: null, success: true, classId };
}

const membershipSchema = z.object({
  user_id: z.string().uuid({ message: "Invalid user selection" }),
  class_id: z
    .union([z.string().uuid({ message: "Invalid class selection" }), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type UpdateClassMembershipState = ActionState;

export async function setClassMembershipAction(
  _prev: UpdateClassMembershipState,
  formData: FormData
): Promise<UpdateClassMembershipState> {
  const parsed = membershipSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message, success: false, classId: null };
  }

  const { user_id, class_id } = parsed.data;
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in.", success: false, classId: class_id ?? null };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("setClassMembershipAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions.", success: false, classId: class_id ?? null };
  }

  if ((actorProfile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Only admins can manage class memberships.", success: false, classId: class_id ?? null };
  }

  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("class_id")
    .eq("user_id", user_id)
    .maybeSingle<{ class_id: string | null }>();

  if (lookupError) {
    console.error("setClassMembershipAction: failed to load target profile", lookupError);
    return { error: "Unable to update membership. Please try again.", success: false, classId: class_id ?? null };
  }

  const previousClassId = existingProfile?.class_id ?? null;

  const membershipUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
    class_id,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("profiles")
    // @ts-expect-error Supabase typings fail to infer Update payload
    .update(membershipUpdate)
    .eq("user_id", user_id);

  if (updateError) {
    console.error("setClassMembershipAction: failed to update profile", updateError);
    const message = updateError.message ?? "Unable to update membership. Please try again.";
    return { error: message, success: false, classId: class_id ?? null };
  }

  if (previousClassId) {
    revalidatePath(`/dashboard/classes/${previousClassId}`);
  }
  if (class_id) {
    revalidatePath(`/dashboard/classes/${class_id}`);
  }
  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/users/${user_id}`);
  revalidatePath("/dashboard/users");

  return { error: null, success: true, classId: class_id ?? null };
}

const scheduleSchema = z.object({
  class_id: z.string().uuid({ message: "Invalid class id" }),
  schedule: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
});

export type UpdateClassScheduleState = ActionState;

export async function setClassScheduleAction(
  _prev: UpdateClassScheduleState,
  formData: FormData
): Promise<UpdateClassScheduleState> {
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message, success: false, classId: null };
  }

  const { class_id, schedule } = parsed.data;
  const { error: scheduleError, value: normalized } = normalizeScheduleInput(schedule);
  if (scheduleError) {
    return { error: scheduleError, success: false, classId: class_id };
  }

  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in.", success: false, classId: class_id };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("setClassScheduleAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions.", success: false, classId: class_id };
  }

  if ((actorProfile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Only admins can update the schedule.", success: false, classId: class_id };
  }

  const scheduleUpdate: Database["public"]["Tables"]["classes"]["Update"] = {
    schedule: normalized,
  };

  const { error: updateError } = await supabase
    .from("classes")
    // @ts-expect-error Supabase typings fail to infer Update payload
    .update(scheduleUpdate)
    .eq("id", class_id);

  if (updateError) {
    console.error("setClassScheduleAction: failed to update schedule", updateError);
    const message = updateError.message ?? "Unable to update schedule. Please try again.";
    return { error: message, success: false, classId: class_id };
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${class_id}`);

  return { error: null, success: true, classId: class_id };
}

const detailsSchema = z.object({
  class_id: z.string().uuid({ message: "Invalid class id" }),
  name: z
    .string()
    .trim()
    .min(1, { message: "Class name is required" }),
  level: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  teacher_id: z
    .union([z.string().uuid({ message: "Invalid teacher selection" }), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type UpdateClassDetailsState = ActionState;

export async function setClassDetailsAction(
  _prev: UpdateClassDetailsState,
  formData: FormData
): Promise<UpdateClassDetailsState> {
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message, success: false };
  }

  const { class_id, name, level, teacher_id } = parsed.data;

  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be signed in.", success: false };
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorError) {
    console.error("setClassDetailsAction: failed to load actor profile", actorError);
    return { error: "Unable to verify permissions.", success: false };
  }

  if ((actorProfile?.role ?? "").toLowerCase() !== "admin") {
    return { error: "Only admins can update classes.", success: false };
  }

  const detailsUpdate: Database["public"]["Tables"]["classes"]["Update"] = {
    name,
    level,
    teacher_id,
  };

  const { error: updateError } = await supabase
    .from("classes")
    // @ts-expect-error Supabase typings fail to infer Update payload
    .update(detailsUpdate)
    .eq("id", class_id);

  if (updateError) {
    console.error("setClassDetailsAction: update failed", updateError);
    const message = updateError.message ?? "Unable to update class. Please try again.";
    return { error: message, success: false, classId: class_id };
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${class_id}`);

  return { error: null, success: true, classId: class_id };
}
