import { CheckCircle2 } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";

interface PhilosophyBlockProps {
  dictionary: AboutDictionary["philosophy"];
}

const PhilosophyBlock: React.FC<PhilosophyBlockProps> = ({ dictionary }) => {
  const { title, intro, points = [] } = dictionary;

  if (points.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-20" id="philosophy">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</p>}
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-4 rounded-2xl border border-white bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mt-1 text-brand-primary">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="text-base leading-relaxed text-gray-700">{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default PhilosophyBlock;
