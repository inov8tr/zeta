"use client";

import ConsultationServerForm from "@/components/consultation/ConsultationServerForm";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import { getDictionaries } from "@/lib/i18n";

type ConsultationDictionary = Awaited<ReturnType<typeof getDictionaries>>["enrollment"];

type Props = {
  dictionary: ConsultationDictionary;
};

const ConsultationFormCard = ({ dictionary }: Props) => {
  const { session, loading, supabase } = useSupabaseSession();

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-neutral-900">Book your consultation &amp; account</h2>
        <p className="text-sm text-neutral-600">
          Share your preferred schedule, then add an optional password to save this booking to a new account.
        </p>
      </header>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            Loading form…
          </div>
        ) : (
          <>
            {!session && (
              <p className="mb-4 rounded-2xl bg-brand-primary/5 px-4 py-3 text-sm text-neutral-700">
                Leave the password fields blank to continue as a guest, or set one to create your account while booking.
              </p>
            )}
            <ConsultationServerForm
              dictionary={dictionary}
              initialFullName={
                session ? ((session.user.user_metadata as Record<string, unknown>)?.full_name as string | undefined) : undefined
              }
              initialEmail={session?.user.email ?? undefined}
              readOnlyEmail={Boolean(session?.user.email)}
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
