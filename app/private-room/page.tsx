"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { RoomCreateSheet } from "@/components/private-room/room-create-sheet";
import { PRIVATE_ROOM_FRIENDS } from "@/lib/mock/private-room-friends";

function PlusDoorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M7 4.5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4.5Zm2 0V19h8.5V4.5H9ZM3 12a1 1 0 0 1 1-1h2v2H4a1 1 0 0 1-1-1Zm8-1h2v-2h2v2h2v2h-2v2h-2v-2h-2v-2Z" fill="currentColor" />
    </svg>
  );
}

export default function PrivateRoomPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="relative flex h-[100svh] overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-14 h-56 w-56 rounded-full bg-[#FF2E63]/15 blur-[90px]" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-white/10 blur-[110px]" />
      </div>

      <section className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
              Secure • Invite-only
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Private Room</h1>
            <p className="max-w-xs text-sm text-white/65">Invite-only space to talk with friends</p>
          </div>
          <HeaderMenuDrawer />
        </header>

        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">Live preview</p>
          <h2 className="mt-2 text-xl font-medium leading-tight">Quiet by design, made for your inner circle.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Build a private lobby, send selected invites, and gather everyone in one elegant place.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
            <div className="flex -space-x-2">
              {["AL", "MK", "TN"].map((item) => (
                <div key={item} className="flex h-9 w-9 items-center justify-center rounded-full border border-black bg-white text-[11px] font-semibold text-black">
                  {item}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 px-2 py-1">Audio</span>
              <span className="rounded-full border border-white/15 px-2 py-1">Private Link</span>
            </div>
          </div>
        </motion.article>

        <div className="mt-auto flex flex-col items-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setSheetOpen(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-gradient-to-r from-white to-[#ffdce6] px-7 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,46,99,0.25)] transition duration-300 hover:brightness-95"
          >
            <PlusDoorIcon />
            Create Space
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </motion.button>
          <p className="mt-4 text-center text-[11px] tracking-[0.12em] text-white/45">No calls yet — UI preview mode</p>
        </div>
      </section>

      <RoomCreateSheet open={sheetOpen} onClose={() => setSheetOpen(false)} friends={PRIVATE_ROOM_FRIENDS} />
    </main>
  );
}
