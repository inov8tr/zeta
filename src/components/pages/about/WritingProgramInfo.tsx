import { PenTool } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";

interface WritingProgramInfoProps {
  dictionary: AboutDictionary["writingProgram"];
}

const WritingProgramInfo: React.FC<WritingProgramInfoProps> = ({ dictionary }) => {
  const { title, description, levels = [], note } = dictionary;

  if (!title && levels.length === 0) {
    return null;
  }

  return (
    <section className="bg-brand-primary-dark py-20 text-white" id="writing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-lg text-white/85">{description}</p>}
        </header>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (
            <article key={level.title} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white">
                <PenTool className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{level.title}</h3>
              {level.description && <p className="mt-3 text-sm text-white/85">{level.description}</p>}
            </article>
          ))}
        </div>

        {note && <p className="mt-8 text-sm text-white/70">{note}</p>}
      </div>
    </section>
  );
};

export default WritingProgramInfo;
