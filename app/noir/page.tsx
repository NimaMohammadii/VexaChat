"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Country = { code: string; name: string };
type NoirMatchResponse = { meetingId: string; authToken: string; matched: boolean };
type RealtimeKitMeeting = {
  joinRoom?: () => Promise<void>;
  leaveRoom?: () => Promise<void>;
  self?: {
    enableAudio?: () => Promise<void>;
    disableAudio?: () => Promise<void>;
    enableVideo?: () => Promise<void>;
    disableVideo?: () => Promise<void>;
    [key: string]: unknown;
  };
  participants?: {
    joined?: {
      toArray?: () => unknown[];
      addListener?: (eventName: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (eventName: string, callback: (...args: unknown[]) => void) => void;
    };
  };
};

declare global {
  interface Window {
    RealtimeKitClient?: {
      init: (args: { authToken: string; defaults?: { audio?: boolean; video?: boolean } }) => Promise<RealtimeKitMeeting>;
    };
    Telegram?: {
      WebApp?: {
        BackButton?: {
          show?: () => void;
          hide?: () => void;
          onClick?: (callback: () => void) => void;
          offClick?: (callback: () => void) => void;
        };
      };
    };
  }
}

const COUNTRIES: Country[] = [
  { code: "GLOBAL", name: "Global" },
  { code: "DE", name: "Germany" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "TR", name: "Turkey" },
  { code: "IR", name: "Iran" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" }
];

const CORE_SCRIPT_ID = "seenly-realtimekit-core";
const UI_SCRIPT_ID = "seenly-realtimekit-ui";
const CORE_SRC = "https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit@latest/dist/browser.js";
const UI_LOADER_SRC = "https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit-ui@latest/loader/index.es2017.js";

function loadExternalScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function loadRealtimeKit() {
  await loadExternalScript(CORE_SCRIPT_ID, CORE_SRC);

  if (!document.getElementById(UI_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = UI_SCRIPT_ID;
    script.type = "module";
    script.textContent = `import { defineCustomElements } from "${UI_LOADER_SRC}"; defineCustomElements();`;
    document.head.appendChild(script);
  }
}

function IconButton({ children, active = false, danger = false, onClick, label }: { children: ReactNode; active?: boolean; danger?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 active:scale-[0.96] ${
        danger
          ? "border-[#6B102A]/60 bg-[#3A0917]/90 text-white shadow-[0_8px_22px_rgba(0,0,0,0.34)]"
          : active
            ? "border-[#7B1533]/70 bg-[#251019]/90 text-[#E07791] shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
            : "border-white/[0.10] bg-[#0A0708]/82 text-white/88 shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
      }`}
    >
      {children}
    </button>
  );
}

function TextButton({ children, danger = false, disabled = false, onClick }: { children: ReactNode; danger?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 rounded-full border px-7 text-sm font-semibold tracking-[0.08em] transition-all active:scale-[0.98] disabled:opacity-45 ${
        danger
          ? "border-[#6B102A]/65 bg-[#3A0917]/92 text-white"
          : "border-white/[0.10] bg-[#0A0708]/82 text-white/88"
      }`}
    >
      {children}
    </button>
  );
}

function RealtimeKitTile({ meeting, participant, variant }: { meeting: RealtimeKitMeeting | null; participant: unknown; variant: "main" | "self" }) {
  const tileRef = useRef<HTMLElement | null>(null);
  const isMain = variant === "main";

  useEffect(() => {
    if (!tileRef.current || !meeting || !participant) return;
    const tile = tileRef.current as HTMLElement & { meeting?: RealtimeKitMeeting; participant?: unknown };
    tile.meeting = meeting;
    tile.participant = participant;
  }, [meeting, participant]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#050304] ${isMain ? "" : "rounded-[22px] border border-white/[0.12] shadow-[0_12px_32px_rgba(0,0,0,0.42)]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_22%,rgba(70,8,28,0.24),rgba(0,0,0,0)_52%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0)_24%,rgba(0,0,0,0.34))]" />
      {meeting && participant ? React.createElement("rtk-participant-tile", { ref: tileRef, className: "absolute inset-0 h-full w-full" }) : null}
      {!participant ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <div>
            <div className="mx-auto h-14 w-14 rounded-full border border-[#5A1027]/45 bg-[#11070B]" />
            {isMain ? <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/30">{meeting ? "No partner yet" : "Ready"}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CountrySheet({ open, countries, selected, onClose, onSelect, query, onQuery }: { open: boolean; countries: Country[]; selected: string; onClose: () => void; onSelect: (country: Country) => void; query: string; onQuery: (value: string) => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/75" />
          <motion.div initial={{ y: "100%", opacity: 0.8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0.8 }} transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }} className="absolute inset-x-0 bottom-0 z-50 max-h-[72svh] rounded-t-[32px] border-t border-white/10 bg-[#070506]/95 px-4 pb-5 pt-3 shadow-[0_-18px_54px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/18" />
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search country" className="mb-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#7B1533]/60" />
            <div className="max-h-[52svh] space-y-2 overflow-y-auto pr-1">
              {countries.map((country) => {
                const isSelected = selected === country.code;
                return (
                  <button key={country.code} type="button" onClick={() => { onSelect(country); onClose(); }} className={`flex h-12 w-full items-center justify-between rounded-2xl px-3 text-left transition-all ${isSelected ? "border border-[#7B1533]/45 bg-[#241019]" : "border border-transparent bg-transparent active:bg-white/[0.05]"}`}>
                    <span className="text-sm text-white/90">{country.name}</span>
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-[#A92148]" /> : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ChatSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/56" />
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-x-4 bottom-[118px] z-50 rounded-[30px] border border-white/10 bg-[#070506]/94 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Chat</span>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">Close</button>
            </div>
            <div className="mb-3 min-h-[120px] rounded-2xl border border-white/[0.07] bg-black/30 p-3 text-sm text-white/40">Messages will appear here.</div>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3">
              <input placeholder="Type a message..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
              <button type="button" className="rounded-full bg-[#3A0917] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Send</button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reasons = ["Fake profile", "Harassment", "Nudity", "Spam"];
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/60" />
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-x-4 bottom-[118px] z-50 rounded-[30px] border border-[#5A1027]/40 bg-[#070506]/94 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Report</span>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((reason) => (
                <button key={reason} type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm text-white/78 active:bg-[#241019]">{reason}</button>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function NoirPage() {
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryQuery, setCountryQuery] = useState("");
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [friendPending, setFriendPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<RealtimeKitMeeting | null>(null);
  const [localParticipant, setLocalParticipant] = useState<unknown>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<unknown>(null);
  const meetingRef = useRef<RealtimeKitMeeting | null>(null);
  const startInProgressRef = useRef(false);

  const leaveWaitingQueue = useCallback(async () => {
    try {
      await fetch("/api/noir/leave", { method: "POST" });
    } catch (queueError) {
      console.error("Failed to leave noir queue", queueError);
    }
  }, []);

  const resetCallState = useCallback(() => {
    setMicOff(false);
    setCamOff(false);
    setRemoteParticipant(null);
    setLocalParticipant(null);
    setMeeting(null);
    setChatOpen(false);
    setReportOpen(false);
    meetingRef.current = null;
  }, []);

  const stopSession = useCallback(async () => {
    await leaveWaitingQueue();
    try {
      await meetingRef.current?.leaveRoom?.();
    } catch (leaveError) {
      console.error("Failed to leave RealtimeKit room", leaveError);
    }
    resetCallState();
    setStarted(false);
    setStarting(false);
  }, [leaveWaitingQueue, resetCallState]);

  const startSession = useCallback(async () => {
    if (startInProgressRef.current) return;
    startInProgressRef.current = true;
    setError(null);
    setStarting(true);

    try {
      await stopSession();
      const response = await fetch("/api/noir/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: selectedCountry.code })
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<NoirMatchResponse> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to start Cloudflare call.");
      if (!payload.authToken || !payload.meetingId) throw new Error(payload.error || "Invalid Cloudflare call response.");

      await loadRealtimeKit();
      if (!window.RealtimeKitClient) throw new Error("RealtimeKit client did not load.");

      const nextMeeting = await window.RealtimeKitClient.init({ authToken: payload.authToken, defaults: { audio: true, video: true } });
      meetingRef.current = nextMeeting;

      const updateRemoteParticipant = () => {
        const participants = nextMeeting.participants?.joined?.toArray?.() ?? [];
        setRemoteParticipant(participants[0] ?? null);
      };

      nextMeeting.participants?.joined?.addListener?.("participantJoined", updateRemoteParticipant);
      nextMeeting.participants?.joined?.addListener?.("participantLeft", updateRemoteParticipant);
      nextMeeting.participants?.joined?.addListener?.("videoUpdate", updateRemoteParticipant);
      nextMeeting.participants?.joined?.addListener?.("audioUpdate", updateRemoteParticipant);

      await nextMeeting.joinRoom?.();
      await nextMeeting.self?.enableAudio?.();
      await nextMeeting.self?.enableVideo?.();

      setMeeting(nextMeeting);
      setLocalParticipant(nextMeeting.self ?? null);
      updateRemoteParticipant();
      setStarted(true);
    } catch (startError) {
      console.error("Failed to start Noir session", startError);
      setError(startError instanceof Error ? startError.message : "Unable to start call.");
      await meetingRef.current?.leaveRoom?.();
      resetCallState();
      setStarted(false);
    } finally {
      setStarting(false);
      startInProgressRef.current = false;
    }
  }, [resetCallState, selectedCountry.code, stopSession]);

  const skipSession = useCallback(async () => {
    if (!started && !starting) return;
    await startSession();
  }, [startSession, started, starting]);

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    const handleBack = () => {
      if (started || starting) {
        void stopSession();
        return;
      }
      window.history.back();
    };

    backButton?.show?.();
    backButton?.onClick?.(handleBack);

    return () => {
      backButton?.offClick?.(handleBack);
      backButton?.hide?.();
    };
  }, [started, starting, stopSession]);

  useEffect(() => {
    return () => {
      void meetingRef.current?.leaveRoom?.();
      void leaveWaitingQueue();
    };
  }, [leaveWaitingQueue]);

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) => country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query));
  }, [countryQuery]);

  return (
    <main className="fixed inset-0 h-[100svh] w-full overflow-hidden overscroll-none bg-[#020102] text-white touch-none" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(58,7,24,0.18),rgba(0,0,0,0)_34%)]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden pt-20">
        <section className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#050304]">
          <RealtimeKitTile meeting={meeting} participant={remoteParticipant} variant="main" />

          <button type="button" onClick={() => setReportOpen(true)} className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/42 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/55 backdrop-blur-xl">
            Report
          </button>

          <button type="button" onClick={() => setCountrySheetOpen(true)} className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/42 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/60 backdrop-blur-xl">
            {selectedCountry.name}
          </button>

          <div className="absolute bottom-4 right-4 h-[34%] max-h-[172px] min-h-[132px] w-[28%] min-w-[104px] max-w-[134px] overflow-hidden rounded-[24px] bg-[#080506] p-1 shadow-[0_14px_34px_rgba(0,0,0,0.48)] ring-1 ring-white/10">
            <RealtimeKitTile meeting={meeting} participant={localParticipant} variant="self" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/72 backdrop-blur">You</span>
          </div>
        </section>

        <section className="relative min-h-0 flex-1 px-5 py-5">
          <div className="flex h-full min-h-0 flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <TextButton disabled={starting || started} onClick={() => void startSession()}>{starting ? "Starting" : "Start"}</TextButton>
              <TextButton danger disabled={!started && !starting} onClick={() => void stopSession()}>Stop</TextButton>
            </div>

            {error ? <p className="mx-auto max-w-[360px] rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100/80">{error}</p> : null}

            <div className="mx-auto flex w-full max-w-[360px] items-center justify-between rounded-[32px] border border-white/[0.10] bg-[#080506]/88 p-3 shadow-[0_14px_42px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <IconButton label="Skip" active={false} onClick={() => void skipSession()}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 7l6 5-6 5V7Zm8 0 6 5-6 5V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></IconButton>
              <IconButton label="Microphone" active={micOff} onClick={() => { const next = !micOff; setMicOff(next); void (next ? meetingRef.current?.self?.disableAudio?.() : meetingRef.current?.self?.enableAudio?.()); }}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V12A2.5 2.5 0 1 1 9.5 12V6.5A2.5 2.5 0 0 1 12 4Z" stroke="currentColor" strokeWidth="1.6" /><path d="M7 11.5a5 5 0 1 0 10 0M12 17v3M9.5 20h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />{micOff ? <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}</svg></IconButton>
              <IconButton label="Camera" active={camOff} onClick={() => { const next = !camOff; setCamOff(next); void (next ? meetingRef.current?.self?.disableVideo?.() : meetingRef.current?.self?.enableVideo?.()); }}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="4" y="7" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M15 10l5-2v8l-5-2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />{camOff ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}</svg></IconButton>
              <IconButton label="Chat" active={chatOpen} onClick={() => { setChatOpen((value) => !value); setReportOpen(false); }}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v4A3.5 3.5 0 0 1 15.5 15H11l-4.5 4v-4A3.5 3.5 0 0 1 5 11.5v-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></IconButton>
              <IconButton label="Add friend" active={friendPending} onClick={() => setFriendPending((value) => !value)}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">{friendPending ? <path d="M6 12.5 10.2 17 18 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <><circle cx="10" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4.5 18a5.5 5.5 0 0 1 11 0M18.5 8v6M15.5 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>}</svg></IconButton>
            </div>
          </div>
        </section>
      </div>

      <ChatSheet open={chatOpen} onClose={() => setChatOpen(false)} />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
      <CountrySheet open={countrySheetOpen} countries={filteredCountries} selected={selectedCountry.code} onClose={() => setCountrySheetOpen(false)} onSelect={setSelectedCountry} query={countryQuery} onQuery={setCountryQuery} />
    </main>
  );
}
