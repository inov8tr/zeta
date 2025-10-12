import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { updateConsultationStatusAction } from "@/app/(server)/consultation-actions";
import { createAdminClient } from "@/lib/supabaseAdmin";

type Status = "pending" | "confirmed" | "cancelled";

interface ConsultationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  type?: "consultation" | "entrance_test" | null;
  preferred_start: string;
  preferred_end: string | null;
  timezone: string | null;
  status: Status;
  notes: string | null;
  username: string | null;
  user_type: string | null;
  created_at: string;
}

const STATUS_ORDER: Status[] = ["pending", "confirmed", "cancelled"];

const AdminDashboard = async ({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) => {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session!.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("consultations")
    .select(
      "id, full_name, email, phone, type, preferred_start, preferred_end, timezone, status, notes, username, user_type, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Failed to load consultations</h1>
        <pre className="w-full overflow-auto rounded-2xl bg-red-50 p-4 text-left text-sm text-red-800">
          {error.message}
        </pre>
      </main>
    );
  }

  const rows: ConsultationRow[] = data ?? [];
  const totals = STATUS_ORDER.reduce<Record<Status, number>>((acc, status) => {
    acc[status] = rows.filter((row) => row.status === status).length;
    return acc;
  }, { pending: 0, confirmed: 0, cancelled: 0 });

  const { status: statusFilter } = await searchParams;
  const filteredRows = statusFilter && STATUS_ORDER.includes(statusFilter as Status)
    ? rows.filter((row) => row.status === statusFilter)
    : rows;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900">Consultation Dashboard</h1>
          <p className="text-sm text-neutral-600">
            {rows.length} total consultations — {totals.pending} pending, {totals.confirmed} confirmed, {totals.cancelled} cancelled.
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          <FilterLink label="All" active={!statusFilter} />
          {STATUS_ORDER.map((status) => (
            <FilterLink key={status} label={status} status={status} active={statusFilter === status} />
          ))}
        </nav>
      </header>

      <section className="mt-10 grid gap-3">
        {filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            No consultations match this filter.
          </div>
        ) : (
          filteredRows.map((row) => <ConsultationCard key={row.id} row={row} />)
        )}
      </section>
    </main>
  );
};

const FilterLink = ({ label, status, active }: { label: string; status?: Status; active: boolean }) => {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  const href = params.toString() ? `/admin?${params.toString()}` : "/admin";
  return (
    <a
      href={href}
      className={
        "rounded-full px-4 py-2 transition" +
        (active
          ? " bg-neutral-900 text-white"
          : " border border-neutral-300 text-neutral-700 hover:border-neutral-400")
      }
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </a>
  );
};

const ConsultationCard = ({ row }: { row: ConsultationRow }) => {
  const statusStyles: Record<Status, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const typeLabel =
    row.type === "entrance_test"
      ? { label: "Entrance Test", style: "bg-indigo-100 text-indigo-800" }
      : { label: "Consultation", style: "bg-sky-100 text-sky-800" };

  const start = format(new Date(row.preferred_start), "PPP p");
  const end = row.preferred_end ? format(new Date(row.preferred_end), "PPP p") : null;
  const userTypeLabel = row.user_type
    ? row.user_type.charAt(0).toUpperCase() + row.user_type.slice(1)
    : null;

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{row.full_name}</h2>
          <p className="text-sm text-neutral-600">{row.email}</p>
          {row.phone && <p className="text-sm text-neutral-600">{row.phone}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {row.username ? (
            <span className="inline-flex items-center rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase text-neutral-700">
              Username: {row.username}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${typeLabel.style}`}
          >
            {typeLabel.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusStyles[row.status]}`}
          >
            {row.status}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-neutral-900">Preferred time</dt>
          <dd>{start}{end ? ` → ${end}` : ""}{row.timezone ? ` (${row.timezone})` : ""}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-900">Submitted</dt>
          <dd>{format(new Date(row.created_at), "PPP p")}</dd>
        </div>
        {row.username ? (
          <div>
            <dt className="font-medium text-neutral-900">Username</dt>
            <dd>{row.username}</dd>
          </div>
        ) : null}
        {userTypeLabel ? (
          <div>
            <dt className="font-medium text-neutral-900">User type</dt>
            <dd>{userTypeLabel}</dd>
          </div>
        ) : null}
        {row.notes && (
          <div className="sm:col-span-2">
            <dt className="font-medium text-neutral-900">Notes</dt>
            <dd className="whitespace-pre-wrap text-neutral-700">{row.notes}</dd>
          </div>
        )}
      </dl>

      <StatusActions id={row.id} currentStatus={row.status} />
    </article>
  );
};

const StatusActions = ({ id, currentStatus }: { id: string; currentStatus: Status }) => {
  const actions: { label: string; status: Status; style: string }[] = [
    { label: "Mark Pending", status: "pending", style: "border border-amber-300 text-amber-700 hover:bg-amber-50" },
    { label: "Confirm", status: "confirmed", style: "bg-emerald-600 text-white hover:bg-emerald-700" },
    { label: "Cancel", status: "cancelled", style: "bg-rose-600 text-white hover:bg-rose-700" },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {actions.map(({ label, status, style }) => (
        <form key={status} action={updateConsultationStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${style} ${status === currentStatus ? "opacity-60" : ""}`}
            disabled={status === currentStatus}
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
};

export default AdminDashboard;
