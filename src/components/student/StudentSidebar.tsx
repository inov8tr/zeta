"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, GraduationCap, CalendarCheck, BookOpenText, NotebookText, LogOut } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const baseNavItems: NavItem[] = [
  {
    label: "Overview",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    label: "Assessments",
    href: "/student/assessments",
    icon: GraduationCap,
  },
  {
    label: "Consultations",
    href: "/student/consultations",
    icon: CalendarCheck,
  },
  {
    label: "Resources",
    href: "/student/resources",
    icon: BookOpenText,
  },
];

interface StudentSidebarProps {
  showClasses: boolean;
}

const StudentSidebar = ({ showClasses }: StudentSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    if (showClasses) {
      items.splice(3, 0, {
        label: "Classes",
        href: "/student/classes",
        icon: NotebookText,
      });
    }
    return items;
  }, [showClasses]);

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
      console.error("Student sign-out failed", error);
      setSigningOut(false);
    }
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 bg-student-primary text-white shadow-xl sm:flex print:hidden">
      <nav className="flex h-full w-full flex-col gap-8 overflow-y-auto px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image src="/images/ZetaLogo.svg" alt="Zeta logo" fill priority sizes="40px" className="object-contain" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Zeta Student</p>
            <h1 className="text-xl font-semibold text-white">Learning Hub</h1>
          </div>
        </div>
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/student" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? "bg-white text-student-primary shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-student-primary" : "text-white/90"}`} />
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
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out…" : "Logout"}
        </button>
      </nav>
    </aside>
  );
};

export default StudentSidebar;
