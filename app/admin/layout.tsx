import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-paper md:flex">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
