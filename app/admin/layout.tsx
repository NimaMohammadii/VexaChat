import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isAdminAccessAllowed } from "@/lib/admin-access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-ink text-paper md:flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
