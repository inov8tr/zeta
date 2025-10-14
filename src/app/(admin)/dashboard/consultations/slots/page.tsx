import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { endOfMonth, format, startOfMonth } from "date-fns";

import ConsultationSlotManager from "@/components/admin/ConsultationSlotManager";
import { Database } from "@/lib/database.types";

type SlotRow = Database["public"]["Tables"]["consultation_slots"]["Row"];

const ConsultationSlotsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());

  const { data, error } = await supabase
    .from("consultation_slots")
    .select("id, slot_date, start_time, end_time, is_booked, booked_by, created_at")
    .gte("slot_date", format(start, "yyyy-MM-dd"))
    .lte("slot_date", format(end, "yyyy-MM-dd"))
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
        <AvailabilityStat label="This month" value={`${format(start, "MMM d")} – ${format(end, "MMM d")}`} />
        <AvailabilityStat label="Open slots" value={totals.open} accent="bg-brand-primary/10 text-brand-primary-dark" />
        <AvailabilityStat label="Booked" value={totals.booked} accent="bg-brand-accent/20 text-brand-accent-dark" />
      </section>

      <ConsultationSlotManager initialSlots={slots} />
    </main>
  );
};

const AvailabilityStat = ({
  label,
  value,
  accent = "bg-brand-primary/10 text-brand-primary-dark",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) => (
  <div className={`rounded-3xl px-5 py-6 text-center text-base font-semibold shadow-sm ${accent}`}>
    <div className="text-xs font-medium uppercase tracking-wide text-brand-primary/70">{label}</div>
    <div className="text-3xl font-bold text-brand-primary-dark">{value}</div>
  </div>
);

export default ConsultationSlotsPage;
