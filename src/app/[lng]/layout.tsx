"use client";

import { ReactNode, Suspense } from "react";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";
import "../../i18n"; // ✅ Ensure i18next is initialized

interface LayoutProps {
  children: ReactNode;
}

export default function LanguageLayout({ children }: LayoutProps) {
  const pathname = usePathname() || "/";
  const lng: string = pathname.split("/")[1] || "en"; // ✅ Extracts language dynamically

  return (
    <html lang={lng} dir="ltr">
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <MenuBar lng={lng} />
          {children}
          <Footer lng={lng} />
        </Suspense>
      </body>
    </html>
  );
}
