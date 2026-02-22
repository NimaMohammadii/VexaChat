import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isAdminUser } from "@/lib/admin";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminUser(user)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-ink text-paper md:flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
