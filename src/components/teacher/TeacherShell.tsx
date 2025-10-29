import type { ReactNode } from "react";

import TeacherHeader from "@/components/teacher/TeacherHeader";

interface TeacherShellProps {
  children: ReactNode;
  teacherName?: string | null;
}

const TeacherShell = ({ children, teacherName }: TeacherShellProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-neutral-lightest via-white to-brand-primary/10 text-neutral-900 print:block print:bg-white">
      <TeacherHeader teacherName={teacherName} />
      <main className="flex-1 overflow-y-auto bg-white/70 backdrop-blur print:bg-white print:p-0">
        {children}
      </main>
    </div>
  );
};

export default TeacherShell;

