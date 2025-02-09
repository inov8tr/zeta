"use client";

import Link from "next/link";
import FeatureSection from "./FeatureSection";

const Strategic = () => {
  return (
    <FeatureSection
      title="Strategic"
      description="At Zeta English Academy, we provide a diverse and strategic learning experience to foster long-term success."
      imageSrc="/images/pages/home/Strat.png"
      imageTitle="Our System"
      layoutVariant="left"
      imageTitlePosition="top"
    >
      {/* Button inside the children prop */}
      <div className="mt-6 flex justify-center lg:justify-start">
        <Link
          href="/programs"
          className="text-white font-semibold bg-brand-primary px-6 py-3 rounded-lg hover:bg-brand-primary-dark transition"
        >
          Learn More
        </Link>
      </div>
    </FeatureSection>
  );
};

export default Strategic;
