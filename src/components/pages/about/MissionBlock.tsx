import type { AboutDictionary } from "@/lib/i18n";

interface MissionBlockProps {
  dictionary: AboutDictionary["mission"];
}

const MissionBlock: React.FC<MissionBlockProps> = ({ dictionary }) => {
  const { title, description, spotlight } = dictionary;

  return (
    <section className="bg-white py-20" id="mission">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center">
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{description}</p>
        </div>
        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute -inset-4 rounded-3xl bg-brand-accent/20 blur-3xl" aria-hidden />
          <div className="relative w-full max-w-md rounded-3xl border border-brand-primary/10 bg-white p-8 shadow-xl">
            <div className="text-6xl" aria-hidden>
              🌟
            </div>
            <p className="mt-6 text-base leading-relaxed text-gray-700">
              {spotlight ?? description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionBlock;
