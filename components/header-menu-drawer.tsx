"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type MenuItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const baseItems: MenuItem[] = [
  { href: "/", label: "Home", match: (pathname) => pathname === "/" },
  { href: "/meet", label: "Meet", match: (pathname) => pathname === "/meet" },
  { href: "/connect", label: "Connect", match: (pathname) => pathname === "/connect" },
  { href: "/me", label: "My Profile", match: (pathname) => pathname === "/me" },
  { href: "/me?tab=favorites", label: "Favorites", match: (pathname) => pathname === "/me" }
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span className={`absolute left-0 top-0 h-[1.5px] w-5 rounded-full bg-white transition ${open ? "translate-y-[7px] rotate-45" : ""}`} />
      <span className={`absolute left-0 top-[7px] h-[1.5px] w-5 rounded-full bg-white transition ${open ? "opacity-0" : "opacity-100"}`} />
      <span className={`absolute left-0 top-[14px] h-[1.5px] w-5 rounded-full bg-white transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
    </span>
  );
}

export function HeaderMenuDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const syncState = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const signedIn = Boolean(session?.user);
      setHasSession(signedIn);

      if (!signedIn) {
        setIsAdmin(false);
        return;
      }

      const adminProbe = await fetch("/api/admin/verifications", { cache: "no-store" }).catch(() => null);
      setIsAdmin(Boolean(adminProbe?.ok));
    };

    void syncState();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void syncState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const items = useMemo(() => {
    return isAdmin
      ? [...baseItems, { href: "/admin", label: "Admin", match: (current: string) => current.startsWith("/admin") }]
      : baseItems;
  }, [isAdmin]);

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line/80 bg-white/[0.03] transition hover:border-white/30 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <MenuIcon open={isOpen} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              key="drawer-backdrop"
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              key="drawer-content"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[84vw] max-w-sm flex-col border-r border-line bg-[#070707]/95 px-4 pb-5 pt-6 shadow-2xl backdrop-blur"
            >
              <p className="mb-5 px-2 text-xs tracking-[0.24em] text-white/65">MENU</p>

              <nav className="space-y-1.5">
                {items.map((item) => {
                  const isActive = item.match(pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-xl px-4 py-3 text-sm transition ${isActive ? "bg-white/[0.12] text-white shadow-[0_0_22px_rgba(255,255,255,0.16)]" : "text-white/78 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.1)]"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={!hasSession}
                  className="w-full rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-white/85 transition hover:border-white/40 hover:bg-white/[0.08] hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
