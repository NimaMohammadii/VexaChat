"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SvjLockIcon } from "@/components/svj-icons";
import { MENU_ITEM_KEYS, type MenuItemKey } from "@/lib/menu-access";

const MENU_ROUTE_CONFIG: Record<MenuItemKey, { href: string; label: string; match: (pathname: string) => boolean }> = {
  home: { href: "/", label: "Home", match: (pathname) => pathname === "/" },
  meet: { href: "/meet", label: "Meet", match: (pathname) => pathname === "/meet" || pathname.startsWith("/meet/") },
  "private-room": {
    href: "/private-room",
    label: "Private Room",
    match: (pathname) => pathname === "/private-room" || pathname.startsWith("/private-room/")
  },
  friends: { href: "/friends", label: "Friends", match: (pathname) => pathname === "/friends" || pathname.startsWith("/friends/") },
  noir: { href: "/noir", label: "Noir", match: (pathname) => pathname === "/noir" || pathname.startsWith("/noir/") },
  me: { href: "/me", label: "My Profile", match: (pathname) => pathname === "/me" || pathname.startsWith("/me/") }
};

function resolveMenuKey(pathname: string): MenuItemKey | null {
  return MENU_ITEM_KEYS.find((key) => MENU_ROUTE_CONFIG[key].match(pathname)) ?? null;
}

export function MenuAccessGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [lockedKeys, setLockedKeys] = useState<MenuItemKey[]>([]);

  useEffect(() => {
    const loadLocks = async () => {
      const response = await fetch("/api/menu-access", { cache: "no-store" }).catch(() => null);

      if (!response?.ok) {
        setLockedKeys([]);
        return;
      }

      const payload = (await response.json()) as { lockedKeys?: string[] };
      const next = MENU_ITEM_KEYS.filter((key) => payload.lockedKeys?.includes(key));
      setLockedKeys(next);
    };

    void loadLocks();
  }, [pathname]);

  const activeMenuKey = useMemo(() => resolveMenuKey(pathname), [pathname]);
  const isLocked = activeMenuKey ? lockedKeys.includes(activeMenuKey) : false;

  const fallbackHref = useMemo(() => {
    const firstUnlocked = MENU_ITEM_KEYS.find((key) => !lockedKeys.includes(key));
    return firstUnlocked ? MENU_ROUTE_CONFIG[firstUnlocked].href : "/";
  }, [lockedKeys]);

  if (!isLocked || !activeMenuKey) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-[#030303]/92 px-5 backdrop-blur-md">
      <div className="relative w-full max-w-[22rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[#080808]/95 p-5 text-center shadow-[0_35px_90px_rgba(0,0,0,0.6)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-[#FF2E63]/18 blur-3xl" />
          <div className="absolute bottom-0 right-[-6%] h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white">
          <SvjLockIcon className="h-7 w-7" />
        </div>

        <h2 className="relative text-lg font-semibold text-white">Access Locked</h2>
        <p className="relative mt-2 text-xs leading-5 text-white/75">
          Access to <span className="font-semibold text-white">{MENU_ROUTE_CONFIG[activeMenuKey].label}</span> is currently disabled.
        </p>

        <button
          type="button"
          onClick={() => router.replace(fallbackHref)}
          className="relative mt-5 inline-flex min-w-24 items-center justify-center rounded-xl border border-[#FF2E63]/45 bg-[#FF2E63]/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#FF2E63]/25 hover:shadow-[0_0_20px_rgba(255,46,99,0.35)]"
        >
          OK
        </button>
      </div>
    </div>
  );
}
