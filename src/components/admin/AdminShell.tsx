import { ReactNode } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

interface AdminShellProps {
  children: ReactNode;
}

const AdminShell = ({ children }: AdminShellProps) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-lightest via-white to-brand-primary/10 text-neutral-900 print:block print:bg-white">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20"><DashboardHeader /></div>
        <div className="flex-1 overflow-y-auto bg-white/70 backdrop-blur print:bg-white print:p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
