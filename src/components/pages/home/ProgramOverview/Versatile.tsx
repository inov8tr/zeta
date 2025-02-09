"use client";

import Link from "next/link";
import FeatureSection from "./FeatureSection";

const Versatile = () => {
  return (
    <FeatureSection
      title="Versatile"
      description="We nurture adaptability and provide a solid foundation for success."
      imageSrc="/images/pages/home/SS.svg"
      imageTitle="How We Perform"
      imageTitlePosition="top"
      layoutVariant="right"
      buttonColor="bg-brand-blue"
    >
      <Link
        href="/about"
        className="mt-6 inline-block text-white font-semibold px-6 py-3 rounded-lg transition bg-brand-blue hover:bg-brand-blue-dark"
      >
        Learn More
      </Link>
    </FeatureSection>
  );
};

export default Versatile;
