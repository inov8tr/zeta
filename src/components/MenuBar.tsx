"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export default function MenuBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t, i18n, ready } = useTranslation("common");
  const pathname = typeof window !== "undefined" ? usePathname() : "/";

  if (!ready) return null;

  const currentLanguage = i18n.language ? t(`language.${i18n.language}`) : "English";

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setDropdownOpen(false);
  };

  const menuItems = ["home", "program-overview", "testimonials", "book-appointment", "contact"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <Image
            src="/images/MenuLogo.svg"
            alt="Zeta English Academy Logo"
            width={194}
            height={64}
            className="object-contain hover:scale-110 transition-transform duration-300 ease-in-out"
          />
        </Link>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#0a6aa4]">
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>

        <div
          className={`absolute top-full left-0 w-full ${
            menuOpen ? "flex flex-col space-y-4 p-4 bg-white shadow-md" : "hidden"
          } md:static md:flex md:justify-end md:space-x-6 md:items-center`}
        >
          {menuItems.map((item) => {
            const linkPath = `/${item === "home" ? "" : item}`;
            const isActive = pathname === linkPath;
            return (
              <Link
                key={item}
                href={linkPath}
                className={`block hover:text-[#0a6aa4] ${isActive ? "text-[#0a6aa4] font-bold" : ""}`}
              >
                {t(`menu.${item}`)}
              </Link>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 hover:text-[#0a6aa4]"
            >
              <Globe size={20} />
              <span>{currentLanguage}</span>
              <ChevronDown size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md py-2 w-40">
                {["en", "ko"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
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
