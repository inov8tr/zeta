import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { numberFormatter, type RosterSummaryItem } from "@/app/teacher/dashboardData";

interface CommunicationPanelProps {
  rosterSummary: RosterSummaryItem[];
}

const CommunicationPanel = ({ rosterSummary }: CommunicationPanelProps) => {
  const hasRoster = rosterSummary.length > 0;

  const quickLinks = [
    {
      title: "Email all classes",
      description: "Share reminders or send a weekly newsletter.",
      href: "mailto:info@zeta-eng.co.kr?subject=Teacher%20Announcement",
      external: true,
    },
    {
      title: "Contact Zeta support",
      description: "Coordinate make-ups or flag assessment issues.",
      href: "mailto:support@zeta-eng.co.kr?subject=Teacher%20Support%20Request",
      external: true,
    },
    {
      title: "Log parent outreach",
      description: "Track follow-ups and keep admin in the loop.",
      href: "/teacher/resources",
    },
  ];

  return (
    <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
      <header className="border-b border-teacher-primary/10 px-6 py-4">
        <h3 className="text-lg font-semibold text-teacher-primary-text">Stay in touch</h3>
        <p className="text-xs text-neutral-muted">
          Broadcast announcements or reach support without leaving the dashboard.
        </p>
      </header>
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-teacher-primary/10 bg-teacher-primary/5 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.4em] text-teacher-primary-text">
            Class coverage
          </h4>
          {hasRoster ? (
            <ul className="mt-4 space-y-3">
              {rosterSummary.map((item) => (
                <li
                  key={item.classId}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-sm text-teacher-primary-text"
                >
                  <div>
                    <p className="font-semibold">{item.className}</p>
                    <p className="text-xs uppercase tracking-widest text-neutral-muted">
                      {item.level ? `Level ${item.level}` : "Mixed level"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text">
                    {numberFormatter.format(item.studentCount)} students
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-muted">
              Classes will appear here once your roster is connected. Contact support if something looks
              missing.
            </p>
          )}
        </div>
        <div className="grid gap-4">
          {quickLinks.map((link) => {
            const isExternal =
              (link.external ?? false) || link.href.startsWith("http") || link.href.startsWith("mailto:");
            return (
              <Link
                key={link.title}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="group flex flex-col rounded-2xl border border-teacher-primary/10 bg-white p-4 transition hover:border-teacher-primary hover:shadow-lg"
              >
                <span className="text-sm font-semibold text-teacher-primary-text">{link.title}</span>
                <span className="mt-1 text-xs text-neutral-muted">{link.description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-teacher-primary-text">
                  Open
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
};

export default CommunicationPanel;
