import Versatile from "@/components/pages/home/ProgramOverview/Versatile";
import Instrumental from "@/components/pages/home/ProgramOverview/Instrumental";
import Strategic from "@/components/pages/home/ProgramOverview/Strategic";

const ProgramOverview = () => {
  return (
    <section className="py-24 bg-white">
      <header className="max-w-5xl mx-auto text-center mb-16 px-6 sm:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Empowering Versatile Learners
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          At Zeta English Academy, we believe learning should be fun and inspiring. We focus on creativity, critical thinking, and communication to help you succeed.
        </p>
      </header>

      <div className="space-y-16 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <Versatile />
        <Instrumental />
        <Strategic />
      </div>
    </section>
  );
};

export default ProgramOverview;
