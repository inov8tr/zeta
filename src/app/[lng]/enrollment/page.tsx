import Link from "next/link";
import { MapPin } from "lucide-react";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import ConsultationFormCard from "@/components/consultation/ConsultationFormCard";
import StructuredData from "@/components/seo/StructuredData";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

const SMART_PLACE_URL = "https://map.naver.com/p/entry/place/1475124508?placePath=%2Fhome&entry=plt";

type PageParams = { lng?: string };

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { common } = getDictionaries(lng);
  const phone = common.footer?.phoneValue ?? "";
  const description = phone
    ? `Schedule a consultation to plan your child's English journey at Zeta. Call ${phone} or request a callback.`
    : "Schedule a consultation to plan your child's English journey at Zeta English Academy.";

  return buildLocalizedMetadata({
    lng,
    path: "/enrollment",
    title: "Book a Consultation",
    description,
    keywords: ["consultation", "enrollment", "English academy"],
    image: "/images/pages/home/SS.svg",
    imageAlt: "Book a consultation at Zeta English Academy",
  });
}

const EnrollmentPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { enrollment, common } = getDictionaries(lng);
  const naverCard = enrollment.naverCard;
  const naverUrl = common.footer?.social?.naverUrl ?? SMART_PLACE_URL;
  const smartPlace = common.footer?.smartPlace;
  const smartPlaceMapUrl = smartPlace?.mapUrl ?? SMART_PLACE_URL;

  return (
    <main className="bg-white pb-24 pt-28">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: common.menu?.home ?? "Home",
              item: absoluteUrl(`/${lng}`),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: enrollment.title,
              item: absoluteUrl(`/${lng}/enrollment`),
            },
          ],
        }}
      />
      <section className="mx-auto max-w-5xl px-4">
        <h1 className="text-4xl font-extrabold text-neutral-900">{enrollment.title}</h1>
        <p className="mt-4 text-lg text-neutral-700">{enrollment.intro}</p>

        <div className="mt-10 max-w-3xl space-y-6">
          <ConsultationFormCard dictionary={enrollment} contactPhone={common.footer?.phoneValue} />

          {naverCard && smartPlaceMapUrl ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <header className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary shadow-sm">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-semibold text-brand-primary-dark">
                    {naverCard.heading}
                  </h2>
                  {naverCard.description ? (
                    <p className="text-sm text-neutral-700">
                      {naverCard.description}
                    </p>
                  ) : null}
                  {common.footer?.address ? (
                    <address className="text-sm font-medium not-italic text-neutral-900">
                      {common.footer.address}
                    </address>
                  ) : null}
                </div>
              </header>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={smartPlaceMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  {naverCard.directionsCta}
                </Link>

                <Link
                  href={naverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                >
                  {naverCard.viewCta}
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default EnrollmentPage;
