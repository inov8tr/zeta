"use client";

import Link from "next/link";
import Image from "next/image";

const Instrumental = () => {
  return (
    <section className="flex flex-col items-center py-6 md:py-8 px-4 bg-gray-100 rounded-lg">
      {/* Title and Description */}
      <div className="w-full text-center space-y-2 mb-4">
        <h3 className="text-lg md:text-xl font-bold tracking-tight text-brand-primary">
          Instrumental
        </h3>
        <p className="text-sm md:text-base text-gray-600 leading-snug">
          We prioritize a holistic approach, emphasizing practical, real-world abilities like critical thinking, problem-solving, and effective communication. These skills are vital not just for academic success but also for navigating life&#39;s challenges.
        </p>
      </div>

      {/* Image */}
      <div className="relative w-full h-[150px] md:h-[200px] overflow-hidden bg-gray-100 mb-4">
        <Image
          src="/images/pages/home/Levels.svg"
          alt="Visual representation of our Instrumental Program"
          fill
          className="object-contain"
        />
      </div>

      {/* Button */}
      <Link
        href="/programs"
        className="text-white font-semibold bg-brand-primary px-4 py-2 hover:bg-brand-primary-dark transition"
        aria-label="Learn more about our programs"
      >
        Learn More
      </Link>
    </section>
  );
};

export default Instrumental;
