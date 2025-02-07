"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { IconBaseProps } from "react-icons"; // Import IconBaseProps for correct typing

// Dynamically import icons
const FaBookOpen = dynamic(() => import("react-icons/fa").then(mod => mod.FaBookOpen), { ssr: false });
const FaChalkboardTeacher = dynamic(() => import("react-icons/fa").then(mod => mod.FaChalkboardTeacher), { ssr: false });
const FaBlog = dynamic(() => import("react-icons/fa").then(mod => mod.FaBlog), { ssr: false });
const FaUserPlus = dynamic(() => import("react-icons/fa").then(mod => mod.FaUserPlus), { ssr: false });

interface NavItem {
  title: string;
  description: string;
  icon: React.ComponentType<IconBaseProps>;
  link: string;
}

const HighlightNav = () => {
  const navItems: NavItem[] = [
    {
      title: "About Us",
      description: "Learn more about our mission and values.",
      icon: FaChalkboardTeacher,
      link: "/about",
    },
    {
      title: "Our Program",
      description: "Explore our versatile and effective programs.",
      icon: FaBookOpen,
      link: "/programs",
    },
    {
      title: "Blog",
      description: "Read stories and insights from our community.",
      icon: FaBlog,
      link: "/blog",
    },
    {
      title: "Join Now",
      description: "Become a part of our vibrant learning community.",
      icon: FaUserPlus,
      link: "/join",
    },
  ];

  return (
    <section className="py-12 bg-brand-primary-light text-text-primary">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Link href={item.link} key={index}>
              <div className="group block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="text-brand-primary" aria-hidden="true">
                    <IconComponent size={36} />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-neutral-muted">{item.description}</p>
                  <span className="mt-2 text-brand-accent font-medium group-hover:underline">Learn More →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default HighlightNav;
