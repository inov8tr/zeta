import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const Hero = () => {
  return (
    <section className="relative bg-brand-primary text-neutral-lightest h-screen lg:min-h-[90vh] overflow-hidden">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center px-6 sm:px-8 lg:grid-cols-2 lg:gap-12 h-full">
        {/* Text Content */}
        <div className="flex flex-col justify-center text-center lg:text-left h-full sm:py-12">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-6xl">
            <span className="block text-xl font-medium text-brand-accent sm:text-2xl lg:text-3xl">
              Zeta English Academy
            </span>
          </h1>
          <h2 className="mt-2 text-xl sm:text-2xl lg:text-4xl text-neutral-lightest font-semibold">
            We Believe
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-muted leading-relaxed">
            Learning Should be Fun
          </p>
          <p className="mt-2 text-base text-brand-accent leading-relaxed">
            and Spark Creativity!
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="w-full bg-brand-accent text-text-primary hover:bg-brand-accent-dark focus:ring-4 focus:ring-brand-primary sm:w-auto"
            >
              <Link href="/test">Start Learning Today</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-neutral-lightest text-neutral-lightest hover:bg-neutral-lightest hover:text-brand-primary focus:ring-4 focus:ring-neutral-lightest sm:w-auto"
            >
              <Link href="/courses">Explore Programs</Link>
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="hidden lg:block absolute bottom-0 right-0 w-[700px]">
          <Image
            src="/images/BookR.png"
            alt="Student engaged in reading to spark creativity"
            width={700}
            height={700}
            className="object-contain"
          />
        </div>
      </div>

      {/* Decorative pattern */}
      <div className="absolute inset-x-0 -bottom-1">
        <svg
          className="h-8 w-full text-neutral-lightest"
          preserveAspectRatio="none"
          viewBox="0 0 1200 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 32h1200V0L0 32z" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
