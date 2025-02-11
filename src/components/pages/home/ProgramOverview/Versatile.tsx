"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import FeatureSection from "./FeatureSection";

const Versatile = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = [
    "/images/pages/home/SA.svg",
    "/images/pages/home/SS.svg",
    "/images/pages/home/SSA.svg",
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <FeatureSection
      title="Versatile"
      description="At Zeta English Academy, our focus lies in promoting versatility by nurturing adaptability and establishing a robust foundation. We offer a wide range of English language skills, empowering students to confidently tackle academic challenges and navigate life's transitions with ease."
      customImageComponent={
        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden group">
          <Image
            src={images[currentSlide]}
            alt="Slider Image"
            fill
            className="object-contain transition-transform duration-500 ease-in-out group-hover:scale-105"
          />

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-brand-blue hover:text-white transition"
          >
            ◀
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-brand-blue hover:text-white transition"
          >
            ▶
          </button>

          {/* Carousel Indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentSlide ? "bg-brand-blue" : "bg-gray-400"
                } transition-opacity duration-300`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      }
      fontSize="text-xl md:text-2xl"    // Custom font size for Versatile section
      paddingClass="py-8 md:py-10 px-4" // Custom padding for Versatile section
    >
      <Button
        asChild
        size="lg"
        className="bg-gradient-to-r from-brand-blue to-brand-accent text-white px-4 py-2 hover:shadow-lg hover:scale-105 transition-transform"
      >
        <Link href="#">Learn More</Link>
      </Button>
    </FeatureSection>
  );
};

export default Versatile;
