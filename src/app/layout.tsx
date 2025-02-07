import "@/styles/globals.css";
import ClientProvider from "@/components/ClientProvider";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Zeta English Academy",
  description: "Learn English with Zeta English Academy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ClientProvider>
          <MenuBar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ClientProvider>
      </body>
    </html>
  );
}
