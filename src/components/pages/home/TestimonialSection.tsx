"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeDictionary } from "@/lib/i18n";

type Testimonial = HomeDictionary["testimonialSection"]["testimonials"][number];

interface TestimonialSectionProps {
  dictionary: HomeDictionary["testimonialSection"];
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ dictionary }) => {
  const testimonials = dictionary.testimonials ?? [];
  const description = (dictionary as { description?: string }).description;
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return null;
  }

  const previous = () => {
    setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-24 bg-gray-50 text-gray-900">
      <header className="text-center mb-12 px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{dictionary.header}</h2>
        {description && <p className="mt-4 text-lg text-gray-600">{description}</p>}
      </header>

      <div className="relative max-w-4xl mx-auto px-6">
        <button
          type="button"
          onClick={previous}
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
          aria-label={dictionary.navigation?.previous ?? "Previous testimonial"}
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
          aria-label={dictionary.navigation?.next ?? "Next testimonial"}
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>

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
      </div>
    </section>
  );
};

const TestimonialCard: React.FC<Testimonial> = ({ impactPhrase, quote, name, duration, role }) => (
  <div className="flex h-full flex-col justify-between text-center lg:text-left">
    {impactPhrase && <div className="mb-4 text-lg font-semibold text-brand-primary">{impactPhrase}</div>}
    <p className="mb-6 text-lg italic leading-relaxed text-gray-700">“{quote}”</p>
    <div className="mt-auto text-center lg:text-right">
      <p className="font-semibold text-brand-primary">{name}</p>
      <div className="text-sm text-gray-500">
        {role && <span>{role}</span>}
        {role && duration && <span className="mx-1">•</span>}
        {duration && <span>{duration}</span>}
      </div>
    </div>
  </div>
);

export default TestimonialSection;
