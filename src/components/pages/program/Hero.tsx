import Image from "next/image";
import VennDiagram from "./VennDiagram";
import type { ProgramDictionary } from "@/lib/i18n";

interface HeroProps {
  dictionary: ProgramDictionary["hero"];
  vennDiagram?: {
    alt?: string;
    lab?: string;
    grammar?: string;
    discussion?: string;
  };
}

const Hero = ({ dictionary, vennDiagram }: HeroProps) => {
  return (
    <section className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-20 text-white flex items-center">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/pages/program/SystemBG.webp"
          alt={dictionary.backgroundAlt}
          fill
          className="object-cover object-center w-full h-full"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden />

      <div className="relative z-20 w-full px-6 lg:px-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
          <div className="text-center lg:text-left max-w-3xl mx-auto lg:mx-0 text-white">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {dictionary.title}
            </h1>
            <p className="text-md lg:text-lg opacity-90">{dictionary.description}</p>
          </div>

          <div className="w-full flex justify-center">
            <VennDiagram dictionary={vennDiagram} />
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <a
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
            aria-label={dictionary.cta}
            href="#program-details"
          >
            {dictionary.cta}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
