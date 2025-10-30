import type { ReactNode } from "react";

import TeacherHeader from "@/components/teacher/TeacherHeader";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

interface TeacherShellProps {
  children: ReactNode;
  teacherName?: string | null;
}

const TeacherShell = ({ children, teacherName }: TeacherShellProps) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-lightest via-white to-teacher-primary/10 text-neutral-900 print:block print:bg-white">
      <TeacherSidebar />
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20"><TeacherHeader teacherName={teacherName} /></div>
        <main className="flex-1 overflow-y-auto bg-white/70 backdrop-blur print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TeacherShell;
