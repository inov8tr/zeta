"use client"; // Ensure this component runs on the client side due to framer-motion

import { motion } from "framer-motion";
import React from "react";

interface Testimonial {
  quote: string;
  name: string;
  duration?: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "수업 분위기가 가장 좋았던 것 같습니다. 단순히 지식을 머리에 넣는다기 보다는 다 같이 이야기하고 피드백하는 시간이 많아서 좋았고 수업 시간에 다 같이 소통하는 느낌이 들어서 재미있게 수업할 수 있었습니다. 일반적인 학원과는 다르게 선생님과의 소통이 하는 역할이 크다는 것이 이 수업의 가장 큰 특징이자 장점인 것 같습니다.",
    name: "Cindy",
  },
  {
    quote: "제가 기억하는 Brent 선생님과의 수업은 자유로우면서도 도전적인 활동들을 해나가는 수업이었습니다. 수업의 각 주제와 테마는 모두 새로운 도전을 요구하였습니다. 이러한 학습과 경험들이 대학교에서 영어로 이루어지는 강의를 듣거나 다양한 학생들과 교류하는 데 큰 강점으로 작용하였고, 이를 통해 훨씬 다양한 관점과 분야를 어우를 수 있는 발판을 마련할 수 있었습니다.",
    name: "Zion",
    duration: "4년 간 수강",
  },
  {
    quote: "Brent 선생님의 수업의 가장 큰 장점은 틀에 박히지 않은 방식이라고 생각합니다. 비록 영어 실력 향상이라는 큰 목표는 있었지만, 선생님은 그 안에서 학생들이 다양한 경험을 할 수 있도록 지도해 주셨습니다. 영어라는 언어에 여러 활동을 접목해 즐거움을 느끼게 해주셨으며, 영어를 단순히 학교 수업 과목을 넘어서 경험의 폭을 넓히는 매개로 생각할 수 있게 되었습니다.",
    name: "Denny",
    duration: "5년 간 수강",
  },
];

const TestimonialSection: React.FC = () => {
  console.log("TestimonialSection rendered");

  return (
    <section className="py-12 bg-background-light text-text-primary">
      <h2 className="text-3xl font-bold text-center mb-8">Student Testimonials</h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
      >
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            className="flex"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <TestimonialCard {...testimonial} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

const TestimonialCard: React.FC<Testimonial> = ({ quote, name, duration }) => (
  <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col justify-between h-full">
    <p className="italic text-neutral-dark mb-4">“{quote}”</p>
    <div className="mt-auto text-right">
      <p className="font-semibold text-brand-primary">{name}</p>
      {duration && <p className="text-sm text-neutral-muted">{duration}</p>}
    </div>
  </div>
);

export default TestimonialSection;
