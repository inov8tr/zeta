"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface BookAppointmentCTAProps {
  lng: string;
}

const BookAppointmentCTA: React.FC<BookAppointmentCTAProps> = ({ lng }) => {
  const { t } = useTranslation("home", { lng });

  return (
    <section className="bg-brand-primary py-16 text-white">
      <motion.div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl">{t("callToAction.header")}</h2>
        <Button>
          <Link href={`/${lng}/enrollment`}>{t("callToAction.enrollButton")}</Link>
        </Button>
      </motion.div>
    </section>
  );
};

export default BookAppointmentCTA;
