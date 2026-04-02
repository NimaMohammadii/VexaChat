"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createSupabaseClient } from "@/lib/supabase-client";
import { SvjHeartIcon, SvjHomeIcon, SvjLockIcon } from "@/components/svj-icons";
import { MENU_ITEM_KEYS, type MenuItemKey } from "@/lib/menu-access";

type MenuItem = {
  key: MenuItemKey;
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


function FriendsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <circle cx="7" cy="7.2" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13.2" cy="8.2" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.9 15.6a3.6 3.6 0 0 1 6.2-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.3 15.6a3 3 0 0 1 5.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function NoirIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={iconClassName()} aria-hidden>
      <path d="M2.6 10s2.4-4 7.4-4 7.4 4 7.4 4-2.4 4-7.4 4-7.4-4-7.4-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
  { key: "home", href: "/", label: "Home", match: (pathname) => pathname === "/", Icon: HomeIcon },
  { key: "meet", href: "/meet", label: "Meet", match: (pathname) => pathname === "/meet", Icon: MeetIcon },
  { key: "private-room", href: "/private-room", label: "Private Room", match: (pathname) => pathname === "/private-room", Icon: PrivateRoomIcon },
  { key: "friends", href: "/friends", label: "Friends", match: (pathname) => pathname === "/friends", Icon: FriendsIcon },
  { key: "noir", href: "/noir", label: "Noir", match: (pathname) => pathname === "/noir", Icon: NoirIcon },
  { key: "me", href: "/me", label: "My Profile", match: (pathname) => pathname === "/me", Icon: ProfileIcon },
];

function MenuIcon({ open, variant = "default" }: { open: boolean; variant?: "default" | "minimal" }) {
  const lineClass = variant === "minimal" ? "bg-white/88 shadow-none" : "bg-gradient-to-r from-white via-white to-[#FF2E63] shadow-[0_0_12px_rgba(255,46,99,0.45)]";
  const bottomLineClass = variant === "minimal" ? "bg-white/72 shadow-none" : "bg-gradient-to-r from-[#FF2E63] via-white to-white shadow-[0_0_12px_rgba(255,46,99,0.45)]";

  return (
    <span className="relative block h-5 w-6" aria-hidden>
      <span className={`absolute left-0 top-0 h-[2px] w-6 origin-center rounded-full transition-all duration-300 will-change-transform ${lineClass} ${open ? "translate-y-[9px] rotate-45" : ""}`} />
      <span className={`absolute left-0 top-[9px] h-[2px] w-6 origin-center rounded-full bg-white/95 transition-all duration-300 will-change-transform ${open ? "scale-x-0 opacity-0" : "opacity-100"}`} />
      <span className={`absolute left-0 top-[18px] h-[2px] w-6 origin-center rounded-full transition-all duration-300 will-change-transform ${bottomLineClass} ${open ? "-translate-y-[9px] -rotate-45" : ""}`} />
    </span>
  );
}

export function HeaderMenuDrawer({ variant = "default" }: { variant?: "default" | "minimal" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [lockedMenuKeys, setLockedMenuKeys] = useState<MenuItemKey[]>([]);
  const [lockedMenuModal, setLockedMenuModal] = useState<{ open: boolean; label: string }>({ open: false, label: "" });

  const loadLocks = useCallback(async () => {
    const response = await fetch("/api/menu-access", { cache: "no-store" }).catch(() => null);

    if (!response || !response.ok) {
      return;
    }

    const data = (await response.json()) as { lockedKeys?: string[] };
    const filtered = MENU_ITEM_KEYS.filter((key) => data.lockedKeys?.includes(key));
    setLockedMenuKeys(filtered);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    void loadLocks();
  }, [loadLocks]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadLocks();
  }, [isOpen, loadLocks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void loadLocks();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadLocks]);

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

  useEffect(() => {
    setLockedMenuModal({ open: false, label: "" });
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  const lockedKeySet = new Set(lockedMenuKeys);

  const handleLockedItemClick = (label: string) => {
    setLockedMenuModal({ open: true, label });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={variant === "minimal"
          ? "group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white transition-all duration-300 hover:border-white/18 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          : "group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,46,99,0.24),rgba(255,255,255,0.04)_55%,rgba(255,255,255,0.02))] transition-all duration-300 hover:scale-[1.03] hover:border-[#FF2E63]/60 hover:shadow-[0_0_30px_rgba(255,46,99,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E63]/70"}
      >
        <MenuIcon open={isOpen} variant={variant} />
      </button>

      {mounted &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              tabIndex={isOpen ? 0 : -1}
              className={`fixed inset-0 z-[9998] bg-black/70 transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100 ease-out" : "pointer-events-none opacity-0 ease-in"}`}
              onClick={() => setIsOpen(false)}
            />

            <aside
              className={`fixed left-0 top-0 z-[9999] flex h-full w-[50vw] max-w-[380px] min-w-[270px] transform-gpu flex-col overflow-hidden border-r border-[#FF2E63]/30 bg-[#060606]/96 px-4 pb-5 pt-6 shadow-[0_0_60px_rgba(255,46,99,0.22)] backdrop-blur transition-[transform,opacity] duration-300 will-change-transform ${isOpen ? "pointer-events-auto translate-x-0 opacity-100 ease-out" : "pointer-events-none -translate-x-full opacity-90 ease-in"}`}
              aria-hidden={!isOpen}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-14 top-[-12%] h-44 w-44 rounded-full bg-[#FF2E63]/18 blur-3xl" />
                <div className="absolute right-[-30%] top-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-1/4 h-36 w-36 rounded-full bg-[#FF2E63]/16 blur-2xl" />
              </div>

              <div className={`relative z-10 mb-5 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 transition-all duration-300 ease-out ${isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                <p className="text-[11px] tracking-[0.3em] text-white/55">NAVIGATION</p>
                <p className="mt-1 text-sm text-white/85">Choose your next vibe</p>
              </div>

              <nav className="relative z-10 space-y-2">
                {items.map((item, index) => {
                  const isActive = item.match(pathname);
                  const Icon = item.Icon;
                  const delay = isOpen ? 80 + index * 35 : (items.length - index) * 20;

                  return (
                    <div key={item.href}>
                      {lockedKeySet.has(item.key) ? (
                        <button
                          type="button"
                          onClick={() => handleLockedItemClick(item.label)}
                          style={{ transitionDelay: `${delay}ms` }}
                          className={`group flex w-full items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-500/5 px-4 py-3 text-left text-sm text-white/80 transition-all duration-300 ease-out hover:border-amber-300/40 hover:bg-amber-500/10 ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"}`}
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/30 bg-black/30 text-amber-100">
                            <Icon />
                          </span>
                          <span className="font-medium tracking-wide">{item.label}</span>
                          <span className="ml-auto text-xs text-amber-100/80">Locked</span>
                        </button>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{ transitionDelay: `${delay}ms` }}
                          className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-300 ease-out ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"} ${isActive ? "border-[#FF2E63]/45 bg-gradient-to-r from-[#FF2E63]/25 via-white/[0.08] to-transparent text-white shadow-[0_0_24px_rgba(255,46,99,0.25)]" : "border-white/10 bg-white/[0.02] text-white/80 hover:border-[#FF2E63]/35 hover:bg-gradient-to-r hover:from-[#FF2E63]/15 hover:via-white/[0.06] hover:to-transparent hover:text-white hover:shadow-[0_0_20px_rgba(255,46,99,0.18)]"}`}
                        >
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${isActive ? "border-[#FF2E63]/45 bg-[#FF2E63]/20 text-white" : "border-white/15 bg-black/25 text-white/75 group-hover:border-[#FF2E63]/35 group-hover:text-white"}`}>
                            <Icon />
                          </span>
                          <span className="font-medium tracking-wide">{item.label}</span>
                          <span className="ml-auto text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white/75">→</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="relative z-10 mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={!hasSession}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/85 transition duration-300 hover:border-[#FF2E63]/40 hover:bg-[#FF2E63]/12 hover:shadow-[0_0_18px_rgba(255,46,99,0.18)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <SignOutIcon />
                  <span>Sign out</span>
                </button>
              </div>
            </aside>

            {lockedMenuModal.open && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
                <div className="relative w-full max-w-[22rem] overflow-hidden rounded-3xl border border-white/15 bg-[#0A0A0A]/95 p-5 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                  <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-6 top-4 h-28 w-28 rounded-full bg-[#FF2E63]/20 blur-3xl" />
                    <div className="absolute right-0 top-10 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
                  </div>

                  <div className="relative mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white">
                    <SvjLockIcon className="h-7 w-7" />
                  </div>
                  <h3 className="relative text-lg font-semibold text-white">Access Locked</h3>
                  <p className="relative mt-2 text-xs leading-5 text-white/75">
                    Access to <span className="font-semibold text-white">{lockedMenuModal.label}</span> is currently disabled.
                  </p>
                  <p className="relative mt-1 text-[11px] tracking-wide text-white/45">Please contact the admin to unlock this section.</p>

                  <button
                    type="button"
                    onClick={() => setLockedMenuModal({ open: false, label: "" })}
                    className="relative mt-5 inline-flex min-w-24 items-center justify-center rounded-xl border border-[#FF2E63]/45 bg-[#FF2E63]/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#FF2E63]/25 hover:shadow-[0_0_20px_rgba(255,46,99,0.35)]"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
}
