"use client";

import Image from "next/image";
import React from "react";

interface FeatureSectionProps {
  title: string;
  description: string;
  imageSrc?: string;
  imageTitle?: string;
  customImageComponent?: React.ReactNode;
  children?: React.ReactNode;
  extraContent?: React.ReactNode;
  layoutVariant?: "left" | "right";
  fontSize?: string;         // Prop for font size customization
  paddingClass?: string;     // Prop for padding customization
}

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title,
  description,
  imageSrc,
  imageTitle,
  customImageComponent,
  children,
  extraContent,
  layoutVariant = "left",
  fontSize = "text-2xl md:text-3xl",   // Default font size
  paddingClass = "py-12 md:py-16 px-6 md:px-12",   // Default padding class
}) => {
  return (
    <section className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${paddingClass} bg-gray-100`}>
      {/* Text Content */}
      <div className={`lg:w-1/2 ${layoutVariant === "left" ? "" : "lg:order-last"} text-center lg:text-left space-y-4`}>
        <h3 className={`${fontSize} font-bold tracking-tight text-brand-primary`}>{title}</h3>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
        {extraContent}
        <div className="mt-6 flex justify-center lg:justify-start">{children}</div>
      </div>

      {/* Image Section */}
      <div className="relative lg:w-1/2 h-[300px] overflow-hidden">
        {customImageComponent ? (
          customImageComponent
        ) : (
          <Image src={imageSrc || ""} alt={imageTitle || ""} fill className="object-contain" />
        )}
      </div>
    </section>
  );
};

export default FeatureSection;
