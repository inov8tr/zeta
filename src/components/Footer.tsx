import Link from "next/link";
import { Instagram, Youtube, PenSquare, Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import type { CommonDictionary, SupportedLanguage } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

interface FooterProps {
  lng: SupportedLanguage;
  dictionary: CommonDictionary["footer"];
}

const quickLinkPaths = {
  home: "",
  program: "/program",
  about: "/about",
  book: "/enrollment",
  search: "/search",
} as const;

type QuickLinkKey = keyof typeof quickLinkPaths;

const organizationName = "Zeta English Academy";

const Footer = ({ lng, dictionary }: FooterProps) => {
  const {
    contactHeading,
    phoneLabel,
    phoneValue,
    emailLabel,
    emailValue,
    kakaoLabel,
    kakaoValue,
    locationHeading,
    address,
    quickLinksHeading,
    quickLinks,
    socialHeading,
    social,
    rightsReserved,
    approvedResources,
  } = dictionary;

  const basePath = `/${lng}`;
  const googleMapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : undefined;

  const mappedQuickLinks = quickLinks
    ? (Object.entries(quickLinks) as Array<[QuickLinkKey, string]>).filter(([, label]) => Boolean(label))
    : [];

  return (
    <footer
      className="bg-[#1f2933] py-16 text-white"
      itemScope
      itemType="https://schema.org/EducationalOrganization"
    >
      <meta itemProp="name" content={organizationName} />
      <meta itemProp="url" content={absoluteUrl(`/${lng}`)} />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-5">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{contactHeading}</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            {phoneValue && (
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brand-accent" />
                <a
                  href={`tel:${phoneValue.replace(/[^\d+]/g, "")}`}
                  className="hover:text-white"
                  itemProp="telephone"
                >
                  <span className="sr-only">{phoneLabel}</span>
                  {phoneValue}
                </a>
              </li>
            )}
            {emailValue && (
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-brand-accent" />
                <a
                  href={`mailto:${emailValue}`}
                  className="hover:text-white"
                  itemProp="email"
                >
                  <span className="sr-only">{emailLabel}</span>
                  {emailValue}
                </a>
              </li>
            )}
            {kakaoValue && (
              <li className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-brand-accent" />
                <span>
                  <span className="sr-only">{kakaoLabel}</span>
                  {kakaoValue}
                </span>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold">{locationHeading}</h4>
          {address && (
            <address className="text-sm not-italic text-gray-300" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <span className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-brand-accent" />
                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                    itemProp="streetAddress"
                  >
                    {address}
                  </a>
                ) : (
                  <span itemProp="streetAddress">{address}</span>
                )}
              </span>
            </address>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold">{quickLinksHeading}</h4>
          <nav aria-label={quickLinksHeading ?? "Quick links"}>
            <ul className="space-y-2 text-sm text-gray-300">
              {mappedQuickLinks.map(([key, label]) => (
                <li key={key}>
                  <Link
                    href={`${basePath}${quickLinkPaths[key]}`}
                    className="hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {approvedResources?.links?.length ? (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{approvedResources.heading}</h4>
            <nav aria-label={approvedResources.heading}>
              <ul className="space-y-2 text-sm text-gray-300">
                {approvedResources.links.map((resource) => (
                  <li key={resource.href}>
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      {resource.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        ) : null}

        <div className="space-y-4">
          <h4 className="text-lg font-semibold">{socialHeading}</h4>
          <div className="flex flex-wrap gap-4 text-gray-300">
            {social?.instagramUrl && (
              <Link
                href={social.instagramUrl}
                className="flex items-center hover:text-white"
                aria-label={social.instagramLabel}
                rel="noopener noreferrer nofollow"
                itemProp="sameAs"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{social.instagramLabel}</span>
              </Link>
            )}
            {social?.youtubeUrl && (
              <Link
                href={social.youtubeUrl}
                className="flex items-center hover:text-white"
                aria-label={social.youtubeLabel}
                rel="noopener noreferrer nofollow"
                itemProp="sameAs"
              >
                <Youtube className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{social.youtubeLabel}</span>
              </Link>
            )}
            {social?.naverUrl && (
              <Link
                href={social.naverUrl}
                className="flex items-center hover:text-white"
                aria-label={social.naverLabel}
                rel="noopener noreferrer nofollow"
                itemProp="sameAs"
              >
                <PenSquare className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{social.naverLabel}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Zeta English Academy. {rightsReserved}
      </p>
    </footer>
  );
};

export default Footer;
