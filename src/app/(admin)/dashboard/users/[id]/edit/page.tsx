import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

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
    .select("user_id, full_name, role, class_id, test_status")
    .eq("user_id", id)
    .maybeSingle<ProfileRow>();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("created_at", { ascending: true });

  if (error || !profile) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-neutral-900">Edit user</h1>
        <p className="text-sm text-neutral-600">
          Update roles, assign a class, or change their current test status.
        </p>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="space-y-6 text-sm text-neutral-700">
          <div>
            <div className="text-xs uppercase text-neutral-400">Full name</div>
            <div className="mt-1 text-neutral-900">{profile.full_name ?? "Unnamed user"}</div>
          </div>

          <div>
            <div className="text-xs uppercase text-neutral-400">Current role</div>
            <div className="mt-1 text-neutral-900">{profile.role ?? "student"}</div>
          </div>

          <div>
            <div className="text-xs uppercase text-neutral-400">Available classes</div>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-neutral-600">
              {((classes as ClassRow[] | null) ?? []).length === 0 ? (
                <li>No classes created yet.</li>
              ) : (
                ((classes as ClassRow[] | null) ?? []).map((item) => (
                  <li key={item.id}>
                    {item.name}
                    {item.level ? ` — Level ${item.level}` : ""}
                  </li>
                ))
              )}
            </ul>
          </div>

          <p className="text-xs text-neutral-500">
            Hook up these fields to a real form with Supabase mutations when you are ready.
          </p>
        </div>
      </section>
    </main>
  );
};

export default EditUserPage;
