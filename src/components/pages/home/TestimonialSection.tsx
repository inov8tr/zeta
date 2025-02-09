"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  impactPhrase: string;
  quote: string;
  name: string;
  duration?: string;
}

const testimonials: Testimonial[] = [
  {
    impactPhrase: "Learning through collaboration and communication.",
    quote:
      "수업 분위기가 가장 좋았던 것 같습니다. 단순히 지식을 머리에 넣는다기 보다는 다 같이 이야기하고 피드백하는 시간이 많아서 좋았고 수업 시간에 다 같이 소통하는 느낌이 들어서 재미있게 수업할 수 있었습니다.​ 일반적인 학원과는 다르게 선생님과의 소통이 하는 역할이 크다는 것이 이 수업의 가장 큰 특징이자 장점인 것 같습니다.",
    name: "Cindy",
    duration: "약 4년 간 수강",
  },
  {
    impactPhrase: "Expanding perspectives through challenges.",
    quote:
      "제가 기억하는 수업은 자유로우면서도 도전적인 활동들을 해나가는 수업이었습니다. 수업의 각 주제와 테마는 모두 새로운 도전을 요구하였습니다. 이러한 학습과 경험들이 대학교에서 영어로 이루어지는 강의를 듣거나 다양한 학생들과 교류하는 데 큰 강점으로 작용하였고, 이를 통해 훨씬 다양한 관점과 분야를 어우를 수 있는 발판을 마련할 수 있었습니다.",
    name: "Zion",
    duration: "4년 간 수강",
  },
  {
    impactPhrase: "Learning through diverse experiences.",
    quote:
      "Brent 선생님의 수업의 가장 큰 장점은 틀에 박히지 않은 방식이라고 생각합니다. 비록 영어 실력 향상이라는 큰 목표는 있었지만, 선생님은 그 안에서 학생들이 다양한 경험을 할 수 있도록 지도해 주셨습니다. 영어라는 언어에 여러 활동을 접목해 즐거움을 느끼게 해주셨으며, 영어를 단순히 학교 수업 과목을 넘어서 경험의 폭을 넓히는 매개로 생각할 수 있게 되었습니다.",
    name: "Denny",
    duration: "5년 간 수강",
  },
];

const TestimonialSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handlePrev = () => setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  const handleNext = () => setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));

  return (
    <section className="py-24 bg-gray-50 text-gray-900">
      <header className="text-center mb-12 px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">What Our Students Say</h2>
        <p className="mt-4 text-lg text-gray-600">Hear from those who&apos;ve experienced our programs firsthand.</p>
      </header>

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Slider Navigation */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200"
          aria-label="Next testimonial"
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
