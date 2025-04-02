"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function VennDiagram() {
  const { t } = useTranslation("program");

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
      aria-label={t("vennDiagram.alt", "Venn Diagram showing LAB, Grammar, and Discussion")}
    >
      {/* Circles */}
      <motion.circle
        cx="130"
        cy="200"
        r="100"
        className="fill-blue-500/60"
        whileHover={{ scale: 1.05 }}
        aria-label={t("vennDiagram.lab")}
      />
      <motion.circle
        cx="270"
        cy="200"
        r="100"
        className="fill-green-500/60"
        whileHover={{ scale: 1.05 }}
        aria-label={t("vennDiagram.grammar")}
      />
      <motion.circle
        cx="200"
        cy="300"
        r="100"
        className="fill-purple-500/60"
        whileHover={{ scale: 1.05 }}
        aria-label={t("vennDiagram.discussion")}
      />

      {/* Labels */}
      <text
        x="90"
        y="200"
        textAnchor="middle"
        className="fill-white text-lg font-bold drop-shadow-md"
      >
        {t("vennDiagram.lab", "LAB")}
      </text>
      <text
        x="310"
        y="200"
        textAnchor="middle"
        className="fill-white text-lg font-bold drop-shadow-md"
      >
        {t("vennDiagram.grammar", "Grammar")}
      </text>
      <text
        x="200"
        y="350"
        textAnchor="middle"
        className="fill-white text-lg font-bold drop-shadow-md"
      >
        {t("vennDiagram.discussion", "Discussion")}
      </text>
    </motion.svg>
  );
}
