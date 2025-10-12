import { ReactNode } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

interface AdminShellProps {
  children: ReactNode;
}

const AdminShell = ({ children }: AdminShellProps) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-lightest via-white to-brand-primary/10 text-neutral-900">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto bg-white/70 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
