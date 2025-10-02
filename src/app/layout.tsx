import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Zeta",
  description: "Zeta application",
  icons: {
    icon: "/images/ZetaLogo.svg",
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-neutral-950">
        {children}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
