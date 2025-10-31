"use client";

import { Printer } from "lucide-react";

const handlePrint = () => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

interface PrintButtonProps {
  label?: string;
  ariaLabel?: string;
  className?: string;
}

const PrintButton = ({ label = "Print results", ariaLabel, className }: PrintButtonProps) => {
  const resolvedAriaLabel = ariaLabel ?? label;

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 print:hidden ${className ?? ""}`}
      aria-label={resolvedAriaLabel}
    >
      <Printer size={16} />
      {label}
    </button>
  );
};

export default PrintButton;
