import Link from "next/link";

const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400">Admin workspace</p>
          <h2 className="text-lg font-semibold text-neutral-900">Stay in sync with every learner</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="mailto:info@zeta-eng.co.kr"
            className="rounded-full border border-neutral-300 px-4 py-2 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Need help?
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
