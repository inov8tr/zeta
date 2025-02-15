"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Testimonial {
  impactPhrase: string;
  quote: string;
  name: string;
  duration?: string;
}

const TestimonialSection: React.FC = () => {
  const { t } = useTranslation("home");
  
  // ✅ Always call hooks first before conditionally returning
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ Load testimonials safely
  const testimonials = t("testimonialSection.testimonials", { returnObjects: true }) as Testimonial[];

  console.log("🚨 Testimonials content:", testimonials);

  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    console.error("❌ Translation Error: testimonials is not an array", testimonials);
    return (
      <section className="py-24 bg-gray-50 text-gray-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">What Our Students Say</h2>
          <p className="mt-4 text-lg text-gray-600">No testimonials available.</p>
        </div>
      </section>
    );
  }

  const handlePrev = () => setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  const handleNext = () => setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));

  return (
    <section className="py-24 bg-gray-50 text-gray-900">
      <header className="text-center mb-12 px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{t("testimonialSection.header")}</h2>
        <p className="mt-4 text-lg text-gray-600">{t("testimonialSection.description")}</p>
      </header>

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Slider Navigation */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label={t("testimonialSection.navigation.previous")}
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label={t("testimonialSection.navigation.next")}
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>

        {/* Testimonial Slider */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="p-8 bg-white rounded-lg shadow-lg"
            >
              <TestimonialCard {...testimonials[currentSlide]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 w-3 rounded-full ${
                currentSlide === index ? "bg-brand-primary" : "bg-gray-300"
              } transition`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard: React.FC<Testimonial> = ({ impactPhrase, quote, name, duration }) => (
  <div className="flex flex-col justify-between h-full text-center lg:text-left">
    {/* Impact Phrase */}
    <div className="mb-4 text-lg font-bold text-brand-primary">{impactPhrase}</div>

    {/* Quote */}
    <p className="italic text-gray-700 mb-6 leading-relaxed">“{quote}”</p>

    {/* Author Info */}
    <div className="mt-auto text-center lg:text-right">
      <p className="font-semibold text-brand-primary">{name}</p>
      {duration && <p className="text-sm text-gray-500">{duration}</p>}
    </div>
  </div>
);

export default TestimonialSection;
