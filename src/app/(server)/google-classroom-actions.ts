"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { deleteGoogleToken } from "@/lib/google/tokenStore";

export async function disconnectGoogleClassroomAction() {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("disconnectGoogleClassroomAction: session error", sessionError);
  }

  if (!session) {
    return { error: "You must be signed in." };
  }

  try {
    await deleteGoogleToken(supabase, session.user.id);
    return { success: "Google Classroom disconnected." };
  } catch (error) {
    console.error("disconnectGoogleClassroomAction: failed to delete token", error);
    return { error: "We couldn’t disconnect Google Classroom. Please try again." };
  }
}
