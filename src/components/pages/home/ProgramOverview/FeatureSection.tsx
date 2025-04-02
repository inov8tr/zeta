"use client";

import Image from "next/image";
import React from "react";

interface FeatureSectionProps {
  title: string;
  description: string;
  customImageComponent?: React.ReactNode;
  children?: React.ReactNode;
  fontSize?: string;
  paddingClass?: string;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title,
  description,
  customImageComponent,
  children,
  fontSize = "text-2xl md:text-3xl",
  paddingClass = "py-12 md:py-16 px-6 md:px-12",
}) => {
  return (
    <section className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${paddingClass} bg-gray-100`}>
      <div className="lg:w-1/2 text-center lg:text-left space-y-4">
        <h3 className={`${fontSize} font-bold tracking-tight text-brand-primary`}>{title}</h3>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
        <div className="mt-6 flex justify-center lg:justify-start">{children}</div>
      </div>

      <div className="relative lg:w-1/2 h-[300px] overflow-hidden">{customImageComponent}</div>
    </section>
  );
};

export default FeatureSection;
