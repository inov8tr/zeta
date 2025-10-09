import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import ConsultationFormCard from "@/components/consultation/ConsultationFormCard";
import StructuredData from "@/components/seo/StructuredData";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

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

        <div className="mt-10 max-w-3xl">
          <ConsultationFormCard dictionary={enrollment} />
        </div>
      </section>
    </main>
  );
};

export default EnrollmentPage;
