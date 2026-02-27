"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

function CircleButton({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 w-12 rounded-full border bg-white/[0.05] backdrop-blur transition-all duration-200 active:scale-[0.98] hover:border-[#FF2E63]/40 hover:shadow-[0_0_18px_rgba(255,46,99,0.22)] ${
        active ? "border-[#FF2E63]/45 text-[#FF2E63]" : "border-white/10 text-white"
      }`}
    >
      <span className="flex items-center justify-center">{children}</span>
    </button>
  );
}

function PillButton({ variant, onClick, children }: { variant: "skip" | "stop"; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-full px-5 transition-all duration-200 active:scale-[0.98] ${
        variant === "skip"
          ? "border border-[#FF2E63]/35 bg-white/[0.06] text-white shadow-[0_0_18px_rgba(255,46,99,0.22)] hover:border-[#FF2E63]/55"
          : "border border-white/15 bg-white/[0.06] text-white shadow-[0_0_14px_rgba(255,46,99,0.14)] hover:border-[#FF2E63]/35"
      }`}
    >
      <span className="flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

export default function NoirPage() {
  const [started, setStarted] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [friendPending, setFriendPending] = useState(false);

  return (
    <main
      className="relative h-[100svh] w-full overflow-hidden bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)"
      }}
    >
      <motion.div
        initial={{ opacity: 0.9, scale: 0.985 }}
        animate={{ opacity: started ? 1 : 0.6, scale: started ? 1 : 0.992 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex h-full flex-col px-3 pb-3"
      >
        <header className="flex shrink-0 items-center justify-between py-2">
          <span className="text-[11px] tracking-[0.24em] text-white/70">NOIR</span>
          <span className="text-xs text-white/75">00:42</span>
          <button
            type="button"
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition-all duration-200 hover:border-[#FF2E63]/40 hover:shadow-[0_0_16px_rgba(255,46,99,0.2)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M10.9 3.5h2.2l.5 1.8c.5.2 1 .4 1.5.6l1.7-.9 1.6 1.6-.9 1.7c.3.5.5 1 .6 1.5l1.8.5v2.2l-1.8.5c-.2.5-.4 1-.6 1.5l.9 1.7-1.6 1.6-1.7-.9c-.5.3-1 .5-1.5.6l-.5 1.8h-2.2l-.5-1.8c-.5-.2-1-.4-1.5-.6l-1.7.9-1.6-1.6.9-1.7c-.3-.5-.5-1-.6-1.5l-1.8-.5v-2.2l1.8-.5c.2-.5.4-1 .6-1.5l-.9-1.7 1.6-1.6 1.7.9c.5-.3 1-.5 1.5-.6l.5-1.8Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </header>

        <section className="relative min-h-0 flex-1 py-1">
          <div className="relative h-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_0_40px_rgba(255,46,99,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,46,99,0.2),rgba(0,0,0,0)_65%)]" />
            <div className="absolute bottom-24 right-3 h-24 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur">
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0)_70%)]" />
            </div>
          </div>
        </section>

        <footer className="shrink-0 pt-3">
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2">
            <PillButton variant="skip">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M4 7l6 5-6 5V7Zm8 0 6 5-6 5V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </PillButton>

            <CircleButton active={micOff} onClick={() => setMicOff((value) => !value)}>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V12A2.5 2.5 0 1 1 9.5 12V6.5A2.5 2.5 0 0 1 12 4Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 11.5a5 5 0 1 0 10 0M12 17v3M9.5 20h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                {micOff ? <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
              </svg>
            </CircleButton>

            <CircleButton active={camOff} onClick={() => setCamOff((value) => !value)}>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="4" y="7" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M15 10l5-2v8l-5-2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                {camOff ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
              </svg>
            </CircleButton>

            <CircleButton active={friendPending} onClick={() => setFriendPending((value) => !value)}>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                {friendPending ? (
                  <path d="M6 12.5 10.2 17 18 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <>
                    <circle cx="10" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M4.5 18a5.5 5.5 0 0 1 11 0M18.5 8v6M15.5 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </CircleButton>

            <CircleButton>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M12 15v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="12" cy="18" r="0.9" fill="currentColor" />
                <path d="m12 4 8 14H4L12 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </CircleButton>

            <PillButton variant="stop">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="7" y="7" width="10" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </PillButton>
          </div>
        </footer>
      </motion.div>

      <AnimatePresence>
        {!started ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black"
          >
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-4xl font-semibold tracking-[0.34em] text-white">NOIR</h1>
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="rounded-full border border-[#FF2E63]/40 bg-white/[0.06] px-8 py-3 text-sm text-white shadow-[0_0_24px_rgba(255,46,99,0.28)] transition-all duration-200 active:scale-[0.98] hover:border-[#FF2E63]/60 hover:bg-white/[0.1]"
              >
                Start
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
