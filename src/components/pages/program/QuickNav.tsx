import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Book, MessageCircle, GraduationCap, ScrollText, Key } from "lucide-react";
import type { ProgramDictionary } from "@/lib/i18n";

interface QuickNavProps {
  dictionary: Pick<ProgramDictionary, "quickNav" | "strategic">;
}

const ICONS = [Book, MessageCircle, GraduationCap, ScrollText];
const QUICK_NAV_ITEMS = [
  { key: "lab", href: "#lab" },
  { key: "discussion", href: "#discussion" },
  { key: "grammar", href: "#grammar" },
  { key: "writing", href: "#writing" },
] as const satisfies readonly { key: keyof ProgramDictionary["quickNav"]; href: string }[];

const QuickNav = ({ dictionary }: QuickNavProps) => {
  return (
    <section className="w-full bg-white z-10 shadow-md">
      <div className="bg-white py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
            <Key size={48} className="text-blue-600 mb-2" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {dictionary.strategic.heading}
            </h2>
            <p className="mt-2 text-md sm:text-lg text-gray-700 max-w-3xl">
              {dictionary.strategic.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 lg:grid-cols-4">
            {QUICK_NAV_ITEMS.map((item, index) => {
              const Icon = ICONS[index % ICONS.length];
              const title = dictionary.quickNav[item.key];

              return (
                <Link key={item.key} href={item.href} aria-label={title}>
                  <Card className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                    <CardContent className="p-6 sm:p-8 flex flex-col items-center">
                      <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-full shadow-md">
                        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                      </div>
                      <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickNav;
