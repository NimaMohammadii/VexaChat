import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;

  if (!isAdminTokenValid(adminCookie)) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-ink text-paper md:flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
