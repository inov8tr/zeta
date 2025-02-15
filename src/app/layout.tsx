import "../styles/globals.css";
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
