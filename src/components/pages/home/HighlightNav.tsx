import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Newspaper, UserPlus } from "lucide-react";

// Define the type for highlight items
interface Highlight {
  title: string;
  icon: JSX.Element;
  href: string;
}

const highlights: Highlight[] = [
  {
    title: "About Us",
    icon: <Users className="h-10 w-10 text-white" />,
    href: "/about",
  },
  {
    title: "Our Programs",
    icon: <BookOpen className="h-10 w-10 text-white" />,
    href: "/programs",
  },
  {
    title: "Blog",
    icon: <Newspaper className="h-10 w-10 text-white" />,
    href: "/blog",
  },
  {
    title: "Join Now",
    icon: <UserPlus className="h-10 w-10 text-white" />,
    href: "/join",
  },
];

export default function HighlightNav() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Explore Our Features
          </h2>
          <p className="mt-2 text-lg text-gray-700">
            Discover what Zeta English Academy offers.
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <Link key={item.title} href={item.href} aria-label={item.title}>
              <Card className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                <CardContent className="p-8 flex flex-col items-center">
                  {/* Icon Design */}
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-full shadow-md">
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{item.title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
