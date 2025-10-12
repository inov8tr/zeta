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
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(),
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  if (error || profile?.role !== "admin") {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
};

export default AdminDashboardLayout;
