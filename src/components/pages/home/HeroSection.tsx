"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative bg-brand-primary-dark py-24 text-white lg:min-h-[90vh]">
      <div className="mx-auto grid max-w-7xl items-center px-4 lg:grid-cols-2 lg:gap-12">
        <div className="relative z-10 text-center lg:text-left">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-2xl font-medium text-brand-accent sm:text-3xl">Zeta English Academy</span>
            <span className="mt-2 block text-3xl sm:text-4xl lg:text-5xl">We Believe</span>
            <span className="mt-4 block">Learning Should Be Fun</span>
            <span className="mt-2 block text-brand-accent">and Spark Creativity!</span>
          </h1>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <Button asChild size="lg" className="w-full bg-brand-accent text-brand-primary-dark hover:bg-brand-accent-dark transition-colors sm:w-auto">
              <Link href="/enrollment">Start Learning Today</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-white text-white hover:bg-white hover:text-brand-primary sm:w-auto">
              <Link href="/programs">Explore Programs</Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-12 flex justify-center lg:mt-0">
          <div className="w-[400px] h-[400px] bg-brand-primary-light rounded-lg overflow-hidden pentagon-clip">
            <Image src="/images/BookR.png" alt="Student reading a book" fill priority className="object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
