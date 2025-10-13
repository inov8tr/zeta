import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Consultation {
  id: string;
  status: string;
  preferred_start: string | null;
  preferred_end: string | null;
  timezone: string | null;
}

interface ConsultationCardProps {
  consultation: Consultation | null;
}

export default function ConsultationCard({ consultation }: ConsultationCardProps) {
  if (!consultation) {
    return (
      <section className="h-full rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Book a consultation</h2>
        <p className="mt-2 text-sm text-neutral-muted">
          Schedule a consultation to discuss your results, goals, and next steps with your teacher.
        </p>
        <Link
          href="/enrollment"
          className="mt-4 inline-flex items-center rounded-full border border-transparent bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
        >
          Request a consultation
        </Link>
      </section>
    );
  }

  const start = consultation.preferred_start ? new Date(consultation.preferred_start) : null;
  const readableDate = start ? format(start, "EEE, MMM d • h:mm a") : null;
  const countdown = start ? formatDistanceToNow(start, { addSuffix: true }) : null;

  return (
    <section className="h-full rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Upcoming consultation</h2>
      <div className="mt-4 space-y-2 text-sm text-neutral-800">
        <p>
          <span className="font-medium text-brand-primary-dark">Status:</span> {consultation.status}
        </p>
        <p>
          <span className="font-medium text-brand-primary-dark">When:</span> {readableDate ?? "To be confirmed"}
        </p>
        {consultation.timezone ? (
          <p>
            <span className="font-medium text-brand-primary-dark">Timezone:</span> {consultation.timezone}
          </p>
        ) : null}
        {countdown ? (
          <p className="text-xs uppercase tracking-wide text-brand-primary/70">Starts {countdown}</p>
        ) : null}
      </div>
      <Link
        href="/dashboard/consultations"
        className="mt-4 inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
      >
        View all consultations
      </Link>
    </section>
  );
}

