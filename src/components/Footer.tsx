"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t, ready } = useTranslation("common");

  if (!ready) return null; // ✅ Avoid SSR mismatch

  return (
    <footer className="bg-[#3a393b] py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold text-white">{t("footer.contactUs")}</h3>
      </div>
    </footer>
  );
}
