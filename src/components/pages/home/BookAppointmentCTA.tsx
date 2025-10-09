"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import type { HomeDictionary, SupportedLanguage } from "@/lib/i18n";

interface BookAppointmentCTAProps {
  lng: SupportedLanguage;
  dictionary: HomeDictionary["callToAction"];
}

const BookAppointmentCTA: React.FC<BookAppointmentCTAProps> = ({ lng, dictionary }) => {
  const { header, description, primaryButton, secondaryButton } = dictionary;
  return (
    <section className="bg-brand-primary py-16 text-white">
      <motion.div
        className="max-w-7xl mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl">{header}</h2>
        {description && <p className="mt-4 text-lg text-brand-lightest">{description}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {primaryButton && (
            <Button asChild className="bg-white text-brand-primary shadow-md shadow-white/20 hover:bg-white/90">
              <Link href={`/${lng}/enrollment`}>{primaryButton}</Link>
            </Button>
          )}
          {secondaryButton && (
            <Button
              asChild
              variant="outline"
              className="border-white/60 text-white hover:bg-white/10 hover:text-white focus-visible:outline-white"
            >
              <Link href={`/${lng}/contact`}>{secondaryButton}</Link>
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default BookAppointmentCTA;
