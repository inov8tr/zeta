"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type UpdateUserProfileState = {
  error: string | null;
};

const ROLE_OPTIONS = ["admin", "teacher", "student", "parent"] as const;

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

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid form submission";
    return { error: message };
  }

  const { user_id, full_name, phone, role, class_id, test_status } = parsed.data;

  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: async () => cookieStore,
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
