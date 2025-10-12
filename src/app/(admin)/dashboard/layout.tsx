import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import AdminShell from "@/components/admin/AdminShell";

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

const AdminDashboardLayout = async ({ children }: AdminDashboardLayoutProps) => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
};

export default AdminDashboardLayout;
