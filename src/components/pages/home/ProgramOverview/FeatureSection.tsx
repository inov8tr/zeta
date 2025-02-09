"use client";

import Image from "next/image";
import React from "react";

interface FeatureSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  imageTitle: string;
  children?: React.ReactNode;
  extraContent?: React.ReactNode;
  imageTitlePosition?: "top" | "bottom";
  layoutVariant?: "left" | "right";
  sectionHeight?: "consistent" | "large";
  buttonColor?: string;  // New prop to control button color
}

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title,
  description,
  imageSrc,
  imageTitle,
  children,
  extraContent,
  imageTitlePosition = "top",
  layoutVariant = "left",
  sectionHeight = "consistent",
  buttonColor = "bg-brand-primary",  // Default button color
}) => {
  const isLeftAligned = layoutVariant === "left";
  const paddingClass = sectionHeight === "consistent" ? "py-16" : "py-24";

  return (
    <section className={`flex flex-col lg:flex-row items-center gap-12 bg-gray-100 ${paddingClass} p-12 rounded-lg shadow-lg`}>
      {/* Image Section */}
      <div className={`relative lg:w-1/2 ${isLeftAligned ? "" : "lg:order-last"}`}>
        <div className="overflow-hidden rounded-lg shadow-md relative">
          {imageTitlePosition === "top" && (
            <div className="absolute top-0 left-0 right-0 bg-brand-primary bg-opacity-80 py-2 text-white text-center text-lg font-semibold">
              {imageTitle}
            </div>
          )}
          <Image src={imageSrc} alt={imageTitle} width={400} height={300} className="max-w-full h-auto object-cover" />
          {imageTitlePosition === "bottom" && (
            <h4 className="mt-4 text-lg font-semibold text-gray-800 text-center">{imageTitle}</h4>
          )}
        </div>
      </div>

      {/* Text Content */}
      <div className="lg:w-1/2 text-center lg:text-left space-y-6">
        <h3 className="text-4xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
        {extraContent}
        <div className={`mt-6 flex flex-wrap gap-4 justify-center lg:justify-start ${buttonColor}`}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
