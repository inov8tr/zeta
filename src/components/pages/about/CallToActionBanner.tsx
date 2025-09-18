import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AboutDictionary, SupportedLanguage } from "@/lib/i18n";

interface CallToActionBannerProps {
  lng: SupportedLanguage;
  dictionary: AboutDictionary["cta"];
}

const CallToActionBanner: React.FC<CallToActionBannerProps> = ({ lng, dictionary }) => {
  if (!dictionary) {
    return null;
  }

  const { title, description, primary, href } = dictionary;
  const targetHref = href?.startsWith("/") ? `/${lng}${href}` : `/${lng}/${href ?? ""}`;

  return (
    <section className="bg-brand-primary py-20 text-white" id="cta">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        {description && <p className="mt-4 text-lg text-white/85">{description}</p>}
        {primary && href && (
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              className="inline-flex items-center gap-2 bg-brand-accent text-gray-900 shadow-lg shadow-brand-accent/30 hover:bg-brand-accent-dark"
            >
              <Link href={targetHref}>
                {primary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CallToActionBanner;
