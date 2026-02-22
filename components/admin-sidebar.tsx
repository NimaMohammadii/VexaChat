"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-line bg-slate md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-5 md:block md:space-y-8">
        <p className="text-sm tracking-[0.2em]">ADMIN</p>
        <form action="/api/admin/logout" method="POST">
          <button className="text-sm text-white/80 transition hover:text-white">Logout</button>
        </form>
      </div>
      <nav className="grid grid-cols-2 gap-2 px-4 pb-5 md:grid-cols-1 md:pb-0">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl border px-4 py-3 text-sm transition ${
                active ? "border-paper" : "border-line hover:border-paper"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
