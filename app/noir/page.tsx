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

function CircleButton({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-13 w-13 rounded-full border bg-white/[0.05] backdrop-blur transition-all duration-200 active:scale-[0.98] ${
        active ? "border-[#FF2E63]/50 text-[#FF2E63]" : "border-white/10 text-white"
      }`}
    >
      <span className="flex items-center justify-center">{children}</span>
    </button>
  );
}

function PillButton({ children, variant = "skip", onClick }: { children: ReactNode; variant?: "skip" | "stop"; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-13 rounded-full px-6 transition-all duration-200 active:scale-[0.98] ${
        variant === "skip"
          ? "border border-[#FF2E63]/40 bg-white/[0.06] text-white shadow-[0_0_20px_rgba(255,46,99,0.24)]"
          : "border border-white/15 bg-white/[0.06] text-white shadow-[0_0_14px_rgba(255,46,99,0.14)]"
      }`}
    >
      <span className="flex items-center justify-center">{children}</span>
    </button>
  );
}

function RealtimeKitTile({ label, meeting, participant }: { label: string; meeting: RealtimeKitMeeting | null; participant: unknown }) {
  const tileRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!tileRef.current || !meeting || !participant) return;
    const tile = tileRef.current as HTMLElement & { meeting?: RealtimeKitMeeting; participant?: unknown };
    tile.meeting = meeting;
    tile.participant = participant;
  }, [meeting, participant]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_0_24px_rgba(255,46,99,0.16)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_25%,rgba(255,46,99,0.2),rgba(0,0,0,0)_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(255,255,255,0.1),rgba(0,0,0,0)_60%)]" />
      {meeting && participant ? React.createElement("rtk-participant-tile", { ref: tileRef, className: "absolute inset-0 h-full w-full object-cover" }) : null}
      <span className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] tracking-[0.16em] text-white/80">{label}</span>
    </div>
  );
}

function CountrySheet({ open, countries, selected, onClose, onSelect, query, onQuery }: { open: boolean; countries: Country[]; selected: string; onClose: () => void; onSelect: (country: Country) => void; query: string; onQuery: (value: string) => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/70" />
          <motion.div initial={{ y: "100%", opacity: 0.8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0.8 }} transition={{ duration: 0.32 }} className="absolute inset-x-0 bottom-0 z-40 max-h-[70svh] rounded-t-3xl border-t border-white/10 bg-black/95 px-4 pb-4 pt-3 backdrop-blur">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search country" className="mb-3 h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white placeholder:text-white/45 outline-none" />
            <div className="max-h-[52svh] space-y-2 overflow-y-auto pr-1">
              {countries.map((country) => {
                const isSelected = selected === country.code;
                return (
                  <button key={country.code} type="button" onClick={() => { onSelect(country); onClose(); }} className={`flex h-12 w-full items-center justify-between rounded-xl px-3 text-left transition-all ${isSelected ? "border border-[#FF2E63]/35 bg-white/[0.05] shadow-[0_0_14px_rgba(255,46,99,0.2)]" : "border border-transparent bg-transparent"}`}>
                    <span className="text-sm text-white/90">{country.name}</span>
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-[#FF2E63]" /> : null}
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

export default function NoirPage() {
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
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
    <main className="relative h-[100svh] w-full overflow-hidden bg-black text-white" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <motion.div initial={{ opacity: 0.7, scale: 0.985 }} animate={{ opacity: started ? 1 : 0.62, scale: started ? 1 : 0.992 }} transition={{ duration: 0.4 }} className="flex h-full min-h-0 flex-col pb-3">
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          <button type="button" aria-label="Back" onClick={() => void stopSession()} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white backdrop-blur transition-all">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => setCountrySheetOpen(true)} className="flex h-10 max-w-[58vw] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm text-white/90 backdrop-blur">
            <span className="truncate">{selectedCountry.name}</span>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/85 backdrop-blur transition-all">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M10.9 3.5h2.2l.5 1.8c.5.2 1 .4 1.5.6l1.7-.9 1.6 1.6-.9 1.7c.3.5.5 1 .6 1.5l1.8.5v2.2l-1.8.5c-.2.5-.4 1-.6 1.5l.9 1.7-1.6 1.6-1.7-.9c-.5.3-1 .5-1.5.6l-.5 1.8h-2.2l-.5-1.8c-.5-.2-1-.4-1.5-.6l-1.7.9-1.6-1.6.9-1.7c-.3-.5-.5-1-.6-1.5l-1.8-.5v-2.2l1.8-.5c.2-.5.4-1 .6-1.5l-.9-1.7 1.6-1.6 1.7.9c.5-.3 1-.5 1.5-.6l.5-1.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
          </button>
        </header>

        <section className="min-h-0 flex-1 px-4">
          <div className="flex h-full min-h-0 flex-col gap-3">
            <RealtimeKitTile label="PARTNER" meeting={meeting} participant={remoteParticipant} />
            <RealtimeKitTile label="YOU" meeting={meeting} participant={localParticipant} />
          </div>
        </section>

        <footer className="shrink-0 px-4 pt-3">
          <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2">
            <PillButton variant="skip" onClick={() => void skipSession()}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 7l6 5-6 5V7Zm8 0 6 5-6 5V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></PillButton>
            <CircleButton active={micOff} onClick={() => { const next = !micOff; setMicOff(next); void (next ? meetingRef.current?.self?.disableAudio?.() : meetingRef.current?.self?.enableAudio?.()); }}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V12A2.5 2.5 0 1 1 9.5 12V6.5A2.5 2.5 0 0 1 12 4Z" stroke="currentColor" strokeWidth="1.6" /><path d="M7 11.5a5 5 0 1 0 10 0M12 17v3M9.5 20h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />{micOff ? <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}</svg></CircleButton>
            <CircleButton active={camOff} onClick={() => { const next = !camOff; setCamOff(next); void (next ? meetingRef.current?.self?.disableVideo?.() : meetingRef.current?.self?.enableVideo?.()); }}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="4" y="7" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M15 10l5-2v8l-5-2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />{camOff ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}</svg></CircleButton>
            <CircleButton active={friendPending} onClick={() => setFriendPending((value) => !value)}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">{friendPending ? <path d="M6 12.5 10.2 17 18 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <><circle cx="10" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4.5 18a5.5 5.5 0 0 1 11 0M18.5 8v6M15.5 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>}</svg></CircleButton>
            <CircleButton><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 15v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="18" r="0.9" fill="currentColor" /><path d="m12 4 8 14H4L12 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></CircleButton>
            <PillButton variant="stop" onClick={() => void stopSession()}><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="7" y="7" width="10" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.8" /></svg></PillButton>
          </div>
        </footer>
      </motion.div>

      <AnimatePresence>
        {!started ? (
          <motion.div key="overlay" initial={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.965 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-20 flex items-center justify-center bg-black px-7">
            <div className="w-full max-w-sm text-center">
              <h1 className="text-4xl font-semibold tracking-[0.34em] text-white">NOIR</h1>
              <p className="mt-4 text-sm leading-6 text-white/55">Random video encounters in a refined space.</p>
              <p className="text-sm leading-6 text-white/55">Private. Minimal. Instant.</p>
              {error ? <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100/80">{error}</p> : null}
              <ul className="mx-auto mt-6 w-fit space-y-2 text-left text-sm text-white/45">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/45" />Choose country</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/45" />Skip &amp; stop instantly</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/45" />Add friend after a vibe</li>
              </ul>
              <button type="button" onClick={() => void startSession()} disabled={starting} className="mt-8 h-[52px] w-full rounded-full border border-[#FF2E63]/45 bg-[#FF2E63]/10 px-8 text-sm font-medium tracking-[0.08em] text-white shadow-[0_0_30px_rgba(255,46,99,0.25)] transition-all duration-200 active:scale-[0.98] disabled:opacity-60">
                {starting ? "Starting..." : "Start"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CountrySheet open={countrySheetOpen} countries={filteredCountries} selected={selectedCountry.code} onClose={() => setCountrySheetOpen(false)} onSelect={setSelectedCountry} query={countryQuery} onQuery={setCountryQuery} />
    </main>
  );
}
