import type { AboutDictionary } from "@/lib/i18n";

interface AboutHeroSectionProps {
  dictionary: AboutDictionary["hero"];
}

const AboutHeroSection: React.FC<AboutHeroSectionProps> = ({ dictionary }) => {
  const { title, tagline, description } = dictionary;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-primary-light text-white">
      <div className="absolute inset-0">
        <div className="absolute left-8 top-12 hidden h-56 w-56 rounded-full bg-brand-accent/40 blur-3xl md:block" aria-hidden />
        <div className="absolute bottom-0 right-[-4rem] h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        <span className="inline-flex items-center rounded-full bg-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
          {tagline}
        </span>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        {description && (
          <p className="max-w-3xl text-lg leading-relaxed text-white/85">
            {description}
          </p>
        )}
      </div>
    </section>
  );
};

export default AboutHeroSection;
