"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { SvjHeartIcon, SvjHomeIcon } from "@/components/svj-icons";

type MenuItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  Icon: () => JSX.Element;
};

function iconClassName() {
  return "h-5 w-5 shrink-0";
}

function HomeIcon() {
  return <SvjHomeIcon className={iconClassName()} />;
}

function MeetIcon() {
  return <SvjHeartIcon className={iconClassName()} />;
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <path d="M7.2 12.8 12.8 7.2M6.4 6.4h3.2M10.4 13.6h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.6 14.8H5.4A2.4 2.4 0 0 1 3 12.4v-2a2.4 2.4 0 0 1 2.4-2.4h2.2M12.4 5.2h2.2A2.4 2.4 0 0 1 17 7.6v2a2.4 2.4 0 0 1-2.4 2.4h-2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrivateRoomIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <rect x="4" y="8.3" width="12" height="8.2" rx="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.8 8.3V6.6a3.2 3.2 0 0 1 6.4 0v1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="12.4" r="1.1" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <path d="M10 10.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.8a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FavoritesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <path d="m10 3 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9L2.8 8.2l5-.7L10 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <path d="M8 4.5H5.8A1.8 1.8 0 0 0 4 6.3v7.4a1.8 1.8 0 0 0 1.8 1.8H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13.5 16 10l-4-3.5M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const items: MenuItem[] = [
  { href: "/", label: "Home", match: (pathname) => pathname === "/", Icon: HomeIcon },
  { href: "/meet", label: "Meet", match: (pathname) => pathname === "/meet", Icon: MeetIcon },
  { href: "/private-room", label: "Private Room", match: (pathname) => pathname === "/private-room", Icon: PrivateRoomIcon },
  { href: "/connect", label: "Connect", match: (pathname) => pathname === "/connect", Icon: ConnectIcon },
  { href: "/me", label: "My Profile", match: (pathname) => pathname === "/me", Icon: ProfileIcon },
  { href: "/me?tab=favorites", label: "Favorites", match: (pathname) => pathname === "/me", Icon: FavoritesIcon }
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
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const syncState = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setHasSession(Boolean(session?.user));
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
              className="fixed left-0 top-0 z-50 flex h-full w-[50vw] max-w-[360px] min-w-[260px] flex-col border-r border-line bg-[#070707]/95 px-4 pb-5 pt-6 shadow-2xl backdrop-blur"
            >
              <p className="mb-5 px-2 text-xs tracking-[0.24em] text-white/65">MENU</p>

              <nav className="space-y-1.5">
                {items.map((item) => {
                  const isActive = item.match(pathname);
                  const Icon = item.Icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? "bg-white/[0.12] text-white shadow-[0_0_22px_rgba(255,255,255,0.16)]" : "text-white/78 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.1)]"}`}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={!hasSession}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-white/85 transition hover:border-white/40 hover:bg-white/[0.08] hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <SignOutIcon />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
