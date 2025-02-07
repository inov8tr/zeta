import React from "react";

// Define prop types for FeatureCard
interface FeatureCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  extraContent?: React.ReactNode;
}

// Define prop types for PerformanceCard
interface PerformanceCardProps {
  description: string;
}

const ProgramOverview = () => {
  console.log("ProgramOverview component rendered");

  return (
    <section className="py-12">
      <WhatWeDoSection />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <FeatureCard
          title="Versatile"
          description="At Zeta English Academy, our focus lies in promoting versatility by nurturing adaptability and establishing a robust foundation."
          link="/about"
          linkText="Learn More"
          extraContent={
            <>
              <h4 className="mt-8 text-lg font-semibold">How We Perform</h4>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <PerformanceCard description="5 out of 10 students apply for special high schools" />
                <PerformanceCard description="99% acceptance rate of those that apply" />
                <PerformanceCard description="Some students choose to study abroad" />
              </div>
            </>
          }
        />

        <FeatureCard
          title="Instrumental"
          description="We prioritize a holistic approach, emphasizing practical, real-world abilities like critical thinking, problem-solving, and effective communication."
          link="/programs"
          linkText="Learn More"
          extraContent={
            <>
              <h4 className="text-lg font-semibold">Our Program</h4>
              <p className="text-neutral-muted mt-2">
                Begin your English proficiency journey with Zeta&rsquo;s streamlined ESL platform. Our structured approach prioritizes real-world skills, including critical thinking and effective communication. Experience clear progression for academic success and beyond.
              </p>
            </>
          }
        />

        <FeatureCard
          title="Strategic"
          description="At Zeta English Academy, we take a strategic approach to learning, offering diverse educational experiences and providing in-depth training."
          link="/programs"
          linkText="Learn More"
          extraContent={
            <>
              <h4 className="text-lg font-semibold">Our System</h4>
              <p className="text-neutral-muted mt-2">
                We focus on English language learning, English education, effective learning strategies, language skills development, and student success.
              </p>
            </>
          }
        />
      </div>
    </section>
  );
};

const WhatWeDoSection = () => {
  console.log("WhatWeDoSection component rendered");

  return (
    <div className="text-center max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Empowering Versatile Learners</h2>
      <p className="text-neutral-muted">
        At Zeta English Academy, we believe that learning should be both fun and inspiring. Our mission is to ignite creativity and provide a solid foundation for our students. Here&rsquo;s what sets us apart:
      </p>
    </div>
  );
};

const FeatureCard = ({ title, description, link, linkText, extraContent }: FeatureCardProps) => {
  console.log(`FeatureCard rendered with title: ${title}`);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md text-center">
      <h3 className="text-xl font-semibold text-brand-primary mb-2">{title}</h3>
      <p className="text-neutral-muted mb-4">{description}</p>
      <a href={link} className="button-primary inline-block mt-4">{linkText}</a>
      {extraContent && <div className="mt-8">{extraContent}</div>}
    </div>
  );
};

const PerformanceCard = ({ description }: PerformanceCardProps) => {
  console.log(`PerformanceCard rendered with description: ${description}`);

  return (
    <div className="p-4 bg-background-light rounded shadow-sm">
      <p className="text-neutral-dark">{description}</p>
    </div>
  );
};

export default ProgramOverview;
