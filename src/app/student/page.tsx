import Link from "next/link";

const StudentPortal = () => {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-extrabold text-neutral-900">Student Portal</h1>
      <p className="text-sm text-neutral-600">
        Student resources will live here soon. Check with your teacher for current assignments.
      </p>
      <Link href="/" className="text-sm font-semibold text-brand-primary hover:underline">
        Return to home
      </Link>
    </main>
  );
};

export default StudentPortal;
