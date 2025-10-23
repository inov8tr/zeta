"use client";

import type { ComponentType } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Users, GraduationCap, FileCheck2, LayoutDashboard } from "lucide-react";
import { useState } from "react";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign-out failed", error);
      setSigningOut(false);
    }
  };

  return (
    <aside className="hidden sticky top-0 h-screen w-64 flex-shrink-0 bg-brand-primary text-white shadow-2xl sm:flex print:hidden">
      <nav className="flex w-full flex-col gap-8 overflow-y-auto px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src="/images/ZetaLogo.svg"
              alt="Zeta logo"
              fill
              priority
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-accent/80">Zeta Admin</p>
            <h1 className="text-xl font-semibold text-white">Control Center</h1>
          </div>
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
                      ? "bg-white text-brand-primary shadow-lg"
                      : "text-white/80 hover:bg-brand-primary-light hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-brand-primary" : "text-white/90"}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold uppercase text-white/90 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Logout"}
        </button>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
