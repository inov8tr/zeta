import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import UserCreateForm from "@/components/admin/UserCreateForm";

const NewUserPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("name", { ascending: true });

  const classes = ((classData ?? []) as Array<{ id: string; name: string; level: string | null }>).map((item) => ({
    id: item.id,
    name: item.name,
    level: item.level,
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/users"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-primary transition hover:text-brand-primary-dark"
        >
          ← Back to users
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-brand-primary-dark">Create a new user</h1>
          <p className="text-sm text-neutral-muted">
            Create a Supabase auth user with a password the learner can use to sign in later.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <UserCreateForm classes={classes} classError={classError?.message ?? null} />
      </section>
    </main>
  );
};

export default NewUserPage;
