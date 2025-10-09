"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type SliderImage = {
  src: string;
  alt: string;
};

type ProgramHeroSliderProps = {
  images: SliderImage[];
  className?: string;
  intervalMs?: number;
  heightClass?: string;
};

const ProgramHeroSlider = ({
  images,
  className = "",
  intervalMs = 5000,
  heightClass = "h-72",
}: ProgramHeroSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white/80 shadow-lg backdrop-blur ${heightClass} ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label="Program highlights"
    >
      {images.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          priority={index === 0}
          className={`absolute inset-0 object-contain p-8 transition-opacity duration-700 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full border border-white transition ${
                index === activeIndex ? "bg-brand-primary" : "bg-white/60 hover:bg-white"
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramHeroSlider;
