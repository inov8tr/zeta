import type { Metadata } from "next";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import ConsultationServerForm from "@/components/consultation/ConsultationServerForm";

interface PageParams { lng?: string }
interface PageProps { params: Promise<PageParams> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { common } = getDictionaries(lng);
  const phone = common.footer?.phoneValue ?? "";
  return {
    title: "Book a Consultation | Zeta English Academy",
    description: `Schedule a consultation to plan your child's English journey at Zeta. Call ${phone} or request a callback.`,
  } satisfies Metadata;
}

export default async function EnrollmentPage({ params }: PageProps) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { enrollment } = getDictionaries(lng);

  return (
    <main className="bg-white pb-24 pt-28">
      <section className="mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-extrabold text-neutral-900">{enrollment.title}</h1>
        <p className="mt-4 text-lg text-neutral-700">{enrollment.intro}</p>
        <div className="mt-8">
          <ConsultationServerForm dictionary={enrollment} />
        </div>
      </section>
    </main>
  );
}
