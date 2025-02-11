"use client";

import Link from "next/link";
import Image from "next/image";
import FeatureSection from "./FeatureSection";

const Strategic = () => {
  return (
    <FeatureSection
      title="Strategic"
      description="At Zeta English Academy, we take a strategic approach to learning, offering diverse educational experiences and providing in-depth training. This ensures a dynamic and effective learning journey, equipping students with the skills and knowledge for future success. Our academy focuses on English language learning, English education, effective learning strategies, language skills development, and student success."
      customImageComponent={
        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden bg-gray-100">
          <Image
            src="/images/pages/home/Strat.png"
            alt="Our System"
            fill
            className="object-contain"
          />
        </div>
      }
      fontSize="text-lg md:text-xl"
      paddingClass="py-6 md:py-8 px-4"
    >
      <Link
        href="/programs"
        className="text-white font-semibold bg-brand-primary px-4 py-2 hover:bg-brand-primary-dark transition"
      >
        Learn More
      </Link>
    </FeatureSection>
  );
};

export default Strategic;
