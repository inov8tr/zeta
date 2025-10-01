import Link from "next/link";

const ParentPortal = () => {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-extrabold text-neutral-900">Parent Portal</h1>
      <p className="text-sm text-neutral-600">
        Parent consultations and progress snapshots will appear here. Please reach out to Zeta for current updates.
      </p>
      <Link href="/" className="text-sm font-semibold text-brand-primary hover:underline">
        Return to home
      </Link>
    </main>
  );
};

export default ParentPortal;
