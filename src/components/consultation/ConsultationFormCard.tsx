"use client";

import ConsultationServerForm from "@/components/consultation/ConsultationServerForm";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import type { EnrollmentDictionary } from "@/lib/i18n";

type Props = {
  dictionary: EnrollmentDictionary;
  contactPhone?: string | null;
};

const ConsultationFormCard = ({ dictionary, contactPhone }: Props) => {
  const { session, loading, supabase } = useSupabaseSession();
  const card = dictionary.card;
  const metadata = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const initialFullName =
    session && typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0
      ? (metadata.full_name as string)
      : undefined;
  const initialUsername =
    session && typeof metadata.username === "string" && metadata.username.trim().length > 0
      ? (metadata.username as string)
      : undefined;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-neutral-900">
          {card?.heading ?? "Book your consultation & account"}
        </h2>
        <p className="text-sm text-neutral-600">
          {card?.description ??
            "Share your preferred schedule, then add an optional password to save this booking to a new account."}
        </p>
      </header>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            {card?.loading ?? "Loading form…"}
          </div>
        ) : (
          <>
            {!session && (
              <p className="mb-4 rounded-2xl bg-brand-primary/5 px-4 py-3 text-sm text-neutral-700">
                {card?.guestReminder ??
                  "Leave the password fields blank to continue as a guest, or set one to create your account while booking."}
              </p>
            )}
            <ConsultationServerForm
              dictionary={dictionary}
              contactPhone={contactPhone ?? undefined}
              initialFullName={initialFullName}
              initialEmail={session?.user.email ?? undefined}
              readOnlyEmail={Boolean(session?.user.email)}
              initialUsername={initialUsername}
              session={session}
              supabase={supabase}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ConsultationFormCard;
