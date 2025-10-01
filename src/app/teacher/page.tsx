import Link from "next/link";

const TeacherPortal = () => {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-extrabold text-neutral-900">Teacher Portal</h1>
      <p className="text-sm text-neutral-600">
        The teacher dashboard is coming soon. If you need access, please contact the Zeta team.
      </p>
      <Link href="/" className="text-sm font-semibold text-brand-primary hover:underline">
        Return to home
      </Link>
    </main>
  );
};

export default TeacherPortal;
