import Link from "next/link";

const DashboardHeader = () => {
  return (
    <header className="bg-white/90 shadow-sm backdrop-blur print:hidden">
      <div className="flex items-center justify-between border-b border-brand-primary/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-primary/70">Admin workspace</p>
          <h2 className="text-lg font-semibold text-brand-primary-dark">Stay in sync with every learner</h2>
        </div>
        <Link
          href="mailto:info@zeta-eng.co.kr"
          className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Need help?
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
