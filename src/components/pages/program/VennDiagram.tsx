"use client";

import { motion } from "framer-motion";

interface VennDiagramContent {
  alt?: string;
  lab?: string;
  grammar?: string;
  discussion?: string;
}

interface VennDiagramProps {
  dictionary?: VennDiagramContent;
}

const FALLBACK: Required<VennDiagramContent> = {
  alt: "Venn Diagram showing LAB, Grammar, and Discussion",
  lab: "LAB",
  grammar: "Grammar",
  discussion: "Discussion",
};

const VennDiagram = ({ dictionary }: VennDiagramProps) => {
  const content = { ...FALLBACK, ...(dictionary ?? {}) };

  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto max-w-[250px] md:max-w-[300px] lg:max-w-[350px]"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      aria-label={content.alt}
    >
      <motion.circle cx="130" cy="200" r="100" className="fill-blue-500/60" whileHover={{ scale: 1.05 }} />
      <motion.circle cx="270" cy="200" r="100" className="fill-green-500/60" whileHover={{ scale: 1.05 }} />
      <motion.circle cx="200" cy="300" r="100" className="fill-purple-500/60" whileHover={{ scale: 1.05 }} />

      <text x="90" y="200" textAnchor="middle" className="fill-white text-lg font-bold drop-shadow-md">
        {content.lab}
      </text>
      <text x="310" y="200" textAnchor="middle" className="fill-white text-lg font-bold drop-shadow-md">
        {content.grammar}
      </text>
      <text x="200" y="350" textAnchor="middle" className="fill-white text-lg font-bold drop-shadow-md">
        {content.discussion}
      </text>
    </motion.svg>
  );
};

export default VennDiagram;
