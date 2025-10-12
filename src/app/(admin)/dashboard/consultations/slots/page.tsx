import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

type SlotRow = Database["public"]["Tables"]["consultation_slots"]["Row"];

const ConsultationSlotsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data, error } = await supabase
    .from("consultation_slots")
    .select("id, slot_date, start_time, end_time, is_booked, booked_by, created_at")
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load slots</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const slots = (data as SlotRow[] | null) ?? [];
  const totals = {
    total: slots.length,
    open: slots.filter((slot) => !slot.is_booked).length,
    booked: slots.filter((slot) => slot.is_booked).length,
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Consultation availability</h1>
        <p className="text-sm text-neutral-muted">
          Publish new times to keep the booking form open, or toggle slots off to avoid double-booking.
        </p>
      </header>

      <section className="grid gap-4 text-sm sm:grid-cols-3">
        <AvailabilityStat label="Total slots" value={totals.total} />
        <AvailabilityStat label="Open" value={totals.open} accent="bg-brand-primary/10 text-brand-primary-dark" />
        <AvailabilityStat label="Booked" value={totals.booked} accent="bg-brand-accent/20 text-brand-accent-dark" />
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Time</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {slots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-neutral-muted">
                    No slots published yet. Use the Supabase SQL editor or build a form to add availability.
                  </td>
                </tr>
              ) : (
                slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-brand-primary/5">
                    <td className="px-6 py-4 text-neutral-800">{format(new Date(slot.slot_date), "MMM d, yyyy")}</td>
                    <td className="px-6 py-4 text-neutral-800">{formatSlot(slot.start_time, slot.end_time)}</td>
                    <td className="px-6 py-4">
                      {slot.is_booked ? (
                        <span className="inline-flex rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">
                          Booked
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-brand-accent/20 px-3 py-1 text-xs font-semibold text-brand-accent-dark">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-muted">
                      {slot.created_at ? format(new Date(slot.created_at), "MMM d, yyyy p") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

const AvailabilityStat = ({
  label,
  value,
  accent = "bg-brand-primary/10 text-brand-primary-dark",
}: {
  label: string;
  value: number;
  accent?: string;
}) => (
  <div className={`rounded-3xl px-5 py-6 text-center text-base font-semibold shadow-sm ${accent}`}>
    <div className="text-xs font-medium uppercase tracking-wide text-brand-primary/70">{label}</div>
    <div className="text-3xl font-bold text-brand-primary-dark">{value}</div>
  </div>
);

const formatSlot = (start: string | null, end: string | null) => {
  if (!start && !end) {
    return "Unscheduled";
  }
  if (start && end) {
    return `${start} → ${end}`;
  }
  return start ?? end ?? "Unscheduled";
};

export default ConsultationSlotsPage;
