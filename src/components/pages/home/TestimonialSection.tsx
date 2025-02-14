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
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch testimonials with fallback to prevent errors
  const rawTestimonials = t("testimonialSection.testimonials", { returnObjects: true }) || [];
  const testimonials: Testimonial[] = Array.isArray(rawTestimonials)
    ? rawTestimonials
    : [
        {
          impactPhrase: "Learning through collaboration and communication.",
          quote:
            "수업 분위기가 가장 좋았던 것 같습니다. 단순히 지식을 머리에 넣는다기 보다는 다 같이 이야기하고 피드백하는 시간이 많아서 좋았고 수업 시간에 다 같이 소통하는 느낌이 들어서 재미있게 수업할 수 있었습니다.​ 일반적인 학원과는 다르게 선생님과의 소통이 하는 역할이 크다는 것이 이 수업의 가장 큰 특징이자 장점인 것 같습니다.",
          name: "Cindy",
          duration: "약 4년 간 수강",
        },
      ];

  if (testimonials.length === 0) return null;

  const handlePrev = () => setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  const handleNext = () => setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));

  return (
    <section className="py-12 bg-gray-50 text-gray-900"> {/* 🔥 Reduced from py-24 to py-12 */}
      <header className="text-center mb-6 px-6"> {/* 🔥 Reduced margin-bottom from mb-12 to mb-6 */}
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
          {t("testimonialSection.header", "What Our Students Say")}
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          {t("testimonialSection.description", "Hear from those who have experienced our programs firsthand.")}
        </p>
      </header>

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Slider Navigation */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label={t("testimonialSection.navigation.previous", "Previous testimonial")}
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label={t("testimonialSection.navigation.next", "Next testimonial")}
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
              className="p-6 bg-white rounded-lg shadow-lg min-h-[180px]" /* 🔥 Set min-h-[180px] to control spacing */
            >
              <TestimonialCard {...testimonials[currentSlide]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider Dots */}
        <div className="mt-4 flex justify-center gap-2"> {/* 🔥 Reduced margin from mt-6 to mt-4 */}
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 w-2.5 rounded-full ${
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
  <div className="flex flex-col justify-between text-center lg:text-left">
    {/* Impact Phrase */}
    <div className="text-lg font-bold text-brand-primary">{impactPhrase}</div>

    {/* Quote */}
    <p className="italic text-gray-700 leading-relaxed mt-2">“{quote}”</p>

    {/* Author Info */}
    <div className="mt-4 text-center lg:text-right">
      <p className="font-semibold text-brand-primary">{name}</p>
      {duration && <p className="text-sm text-gray-500">{duration}</p>}
    </div>
  </div>
);

export default TestimonialSection;
