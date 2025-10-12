import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

const ConsultationsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data, error } = await supabase
    .from("consultations")
    .select(
      "id, full_name, email, phone, status, created_at, message, consultation_slots(slot_date, start_time, end_time)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Consultations unavailable</h1>
        <p className="text-sm text-neutral-600">
          {error.message} — check your Supabase permissions or try again later.
        </p>
      </main>
    );
  }

  const consultations = data ?? [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Consultations</h1>
          <p className="text-sm text-neutral-600">
            Review booking requests, manage statuses, and jump into availability planning.
          </p>
        </div>
        <Link
          href="/dashboard/consultations/slots"
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
        >
          Manage availability
        </Link>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Contact</th>
                <th className="px-6 py-3 text-left font-semibold">Requested slot</th>
                <th className="px-6 py-3 text-left font-semibold">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                    No consultations yet. Open up slots to start accepting bookings.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => {
                  const slot = Array.isArray(item.consultation_slots)
                    ? item.consultation_slots[0]
                    : item.consultation_slots;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{item.full_name ?? "Unknown"}</div>
                        <div className="text-xs text-neutral-500">{item.message}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status ?? "pending"} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-700">{item.email}</p>
                        {item.phone ? <p className="text-xs text-neutral-500">{item.phone}</p> : null}
                      </td>
                      <td className="px-6 py-4 text-neutral-700">
                        {slot ? (
                          <>
                            <div>{formatSlot(slot.start_time, slot.end_time)}</div>
                            <div className="text-xs text-neutral-500">{formatDate(slot.slot_date)}</div>
                          </>
                        ) : (
                          <span className="text-xs text-neutral-400">No slot selected</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy p") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const palette: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const style = palette[status] ?? "bg-neutral-200 text-neutral-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>;
};

const formatSlot = (start: string | null, end: string | null) => {
  if (!start && !end) {
    return "Unscheduled";
  }
  if (start && end) {
    return `${start} → ${end}`;
  }
  return start ?? end ?? "Unscheduled";
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "";
  }
  return format(new Date(date), "MMM d, yyyy");
};

export default ConsultationsPage;
