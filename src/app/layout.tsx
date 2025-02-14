"use client";

import { useTranslation } from "react-i18next";
import ClientProvider from "@/components/ClientProvider";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useTranslation(); // ✅ Ensure translations are loaded before rendering

  if (!ready) return <p className="text-center">Loading translations...</p>;

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#3a393b]">
        <ClientProvider>
          <MenuBar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ClientProvider>
      </body>
    </html>
  );
}
