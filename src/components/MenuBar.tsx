"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export default function MenuBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");

  const { t, i18n, ready } = useTranslation("common");

  const pathname = usePathname();

  useEffect(() => {
    console.log("Current pathname:", pathname);
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  if (!ready) {
    console.log("Translations not ready");
    return <div>Loading translations...</div>;
  }

  const currentLanguage = i18n.language ? t(`language.${i18n.language}`) : "English";

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setDropdownOpen(false);
  };

  const menuItems = ["home", "program-overview", "testimonials", "book-appointment", "contact"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <Image src="/images/MenuLogo.svg" alt="Logo" width={194} height={64} className="object-contain" />
        </Link>

        {/* Mobile Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#0a6aa4]" aria-label="Toggle Menu">
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>

        {/* Menu Items */}
        <div
          className={`absolute top-full left-0 w-full ${
            menuOpen ? "flex flex-col space-y-4 p-4 bg-white shadow-md" : "hidden"
          } md:static md:flex md:justify-end md:space-x-6 md:items-center md:bg-transparent md:p-0`}
        >
          {menuItems.map((item) => {
            const linkPath = `/${item === "home" ? "" : item}`;
            const isActive = currentPath === linkPath;
            return (
              <Link
                key={item}
                href={linkPath}
                className={`block text-left hover:text-[#0a6aa4] ${isActive ? "text-[#0a6aa4] font-bold" : ""}`}
              >
                {t(`menu.${item}`)}
              </Link>
            );
          })}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 hover:text-[#0a6aa4]"
              aria-label="Select Language"
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
                    disabled={i18n.language === lang}
                    className={`flex items-center space-x-2 w-full px-4 py-2 hover:bg-gray-100 text-left ${
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
