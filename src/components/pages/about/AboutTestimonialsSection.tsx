import { Quote } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";

interface AboutTestimonialsSectionProps {
  dictionary: AboutDictionary["testimonial"];
}

const AboutTestimonialsSection: React.FC<AboutTestimonialsSectionProps> = ({ dictionary }) => {
  const { quote, name, subtitle } = dictionary ?? {};

  if (!quote) {
    return null;
  }

  return (
    <section className="bg-white py-20" id="testimonial">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gray-50 p-10 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Quote className="h-6 w-6" />
        </span>
        <p className="mt-8 text-2xl italic leading-relaxed text-gray-700">“{quote}”</p>
        <div className="mt-6 text-sm font-semibold text-brand-primary">{name}</div>
        {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
      </div>
    </section>
  );
};

export default AboutTestimonialsSection;
