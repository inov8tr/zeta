"use client";

import { useState, useEffect } from "react"; // ✅ Fixed duplicate import
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export default function MenuBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t, i18n, ready } = useTranslation("common");
  const pathname = usePathname() || "/";

  // ✅ Ensure translations are fully loaded before rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!ready || !isClient) return null; // 🛑 Prevents SSR mismatch

  const currentLanguage = t(`language.${i18n.language}`, "English");

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setDropdownOpen(false);
  };

  const menuItems = [
    { key: "home", href: "/" },
    { key: "program-overview", href: "/program-overview" },
    { key: "testimonials", href: "/testimonials" },
    { key: "book-appointment", href: "/book-appointment" },
    { key: "contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image src="/images/MenuLogo.svg" alt="Zeta English Academy Logo" width={40} height={40} />
          <span className="text-xl font-semibold text-gray-900">Zeta English Academy</span>
        </Link>

        {/* Mobile Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#0a6aa4]">
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>

        {/* Menu Items */}
        <div
          className={`absolute top-full left-0 w-full md:static md:flex md:justify-end md:space-x-6 md:items-center ${
            menuOpen ? "flex flex-col p-4 bg-white shadow-md space-y-4" : "hidden md:flex"
          }`}
        >
          {menuItems.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={`block hover:text-[#0a6aa4] ${pathname === href ? "text-[#0a6aa4] font-bold" : ""}`}
            >
              {t(`menu.${key}`)}
            </Link>
          ))}

          {/* Language Selector */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 hover:text-[#0a6aa4]">
              <Globe size={20} />
              <span>{currentLanguage}</span>
              <ChevronDown size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md py-2 w-40 z-10">
                {["en", "ko"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    disabled={i18n.language === lang}
                    className={`flex items-center px-4 py-2 hover:bg-gray-100 ${
                      i18n.language === lang ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Globe size={16} />
                    <span>{t(`language.${lang}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
