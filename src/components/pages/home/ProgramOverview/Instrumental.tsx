"use client";

import Link from "next/link";
import FeatureSection from "./FeatureSection";

const Instrumental = () => {
  return (
    <FeatureSection
      title="Instrumental"
      description="We prioritize a holistic approach, emphasizing practical, real-world abilities like critical thinking, problem-solving, and effective communication. These skills are vital not just for academic success but also for navigating life's challenges."
      imageSrc="/images/pages/home/Levels.svg"
      imageTitle="Our Instrumental Program"
      layoutVariant="right"
      imageTitlePosition="top"
      sectionHeight="consistent"
    >
      <Link
        href="/programs"
        className="text-white font-semibold bg-brand-primary px-6 py-3 rounded-lg hover:bg-brand-primary-dark transition"
      >
        Learn More
      </Link>
    </FeatureSection>
  );
};

export default Instrumental;
