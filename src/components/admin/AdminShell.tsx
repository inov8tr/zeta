import { ReactNode } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

interface AdminShellProps {
  children: ReactNode;
}

const AdminShell = ({ children }: AdminShellProps) => {
  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default AdminShell;
