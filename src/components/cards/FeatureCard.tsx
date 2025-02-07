export default function FeatureCard({ feature }: { feature: { name: string; description: string; icon: JSX.Element } }) {
    return (
      <div className="relative rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
        <dt className="flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-blue text-white">
            {feature.icon}
          </div>
          <p className="text-lg font-semibold leading-8 text-gray-900">{feature.name}</p>
        </dt>
        <dd className="mt-2 text-center text-base leading-7 text-gray-600">{feature.description}</dd>
      </div>
    );
  }
  