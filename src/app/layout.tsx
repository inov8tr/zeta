import type { Metadata } from "next";
import { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Zeta",
  description: "Zeta application",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-neutral-950">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
