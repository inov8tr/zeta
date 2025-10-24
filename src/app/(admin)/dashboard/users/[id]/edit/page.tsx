import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import UserEditForm from "@/components/admin/UserEditForm";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

const EditUserPage = async ({ params }: EditUserPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, role, class_id, test_status, classroom_enabled")
    .eq("user_id", id)
    .maybeSingle<ProfileRow>();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("created_at", { ascending: true });

  if (error || !profile) {
    notFound();
  }

  const classOptions = (classes as ClassRow[] | null) ?? [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Edit user</h1>
        <p className="text-sm text-neutral-muted">
          Update roles, assign a class, or change their current test status.
        </p>
      </header>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <UserEditForm
          profile={{
            user_id: profile.user_id,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            class_id: profile.class_id,
            test_status: profile.test_status,
            classroom_enabled: profile.classroom_enabled ?? false,
          }}
          classes={classOptions.map((item) => ({ id: item.id, name: item.name, level: item.level }))}
        />
      </section>
    </main>
  );
};

export default EditUserPage;
