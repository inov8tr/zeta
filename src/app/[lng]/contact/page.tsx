import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";

type PageParams = { lng?: string }

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { common } = getDictionaries(lng);
  const phone = common.footer?.phoneValue ?? "";
  return {
    title: "Contact | Zeta English Academy",
    description: `Contact Zeta English Academy. Call ${phone}, email us, or visit our academy in Seoul.`,
  } satisfies Metadata;
}

const ContactPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { common } = getDictionaries(lng);
  const f = common.footer;

  const telHref = f.phoneValue ? `tel:${f.phoneValue.replace(/[^\d+]/g, "")}` : undefined;
  const mailHref = f.emailValue ? `mailto:${f.emailValue}` : undefined;

  return (
    <main className="bg-white pb-24 pt-28">
      <section className="mx-auto max-w-5xl px-4">
        <h1 className="text-4xl font-extrabold text-neutral-900">Contact Us</h1>
        <p className="mt-4 text-lg text-neutral-700">We’ll help you choose the right path for your learner.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Call / Kakao</h2>
            <p className="mt-2 text-sm text-neutral-600">Reach us directly during business hours.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {telHref && (
                <Button asChild>
                  <Link href={telHref}>{f.phoneValue}</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="https://pf.kakao.com">{f.kakaoValue ?? "KakaoTalk"}</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Email</h2>
            <p className="mt-2 text-sm text-neutral-600">We usually respond within one business day.</p>
            {mailHref && (
              <div className="mt-4">
                <Button asChild>
                  <Link href={mailHref}>{f.emailValue}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Visit Us</h2>
            {f.address && <p className="mt-2 text-sm text-neutral-700">{f.address}</p>}
            <p className="mt-2 text-xs text-neutral-500">Please call ahead to schedule a visit.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
