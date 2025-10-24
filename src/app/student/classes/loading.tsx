const ClassesLoading = () => (
  <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
    <div className="h-6 w-48 animate-pulse rounded-full bg-brand-primary/10" />
    <div className="h-4 w-72 animate-pulse rounded-full bg-brand-primary/10" />
    <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-full bg-brand-primary/10" />
          <div className="h-3 w-60 animate-pulse rounded-full bg-brand-primary/10" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-full bg-brand-primary/10" />
      </div>
    </section>
    <section className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <article key={idx} className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded-full bg-brand-primary/10" />
          <div className="mt-3 h-3 w-48 animate-pulse rounded-full bg-brand-primary/10" />
          <div className="mt-6 h-8 w-full animate-pulse rounded-2xl bg-brand-primary/10" />
          <div className="mt-2 h-8 w-full animate-pulse rounded-2xl bg-brand-primary/10" />
        </article>
      ))}
    </section>
  </main>
);

export default ClassesLoading;
