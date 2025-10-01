import { ReactNode } from "react";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    lng?: string;
  }>;
}

const LanguageLayout = async ({ children, params }: LayoutProps) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const dictionaries = getDictionaries(lng);

  return (
    <div className="flex min-h-screen flex-col">
      <MenuBar lng={lng} dictionary={dictionaries.common} />
      <main className="flex-1 pt-20 md:pt-24">{children}</main>
      <Footer lng={lng} dictionary={dictionaries.common.footer} />
    </div>
  );
};

export default LanguageLayout;
