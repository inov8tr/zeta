"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  // Removed 'i18n' to avoid ESLint unused variable error
  const { t, ready } = useTranslation("common");

  // Check if translations are ready to prevent SSR issues
  if (!ready) {
    return null;
  }

  return (
    <footer className="bg-[#3a393b] py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t("footer.contactUs", "Contact Us")}
            </h3>
            <address className="space-y-1 text-sm text-white not-italic">
              <div>{t("footer.phone", "Phone")}: +82 10-1234-5678</div>
              <div>
                <a
                  href="mailto:info@zetaacademy.com"
                  className="hover:underline"
                >
                  {t("footer.email", "Email")}: info@zetaacademy.com
                </a>
              </div>
              <div>{t("footer.address", "123 Main St, Seoul, South Korea")}</div>
            </address>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t("footer.quickLinks", "Quick Links")}
            </h3>
            <nav>
              <ul className="space-y-1">
                {["programOverview", "testimonials", "bookAppointment", "contact"].map((key) => (
                  <li key={key}>
                    <Link href={`/${key}`} className="hover:underline text-sm text-white">
                      {t(`footer.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Social Media Links */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              {t("footer.followUs", "Follow Us")}
            </h3>
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.facebook.com/ZetaEnglishAcademy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-6 h-6 text-white hover:text-blue-400" />
              </a>
              <a
                href="https://www.instagram.com/zetaenglishacademy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-6 h-6 text-white hover:text-pink-400" />
              </a>
              <a
                href="https://www.youtube.com/@ZetaEnglishAcademy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="w-6 h-6 text-white hover:text-red-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="mt-6 border-t border-[#666] text-center text-white">
          <p className="text-sm">
            &copy; 2025 Zeta English Academy.{" "}
            {t("footer.rightsReserved", "All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
