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

interface TestimonialSectionProps {
  lng: string;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ lng }) => {
  const { t } = useTranslation("home");
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const testimonials = t("testimonialSection.testimonials", { returnObjects: true, lng }) as Testimonial[];

  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return (
      <section className="py-24 bg-gray-50 text-gray-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{t("testimonialSection.header")}</h2>
          <p className="mt-4 text-lg text-gray-600">{t("testimonialSection.description")}</p>
          <p className="mt-4 text-lg text-gray-600">No testimonials available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gray-50 text-gray-900">
      <header className="text-center mb-12 px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{t("testimonialSection.header")}</h2>
      </header>

      <div className="relative max-w-4xl mx-auto px-6">
        <button onClick={() => setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}>
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button onClick={() => setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}>
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

const TestimonialCard: React.FC<Testimonial> = ({ impactPhrase, quote, name, duration }) => (
  <div className="flex flex-col justify-between h-full text-center lg:text-left">
    <div className="mb-4 text-lg font-bold text-brand-primary">{impactPhrase}</div>
    <p className="italic text-gray-700 mb-6 leading-relaxed">“{quote}”</p>
    <div className="mt-auto text-center lg:text-right">
      <p className="font-semibold text-brand-primary">{name}</p>
      {duration && <p className="text-sm text-gray-500">{duration}</p>}
    </div>
  </div>
);

export default TestimonialSection;
