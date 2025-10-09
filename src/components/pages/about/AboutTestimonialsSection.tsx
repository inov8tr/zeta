import TestimonialSection from "@/components/pages/home/TestimonialSection";
import type { HomeDictionary } from "@/lib/i18n";

interface AboutTestimonialsSectionProps {
  dictionary: HomeDictionary["testimonialSection"];
}

const AboutTestimonialsSection: React.FC<AboutTestimonialsSectionProps> = ({ dictionary }) => {
  if (!dictionary) {
    return null;
  }

  return <TestimonialSection dictionary={dictionary} />;
};

export default AboutTestimonialsSection;
