"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { SUPPORTED_LANGUAGES, type CommonDictionary, type SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/utils/classNames";

interface MenuBarProps {
  lng: SupportedLanguage;
  dictionary: CommonDictionary;
}

const PRIMARY_LINK_KEYS = ["home", "about", "program", "blog"] as const;

const MenuBar = ({ lng, dictionary }: MenuBarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname() || "/";

  const currentLanguageLabel = dictionary.language?.[lng] ?? lng.toUpperCase();

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const basePath = `/${lng}`;
  const academyName = lng === "ko" ? "제타영어학원" : "Zeta English Academy";

  const mappedLinks = PRIMARY_LINK_KEYS.map((key) => {
    const hrefSuffix =
      key === "home" ? "" : key === "program" ? "/program" : key === "about" ? "/about" : "/blog";
    const href = `${basePath}${hrefSuffix}`;
    const isActive =
      key === "home"
        ? pathname === href
        : key === "program"
          ? pathname.startsWith(`${basePath}/program`)
          : key === "about"
            ? pathname.startsWith(`${basePath}/about`)
            : pathname.startsWith(`${basePath}/blog`);

    return {
      key,
      href,
      label: dictionary.menu?.[key],
      isActive,
    };
  });

  const primaryLinks = mappedLinks.filter(
    (item): item is (typeof mappedLinks)[number] & { label: string } => Boolean(item.label)
  );

  const bookClassLabel = dictionary.menu?.bookClass ?? "Book a Consultation";
  const bookClassHref = `${basePath}/enrollment`;
  const loginLabel = dictionary.menu?.login ?? "Login";
  const loginHref = "/login";

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/80 shadow-sm backdrop-blur-xl"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href={`/${lng}`}
          className="flex items-center gap-3"
          aria-label={lng === "ko" ? "제타영어학원 홈" : "Zeta English Academy home"}
        >
          <Image
            src="/images/ZetaLogo.svg"
            alt="Zeta English Academy Logo"
            width={164}
            height={42}
            priority
            className="h-11 w-auto object-contain"
          />
          <span className="text-sm font-semibold text-gray-900">{academyName}</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6 text-sm font-medium text-gray-600">
            {primaryLinks.map(({ key, href, label, isActive }) => (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 transition-colors duration-200 hover:text-brand-primary",
                    isActive && "bg-brand-primary/10 text-brand-primary"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={bookClassHref}
            className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-brand-accent-dark"
          >
            {bookClassLabel}
          </Link>

          <Link
            href={loginHref}
            className="rounded-full border border-brand-primary/20 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
          >
            {loginLabel}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-transparent bg-white/60 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <Globe className="h-4 w-4" />
              <span>{currentLanguageLabel}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                {SUPPORTED_LANGUAGES.map((code) => (
                  <Link
                    key={code}
                    href={`/${code}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-brand-primary"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Globe className="h-4 w-4" />
                    <span>{dictionary.language?.[code] ?? code.toUpperCase()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setDropdownOpen(false);
            }}
            className="rounded-full border border-gray-200 p-2 text-brand-primary shadow-sm"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden">
          <div className="space-y-6 border-t border-gray-100 bg-white px-4 py-6">
            <ul className="space-y-4 text-base font-medium text-gray-700">
              {primaryLinks.map(({ key, href, label, isActive }) => (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 transition hover:bg-gray-50 hover:text-brand-primary",
                      isActive && "bg-brand-primary/10 text-brand-primary"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={bookClassHref}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand-accent px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-brand-accent-dark"
              onClick={() => setMenuOpen(false)}
            >
              {bookClassLabel}
            </Link>

            <Link
              href={loginHref}
              className="inline-flex w-full items-center justify-center rounded-full border border-brand-primary/30 px-4 py-3 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
              onClick={() => setMenuOpen(false)}
            >
              {loginLabel}
            </Link>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Language</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.map((code) => (
                  <Link
                    key={code}
                    href={`/${code}`}
                    className={cn(
                      "flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700",
                      code === lng && "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Globe className="h-4 w-4" />
                    <span>{dictionary.language?.[code] ?? code.toUpperCase()}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MenuBar;
