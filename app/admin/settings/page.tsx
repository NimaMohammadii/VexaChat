"use client";

import { useEffect, useMemo, useState } from "react";
import { MENU_ITEM_KEYS, type MenuItemKey } from "@/lib/menu-access";

type SaveState = "idle" | "saving" | "saved" | "error";

const labels: Record<MenuItemKey, string> = {
  home: "Home",
  meet: "Meet",
  "private-room": "Private Room",
  friends: "Friends",
  noir: "Noir",
  me: "My Profile"
};

export default function SettingsPage() {
  const [lockedKeys, setLockedKeys] = useState<MenuItemKey[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/menu-access", { cache: "no-store" }).catch(() => null);

      if (!response || !response.ok) {
        setLoadError("Could not load menu access settings.");
        return;
      }

      const data = (await response.json()) as { lockedKeys?: string[] };
      const next = MENU_ITEM_KEYS.filter((key) => data.lockedKeys?.includes(key));
      setLockedKeys(next);
    };

    void load();
  }, []);

  const lockedSet = useMemo(() => new Set(lockedKeys), [lockedKeys]);

  const toggleKey = (key: MenuItemKey) => {
    setSaveState("idle");
    setLockedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const save = async () => {
    setSaveState("saving");

    const response = await fetch("/api/admin/menu-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockedKeys })
    }).catch(() => null);

    if (!response || !response.ok) {
      setSaveState("error");
      return;
    }

    setSaveState("saved");
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-white/75">Control which hamburger-menu sections are temporarily locked for users.</p>
      </div>

      <div className="rounded-2xl border border-line bg-slate p-4">
        <h2 className="text-lg font-semibold text-white">Menu Access Locks</h2>
        <p className="mt-1 text-sm text-white/70">When locked, clicking that item shows a lock message instead of opening the page.</p>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{loadError}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MENU_ITEM_KEYS.map((key) => {
              const isLocked = lockedSet.has(key);

              return (
                <label key={key} className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-3 transition ${isLocked ? "border-[#FF2E63]/45 bg-[#FF2E63]/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}>
                  <div>
                    <p className="text-sm font-medium text-white">{labels[key]}</p>
                    <p className="text-xs text-white/60">{isLocked ? "Locked" : "Available"}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={() => toggleKey(key)}
                    className="h-4 w-4 accent-[#FF2E63]"
                  />
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={Boolean(loadError) || saveState === "saving"}
            className="bw-button disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "saving" ? "Saving..." : "Save locks"}
          </button>
          {saveState === "saved" && <p className="text-sm text-emerald-300">Saved successfully.</p>}
          {saveState === "error" && <p className="text-sm text-red-300">Failed to save. Try again.</p>}
        </div>
      </div>
    </section>
  );
}
