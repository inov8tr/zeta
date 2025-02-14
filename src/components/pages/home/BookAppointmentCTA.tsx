"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const BookAppointmentCTA: React.FC = () => {
  const { t } = useTranslation("home");

  return (
    <section className="bg-brand-primary py-16 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl font-display mb-4">
            {t("callToAction.header")}
          </h2>
          <p className="mt-4 text-xl leading-8 text-neutral-lightest max-w-2xl mx-auto mb-8 font-body">
            {t("callToAction.description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-brand-accent text-brand-primary-dark hover:bg-brand-accent-dark transition-colors duration-300"
            >
              <Link href="/enrollment">{t("callToAction.enrollButton")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-brand-primary transition-colors duration-300"
            >
              <Link href="/contact">{t("callToAction.contactButton")}</Link>
            </Button>
          </div>
        </div>
        {/* Background pattern removed */}
      </motion.div>
    </section>
  );
};

export default BookAppointmentCTA;
