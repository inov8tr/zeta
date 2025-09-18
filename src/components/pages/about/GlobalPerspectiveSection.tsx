import { Globe2 } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";

interface GlobalPerspectiveSectionProps {
  dictionary: AboutDictionary["globalPerspective"];
}

const GlobalPerspectiveSection: React.FC<GlobalPerspectiveSectionProps> = ({ dictionary }) => {
  const { title, description } = dictionary;

  if (!title && !description) {
    return null;
  }

  return (
    <section className="bg-white py-20" id="global">
      <div className="mx-auto max-w-5xl rounded-3xl border border-brand-primary/10 bg-brand-primary/5 px-6 py-12 text-center shadow-sm sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <Globe2 className="h-6 w-6" />
        </span>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
        {description && <p className="mt-4 text-lg leading-relaxed text-gray-700">{description}</p>}
      </div>
    </section>
  );
};

export default GlobalPerspectiveSection;
