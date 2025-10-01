import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../lib/database.types";

const roleRedirectMap: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

export const dynamic = "force-dynamic";

export default async function OAuthCallbackPage() {
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(),
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?error=oauth");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>(); // narrow result type

  if (error || !data?.role) {
    console.error(error || "No role found");
    redirect("/login?error=role");
  }

  const role = data.role.toLowerCase();
  const nextPath = roleRedirectMap[role];

  if (!nextPath) {
    redirect("/login?error=role");
  }

  redirect(nextPath);
}
