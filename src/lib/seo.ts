import type { Metadata } from "next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage, getDictionaries } from "@/lib/i18n";

const SITE_NAME = "Zeta English Academy";

// ✅ Updated fallback domain to .com
const FALLBACK_URL = "https://www.zeta-eng.com";

// ✅ Uses env var if defined (recommended for Vercel)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL).replace(/\/$/, "");
export const DEFAULT_OG_IMAGE = "/opengraph-image";

// ✅ English + Korean SEO keywords
const DEFAULT_KEYWORDS = [
  // English
  "English academy Seoul",
  "English classes for kids",
  "Reading lab",
  "Grammar lessons",
  "Discussion class",
  "Writing workshop",
  "Zeta English Academy",
  "ESL programs Korea",
  "Academic English",
  "K-12 English education",
  "English speaking practice",

  // Korean
  "서울 영어학원",
  "아이 영어수업",
  "리딩 학습",
  "문법 수업",
  "토론 수업",
  "영어 글쓰기 워크숍",
  "제타 영어학원",
  "초중고 영어교육",
  "어린이 영어학원",
  "영어 말하기 연습",
  "국제학교 영어",
];

const OG_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: "en_US",
  ko: "ko_KR",
};

export const defaultKeywords = DEFAULT_KEYWORDS;

// ✅ Builds full absolute URL
export function absoluteUrl(path = ""): string {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${SITE_URL}${normalizedPath}`;
}

// ✅ Merge page-specific keywords with defaults
function mergeKeywords(custom?: string[]): string[] | undefined {
  if (!custom || custom.length === 0) {
    return DEFAULT_KEYWORDS;
  }
  const merged = new Set<string>([...custom, ...DEFAULT_KEYWORDS]);
  return Array.from(merged);
}

// ✅ Language-specific alternates for canonical and hreflang
function getAlternateLanguages(pathSegment: string, current: SupportedLanguage) {
  const languages: Record<string, string> = {};
  for (const lng of SUPPORTED_LANGUAGES) {
    languages[lng] = absoluteUrl(`/${lng}${pathSegment}`);
  }
  languages["x-default"] = languages.en ?? absoluteUrl(`/en${pathSegment}`);
  return {
    canonical: languages[current],
    languages,
  };
}

// ✅ Builds OpenGraph locale settings
function getOpenGraphLocales(current: SupportedLanguage) {
  const currentLocale = OG_LOCALE_MAP[current] ?? "en_US";
  const alternateLocales = SUPPORTED_LANGUAGES
    .filter((lng) => lng !== current)
    .map((lng) => OG_LOCALE_MAP[lng] ?? "en_US");
  return { currentLocale, alternateLocales };
}

type LocalizedMetadataOptions = {
  lng: SupportedLanguage;
  path?: string;
  title: string;
  description: string;
  useTitleTemplate?: boolean;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  robots?: Metadata["robots"];
};

// ✅ Localized Metadata Builder
export function buildLocalizedMetadata(options: LocalizedMetadataOptions): Metadata {
  const { lng, title, description, useTitleTemplate, keywords, robots } = options;
  const pathSegment = options.path ? (options.path.startsWith("/") ? options.path : `/${options.path}`) : "";
  const pageUrl = absoluteUrl(`/${lng}${pathSegment}`);
  const imageUrl = absoluteUrl(options.image ?? DEFAULT_OG_IMAGE);
  const imageAlt = options.imageAlt ?? `${SITE_NAME} - ${title}`;
  const { currentLocale, alternateLocales } = getOpenGraphLocales(lng);

  const baseMetadata: Metadata = {
    title: useTitleTemplate === false ? { absolute: title } : title,
    description,
    keywords: mergeKeywords(keywords),
    alternates: getAlternateLanguages(pathSegment, lng),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      locale: currentLocale,
      alternateLocale: alternateLocales,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };

  if (robots) {
    baseMetadata.robots = robots;
  }

  return baseMetadata;
}

// ✅ Default Metadata Builder (for static / non-localized pages)
type BasicMetadataOptions = {
  path?: string;
  title: string;
  description: string;
  useTitleTemplate?: boolean;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  robots?: Metadata["robots"];
};

export function buildBasicMetadata(options: BasicMetadataOptions): Metadata {
  const { title, description, useTitleTemplate, keywords, robots } = options;
  const pathSegment = options.path ? (options.path.startsWith("/") ? options.path : `/${options.path}`) : "";
  const pageUrl = absoluteUrl(pathSegment || "/");
  const imageUrl = absoluteUrl(options.image ?? DEFAULT_OG_IMAGE);
  const imageAlt = options.imageAlt ?? `${SITE_NAME} - ${title}`;

  const baseMetadata: Metadata = {
    title: useTitleTemplate === false ? { absolute: title } : title,
    description,
    keywords: mergeKeywords(keywords),
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };

  if (robots) {
    baseMetadata.robots = robots;
  }

  return baseMetadata;
}

// ✅ Schema.org structured data
export function getOrganizationStructuredData() {
  const { common } = getDictionaries("en");
  const footer = common.footer ?? {};
  const socialUrls = [
    footer.social?.instagramUrl,
    footer.social?.youtubeUrl,
    footer.social?.naverUrl,
  ].filter((value): value is string => Boolean(value));

  const contactPoint = footer.phoneValue
    ? [
        {
          "@type": "ContactPoint",
          telephone: footer.phoneValue,
          contactType: "customer service",
          areaServed: ["KR"],
          availableLanguage: ["en", "ko"],
        },
      ]
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/images/ZetaLogo.svg"),
    sameAs: socialUrls,
    email: footer.emailValue,
    telephone: footer.phoneValue,
    address: footer.address
      ? {
          "@type": "PostalAddress",
          streetAddress: footer.address,
          addressCountry: "KR",
        }
      : undefined,
    contactPoint,
  };
}
