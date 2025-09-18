import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

const roleRedirectMap: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

export const dynamic = "force-dynamic";

export default async function OAuthCallbackPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?error=oauth");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  if (profileError) {
    console.error(profileError);
    redirect("/login?error=oauth");
  }

  const role = profile?.role?.toLowerCase();
  const nextPath = role ? roleRedirectMap[role] : null;

  if (!nextPath) {
    redirect("/login?error=role");
  }

  redirect(nextPath);
}
