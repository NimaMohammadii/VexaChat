"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Country = { code: string; name: string };

type AgoraClient = {
  on: (event: string, listener: (...args: any[]) => void | Promise<void>) => void;
  subscribe: (user: any, mediaType: string) => Promise<void>;
  join: (appId: string, channel: string, token: string, uid: number) => Promise<void>;
  publish: (tracks: any[]) => Promise<void>;
  leave: () => Promise<void>;
};

type LocalAudioTrack = {
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
};

type LocalVideoTrack = {
  close: () => void;
  play: (element: HTMLElement) => void;
  setEnabled: (enabled: boolean) => Promise<void>;
};

async function loadAgora() {
  if (typeof window === "undefined") {
    return null;
  }

  const mod = await import("agora-rtc-sdk-ng");

  return mod.default;
}

const COUNTRIES: Country[] = [
  { code: "GLOBAL", name: "Global" },
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "CD", name: "Democratic Republic of the Congo" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" }
];

function CircleButton({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-13 w-13 rounded-full border bg-white/[0.05] backdrop-blur transition-all duration-200 hover:border-[#FF2E63]/45 hover:shadow-[0_0_18px_rgba(255,46,99,0.22)] active:scale-[0.98] ${
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

function VideoTile({ label, containerId }: { label: string; containerId: string }) {
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_0_24px_rgba(255,46,99,0.16)]">
      <div id={containerId} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_25%,rgba(255,46,99,0.2),rgba(0,0,0,0)_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(255,255,255,0.1),rgba(0,0,0,0)_60%)]" />
      <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] tracking-[0.16em] text-white/80">{label}</span>
    </div>
  );
}

function CountrySheet({
  open,
  countries,
  selected,
  onClose,
  onSelect,
  query,
  onQuery
}: {
  open: boolean;
  countries: Country[];
  selected: string;
  onClose: () => void;
  onSelect: (country: Country) => void;
  query: string;
  onQuery: (value: string) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/70"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-x-0 bottom-0 z-40 max-h-[70svh] rounded-t-3xl border-t border-white/10 bg-black/95 px-4 pb-4 pt-3 backdrop-blur"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search country"
              className="mb-3 h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white placeholder:text-white/45 outline-none"
            />
            <div className="max-h-[52svh] space-y-2 overflow-y-auto pr-1">
              {countries.map((country) => {
                const isSelected = selected === country.code;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onSelect(country);
                      onClose();
                    }}
                    className={`flex h-12 w-full items-center justify-between rounded-xl px-3 text-left transition-all ${
                      isSelected
                        ? "border border-[#FF2E63]/35 bg-white/[0.05] shadow-[0_0_14px_rgba(255,46,99,0.2)]"
                        : "border border-transparent bg-transparent hover:bg-white/[0.05]"
                    }`}
                  >
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
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const [started, setStarted] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryQuery, setCountryQuery] = useState("");
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [friendPending, setFriendPending] = useState(false);
  const clientRef = useRef<AgoraClient | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);

  const clearVideoContainer = useCallback((id: string) => {
    const container = document.getElementById(id);

    if (container) {
      container.innerHTML = "";
    }
  }, []);

  const clearAllVideoContainers = useCallback(() => {
    clearVideoContainer("local-video-container");
    clearVideoContainer("remote-video-container");
  }, [clearVideoContainer]);

  const closeLocalTracks = useCallback(() => {
    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
  }, []);

  const leaveChannel = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.leave();
    }
  }, []);

  const resetControlState = useCallback(() => {
    setMicOff(false);
    setCamOff(false);
  }, []);

  const createClient = useCallback(async () => {
    const AgoraRTC = await loadAgora();

    if (!AgoraRTC) {
      return null;
    }

    if (clientRef.current) {
      return clientRef.current;
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }) as AgoraClient;

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        const remoteContainer = document.getElementById("remote-video-container");

        if (remoteContainer) {
          remoteContainer.innerHTML = "";
          user.videoTrack?.play(remoteContainer);
        }
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        user.videoTrack?.stop();
        clearVideoContainer("remote-video-container");
      }
    });

    client.on("user-left", () => {
      clearVideoContainer("remote-video-container");
    });

    clientRef.current = client;

    return client;
  }, [clearVideoContainer]);

  const fetchToken = useCallback(async (channel: string, uid: number) => {
    const response = await fetch(`/api/agora/token?channel=${encodeURIComponent(channel)}&uid=${uid}`);

    if (!response.ok) {
      throw new Error("Unable to fetch Agora token");
    }

    const data = (await response.json()) as { token?: string };

    if (!data.token) {
      throw new Error("Invalid Agora token response");
    }

    return data.token;
  }, []);

  const fetchMatchChannel = useCallback(async () => {
    const response = await fetch("/api/noir/match", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Unable to fetch match channel");
    }

    const data = (await response.json()) as { channel?: string };

    if (!data.channel) {
      throw new Error("Invalid match channel response");
    }

    return data.channel;
  }, []);

  const startSession = useCallback(async () => {
    const AgoraRTC = await loadAgora();

    if (!AgoraRTC) {
      return;
    }

    if (!appId) {
      console.error("Missing NEXT_PUBLIC_AGORA_APP_ID");
      return;
    }

    const uid = Math.floor(Math.random() * 1_000_000_000);
    const client = await createClient();

    if (!client) {
      return;
    }

    try {
      const channel = await fetchMatchChannel();
      await leaveChannel();
      closeLocalTracks();
      clearAllVideoContainers();

      const token = await fetchToken(channel, uid);

      await client.join(appId, channel, token, uid);
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      await client.publish([audioTrack, videoTrack]);

      const localContainer = document.getElementById("local-video-container");

      if (localContainer) {
        localContainer.innerHTML = "";
        videoTrack.play(localContainer);
      }

      resetControlState();
      setStarted(true);
    } catch (error) {
      console.error("Failed to start session", error);
      await leaveChannel();
      closeLocalTracks();
      clearAllVideoContainers();
      resetControlState();
      setStarted(false);
    }
  }, [appId, clearAllVideoContainers, closeLocalTracks, createClient, fetchMatchChannel, fetchToken, leaveChannel, resetControlState]);

  const stopSession = useCallback(async () => {
    await leaveChannel();
    closeLocalTracks();
    clearAllVideoContainers();
    resetControlState();
    setStarted(false);
  }, [clearAllVideoContainers, closeLocalTracks, leaveChannel, resetControlState]);

  const skipSession = useCallback(async () => {
    if (!started) {
      return;
    }

    await startSession();
  }, [startSession, started]);

  useEffect(() => {
    return () => {
      void leaveChannel();
      closeLocalTracks();
      clearAllVideoContainers();
    };
  }, [clearAllVideoContainers, closeLocalTracks, leaveChannel]);

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();

    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query));
  }, [countryQuery]);

  return (
    <main
      className="relative h-[100svh] w-full overflow-hidden bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <motion.div
        initial={{ opacity: 0.7, scale: 0.985 }}
        animate={{ opacity: started ? 1 : 0.62, scale: started ? 1 : 0.992 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex h-full min-h-0 flex-col pb-3"
      >
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          <button
            type="button"
            aria-label="Back"
            onClick={() => void stopSession()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white backdrop-blur transition-all hover:border-[#FF2E63]/45 hover:shadow-[0_0_18px_rgba(255,46,99,0.22)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCountrySheetOpen(true)}
            className="flex h-10 max-w-[58vw] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm text-white/90 backdrop-blur"
          >
            <span className="truncate">{selectedCountry.name}</span>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
              <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/85 backdrop-blur transition-all hover:border-[#FF2E63]/45 hover:shadow-[0_0_18px_rgba(255,46,99,0.22)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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

        <section className="min-h-0 flex-1 px-4">
          <div className="flex h-full min-h-0 flex-col gap-3">
            <VideoTile label="PARTNER" containerId="remote-video-container" />
            <VideoTile label="YOU" containerId="local-video-container" />
          </div>
        </section>

        <footer className="shrink-0 px-4 pt-3">
          <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2">
            <PillButton variant="skip" onClick={() => void skipSession()}>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M4 7l6 5-6 5V7Zm8 0 6 5-6 5V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </PillButton>

            <CircleButton
              active={micOff}
              onClick={() => {
                const nextMicOff = !micOff;

                setMicOff(nextMicOff);
                void localAudioTrackRef.current?.setEnabled(!nextMicOff);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V12A2.5 2.5 0 1 1 9.5 12V6.5A2.5 2.5 0 0 1 12 4Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 11.5a5 5 0 1 0 10 0M12 17v3M9.5 20h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                {micOff ? <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
              </svg>
            </CircleButton>

            <CircleButton
              active={camOff}
              onClick={() => {
                const nextCamOff = !camOff;

                setCamOff(nextCamOff);
                void localVideoTrackRef.current?.setEnabled(!nextCamOff);
              }}
            >
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

            <PillButton variant="stop" onClick={() => void stopSession()}>
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
            key="overlay"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.965 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black px-7"
          >
            <div className="w-full max-w-sm text-center">
              <h1 className="text-4xl font-semibold tracking-[0.34em] text-white">NOIR</h1>
              <p className="mt-4 text-sm leading-6 text-white/55">Random video encounters in a refined space.</p>
              <p className="text-sm leading-6 text-white/55">Private. Minimal. Instant.</p>
              <ul className="mx-auto mt-6 w-fit space-y-2 text-left text-sm text-white/45">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/45" />Choose country
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/45" />Skip &amp; stop instantly
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/45" />Add friend after a vibe
                </li>
              </ul>
              <button
                type="button"
                onClick={() => void startSession()}
                className="mt-8 h-[52px] w-full rounded-full border border-[#FF2E63]/45 bg-[#FF2E63]/10 px-8 text-sm font-medium tracking-[0.08em] text-white shadow-[0_0_30px_rgba(255,46,99,0.25)] transition-all duration-200 hover:bg-[#FF2E63]/18 active:scale-[0.98]"
              >
                Start
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CountrySheet
        open={countrySheetOpen}
        countries={filteredCountries}
        selected={selectedCountry.code}
        onClose={() => setCountrySheetOpen(false)}
        onSelect={setSelectedCountry}
        query={countryQuery}
        onQuery={setCountryQuery}
      />
    </main>
  );
}
