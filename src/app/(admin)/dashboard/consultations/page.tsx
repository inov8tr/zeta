import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import ConsultationActions from "@/components/admin/ConsultationActions";

type ConsultationRow = Database["public"]["Tables"]["consultations"]["Row"];
type RequestedSlot = { id: string; slot_date: string; start_time: string | null; end_time: string | null };

type EnhancedConsultation = ConsultationRow & {
  consultation_slots: RequestedSlot | RequestedSlot[] | null;
};

type SlotRowLite = {
  id: string;
  slot_date: string;
  start_time: string | null;
  end_time: string | null;
  is_booked: boolean;
};

const ConsultationsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data, error } = await supabase
    .from("consultations")
    .select(
      "id, user_id, slot_id, full_name, email, phone, status, created_at, notes, preferred_start, preferred_end, consultation_slots(id, slot_date, start_time, end_time)"
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

  const consultations = (data as EnhancedConsultation[] | null) ?? [];

  const { data: slotRowData } = await supabase
    .from("consultation_slots")
    .select("id, slot_date, start_time, end_time, is_booked")
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  const slotRows = (slotRowData as SlotRowLite[] | null) ?? [];

  const requestedSlots = consultations.filter((item) => item.consultation_slots);
  const noSlotRequests = consultations.filter((item) => !item.consultation_slots);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-primary-dark">Consultations</h1>
          <p className="text-sm text-neutral-muted">
            Track bookings, follow up on pending requests, and keep availability under control.
          </p>
        </div>
        <Link
          href="/dashboard/consultations/slots"
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Manage availability
        </Link>
      </header>

      <section className="space-y-8">
        <ConsultationCard title="Requested slots" consultations={requestedSlots} slotRows={slotRows} />
        <ConsultationCard
          title="Requests without slot"
          consultations={noSlotRequests}
          slotRows={slotRows}
          showPreferredWindow
        />
      </section>
    </main>
  );
};

const ConsultationCard = ({
  title,
  consultations,
  slotRows,
  showPreferredWindow = false,
}: {
  title: string;
  consultations: EnhancedConsultation[];
  slotRows: SlotRowLite[];
  showPreferredWindow?: boolean;
}) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">{title}</h2>
      <p className="text-xs text-neutral-muted">
        {title === "Requested slots"
          ? "Parents picked a slot — confirm or adjust if needed."
          : "No slot assigned yet. Use the preferred window to suggest a time."}
      </p>
    </header>
    <div className="divide-y divide-brand-primary/10">
      {consultations.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-muted">
          No consultations in this list.
        </div>
      ) : (
        consultations.map((item) => {
          const slot = Array.isArray(item.consultation_slots)
            ? item.consultation_slots[0]
            : item.consultation_slots;
          const currentSlotId = slot?.id ?? item.slot_id ?? null;
          const slotSummary = slot
            ? formatReservedSlot(slot)
            : item.preferred_start
              ? formatPreferredWindow(item.preferred_start, item.preferred_end)
              : "No slot selected";
          const slotOptions = buildSlotOptions(slotRows, currentSlotId);

          return (
            <article
              key={item.id}
              className="grid gap-4 px-6 py-4 text-sm text-neutral-800 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)]"
            >
              <div>
                <div className="font-medium text-brand-primary-dark">{item.full_name ?? "Unknown"}</div>
                <div className="text-xs text-neutral-muted">{item.email}</div>
                {item.phone ? <div className="text-xs text-neutral-muted">{item.phone}</div> : null}
                {item.notes ? <p className="mt-2 text-xs text-neutral-muted">{item.notes}</p> : null}
              </div>
              <div className="flex flex-col gap-1">
                <StatusBadge status={item.status ?? "pending"} />
                <span className="text-xs text-neutral-muted">
                  Requested {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy p") : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-neutral-muted">
                <span className="text-sm font-semibold text-brand-primary-dark">
                  {slot ? "Reserved slot" : showPreferredWindow ? "Suggested window" : "Requested slot"}
                </span>
                <span>{slotSummary}</span>
              </div>
              <div>
                <ConsultationActions
                  consultationId={item.id}
                  currentStatus={item.status ?? "pending"}
                  currentSlotId={currentSlotId}
                  slotOptions={slotOptions}
                />
              </div>
            </article>
          );
        })
      )}
    </div>
  </section>
);

const StatusBadge = ({ status }: { status: string }) => {
  const palette: Record<string, string> = {
    pending: "bg-brand-accent/20 text-brand-accent-dark",
    confirmed: "bg-brand-primary/15 text-brand-primary-dark",
    cancelled: "bg-rose-100 text-rose-700",
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

const formatReservedSlot = (slot: RequestedSlot) => {
  const timeRange = formatSlot(slot.start_time, slot.end_time);
  const day = formatDate(slot.slot_date);
  return `${day} • ${timeRange}`;
};

const formatPreferredWindow = (start: string | null, end: string | null) => {
  if (!start) {
    return "No preferred window provided";
  }
  const startLabel = format(new Date(start), "MMM d, yyyy p");
  const endLabel = end ? format(new Date(end), "MMM d, yyyy p") : null;
  return endLabel ? `${startLabel} → ${endLabel}` : startLabel;
};

const buildSlotOptions = (rows: SlotRowLite[], currentSlotId: string | null): { id: string; label: string }[] =>
  rows
    .filter((row) => !row.is_booked || row.id === currentSlotId)
    .map((row) => ({
      id: row.id,
      label: `${formatSlot(row.start_time, row.end_time)} • ${formatDate(row.slot_date)}`,
    }));

export default ConsultationsPage;
