"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t, ready, i18n } = useTranslation("common");

  console.log("Footer rendered");
  console.log("Current language:", i18n.language);

  // Handle translation readiness
  if (!ready) {
    console.log("Translations not ready. Current language:", i18n.language);
    return <div>Loading translations...</div>;
  }

  const contactUs = t("footer.contactUs", "Fallback: Contact Us");

  console.log("Translation for 'footer.contactUs':", contactUs);

  return (
    <footer className="bg-[#3a393b] py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">{contactUs}</h3>
            <address className="space-y-1 text-sm text-white not-italic">
              <div>{t("footer.phone", "Phone")}: +82 10-1234-5678</div>
              <div>
                <a href="mailto:info@zetaacademy.com" className="hover:underline">
                  {t("footer.email", "Email")}: info@zetaacademy.com
                </a>
              </div>
              <div>{t("footer.address", "123 Main St, Seoul, South Korea")}</div>
            </address>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">{t("footer.quickLinks", "Quick Links")}</h3>
            <nav className="space-y-1 text-sm text-white">
              <ul>
                <li><Link href="/program-overview" className="hover:underline">{t("footer.programOverview", "Program Overview")}</Link></li>
                <li><Link href="/testimonials" className="hover:underline">{t("footer.testimonials", "Testimonials")}</Link></li>
                <li><Link href="/book-appointment" className="hover:underline">{t("footer.bookAppointment", "Book Appointment")}</Link></li>
                <li><Link href="/contact" className="hover:underline">{t("footer.contact", "Contact Us")}</Link></li>
              </ul>
            </nav>
          </div>

          {/* Social Media */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-white">{t("footer.followUs", "Follow Us")}</h3>
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.facebook.com/ZetaEnglishAcademy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 text-white hover:text-blue-400" />
              </a>
              <a
                href="https://www.instagram.com/zetaenglishacademy/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 text-white hover:text-pink-400" />
              </a>
              <a
                href="https://www.youtube.com/@ZetaEnglishAcademy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <Youtube className="w-6 h-6 text-white hover:text-red-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#666] text-center text-white">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Zeta English Academy. {t("footer.rightsReserved", "All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
