"use client";

import { Printer } from "lucide-react";

const handlePrint = () => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

const PrintButton = () => (
  <button
    type="button"
    onClick={handlePrint}
    className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10 print:hidden"
    aria-label="Print entrance test results"
  >
    <Printer size={16} />
    Print results
  </button>
);

export default PrintButton;
