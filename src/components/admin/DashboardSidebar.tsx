"use client";

import type { ComponentType } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, GraduationCap, FileCheck2, LayoutDashboard } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Consultations",
    href: "/dashboard/consultations",
    icon: CalendarDays,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "Classes",
    href: "/dashboard/classes",
    icon: GraduationCap,
  },
  {
    label: "Tests",
    href: "/dashboard/tests",
    icon: FileCheck2,
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-white/80 backdrop-blur sm:flex sm:min-h-screen">
      <nav className="flex w-full flex-col gap-8 px-6 py-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400">Zeta Admin</p>
          <h1 className="text-xl font-semibold text-neutral-900">Control Center</h1>
        </div>
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="text-xs text-neutral-400">
          Need help? <a href="mailto:info@zeta-eng.co.kr" className="font-semibold text-neutral-600">Contact support</a>
        </div>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
