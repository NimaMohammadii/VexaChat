"use client";

import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { presignRead, presignUpload, uploadFileWithPresignedUrl } from "@/lib/client/storage";
import { processImageFile, previewUrl as makePreviewUrl } from "@/lib/image-processing";

// ── types ─────────────────────────────────────────────────────────────────────

type LocalAudioTrack = { close: () => void; setEnabled: (e: boolean) => Promise<void> };

type Friend = { id: string; username: string; avatarUrl: string };

type Invite = {
id: string; roomId: string; roomName: string | null;
roomCode: string; ownerUsername: string; createdAt?: string;
};

type Participant = {
id: string; userId: string; role: "owner" | "participant";
username: string; avatarUrl: string;
};

type RoomDetails = {
id: string; roomCode: string; channelName: string; name: string | null;
description?: string; enableVexa?: boolean;
participants: Participant[];
};

type PublicRoom = {
id: string; name: string | null; description: string; roomCode: string;
topics: string[]; enableVexa: boolean;
participants: { username: string; avatarUrl: string }[];
createdAt: string;
};

type VexaState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

type DeclineUpdate = { inviteId: string; invitedUsername: string; roomName: string | null; updatedAt: string };

// ── agora helpers ─────────────────────────────────────────────────────────────

function stableUid(userId: string) {
let h = 0;
for (let i = 0; i < userId.length; i++) h = (h << 5) - h + userId.charCodeAt(i), h |= 0;
return Math.abs(h) % 1_000_000_000;
}

async function loadAgora() {
if (typeof window === "undefined") return null;
const mod = await import("agora-rtc-sdk-ng");
return mod.default;
}

// ── style helpers ─────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.018) 45%,rgba(0,0,0,0.055) 100%)",
border: "1px solid rgba(255,255,255,0.11)",
backdropFilter: "blur(40px) saturate(1.5)",
boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07),0 2px 16px rgba(0,0,0,0.35)",
};

const wineBtn: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(120,25,48,.95) 0%,rgba(65,10,24,.92) 55%,rgba(30,4,12,.97) 100%)",
border: "1px solid rgba(150,40,65,.28)",
boxShadow: "inset 0 1.5px 0 rgba(220,80,110,.2),0 4px 16px rgba(0,0,0,.4)",
color: "rgba(255,255,255,.9)",
};

const glassBtn: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,.025) 50%,rgba(0,0,0,.07) 100%)",
border: "1px solid rgba(255,255,255,.12)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.07)",
color: "rgba(255,255,255,.75)",
};

const inputCss: React.CSSProperties = {
width: "100%", padding: "12px 15px", borderRadius: 14,
fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#e8e8e8",
background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
outline: "none", caretColor: "#8a1f38",
};

// ── sub-components ────────────────────────────────────────────────────────────

const TOPIC_OPTIONS = ["Philosophy","Tech","Music","Art","Startups","Chill","Q&A","Design","Gaming","Wellness"];

function ParticipantBubble({
username, avatarUrl, role, isLocal, isSpeaking, isVexa, vexaState,
}: {
username: string; avatarUrl?: string; role?: "owner" | "participant";
isLocal?: boolean; isSpeaking?: boolean; isVexa?: boolean; vexaState?: VexaState;
}) {
const initials = username.slice(0, 2).toUpperCase();
return (
<div className="flex flex-col items-center gap-1.5">
<div
className="relative p-[3px] rounded-full transition-all duration-300"
style={isSpeaking
? { boxShadow: "0 0 0 2px rgba(90,16,32,0.6),0 0 14px rgba(90,16,32,0.25)" }
: { boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }
}
>
<div
className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[15px] font-bold overflow-hidden relative"
style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
>
{isVexa ? (
<div className="w-full h-full flex items-center justify-center"
style={{ background: "linear-gradient(135deg,rgba(213,126,150,0.18),rgba(90,16,32,0.32))" }}>
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(213,126,150,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
<path d="M10 3a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 10 3Z"/>
<path d="M15.5 9v.5a5.5 5.5 0 0 1-11 0V9"/>
<line x1="10" y1="16" x2="10" y2="19"/>
</svg>
</div>
) : avatarUrl ? (
<img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
) : (
<div className="w-full h-full flex items-center justify-center"
style={{ background: "linear-gradient(135deg,rgba(90,16,32,0.25),rgba(20,5,10,0.4))" }}>
{initials}
</div>
)}
</div>
{role === "owner" && (
<span className="absolute -top-[3px] -right-[3px] text-[7px] font-bold uppercase tracking-[0.08em] px-[5px] py-[2px] rounded-[5px]"
style={{ background: "rgba(5,4,4,0.95)", border: "1px solid rgba(138,31,56,0.35)", color: "rgba(213,126,150,0.9)", whiteSpace: "nowrap" }}>
Host
</span>
)}
{isLocal && (
<span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-[0.06em] px-[5px] py-[2px] rounded-[5px]"
style={{ background: "rgba(5,4,4,0.92)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
You
</span>
)}
</div>
<span className="text-[10.5px] font-medium max-w-[64px] truncate text-center" style={{ color: "rgba(255,255,255,0.58)" }}>
{isVexa ? "Vexa" : username}
</span>
{isVexa && vexaState && vexaState !== "idle" && (
<span className="text-[9px]" style={{ color: "rgba(232,232,232,0.32)" }}>{vexaState}</span>
)}
</div>
);
}

// ── create wizard ─────────────────────────────────────────────────────────────

function CreateWizard({ friends, onCreated, onClose }: {
friends: Friend[]; onCreated: (roomId: string) => void; onClose: () => void;
}) {
const [step, setStep]               = useState(1);
const [roomName, setRoomName]       = useState("");
const [description, setDescription] = useState("");
const [coverUrl, setCoverUrl]       = useState("");  // storage key
const [coverPreview, setCoverPreview] = useState("");
const [topics, setTopics]           = useState<Set<string>>(new Set());
const [enableTextChat, setEnableTextChat] = useState(true);
const [enableVexa, setEnableVexa]   = useState(true);
const [isPublic, setIsPublic]       = useState(false);
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [friendQ, setFriendQ]         = useState("");
const [loading, setLoading]         = useState(false);
const [error, setError]             = useState<string | null>(null);
const [uploading, setUploading]     = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const TOTAL = 4;

const filteredFriends = useMemo(() => {
const q = friendQ.toLowerCase();
return q ? friends.filter(f => f.username.toLowerCase().includes(q)) : friends;
}, [friends, friendQ]);

const toggleFriend = (id: string) =>
setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

const toggleTopic = (t: string) =>
setTopics(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

const onCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;
setUploading(true);
try {
const meRes = await fetch("/api/me", { cache: "no-store" });
if (!meRes.ok) throw new Error("Not authenticated");
const { user } = (await meRes.json()) as { user: { id: string } };
const processed = await processImageFile(file, { maxWidth: 1200, quality: 0.82, cropAspect: "none" });
setCoverPreview(makePreviewUrl(processed));
const ext = file.name.split(".").pop() || "jpg";
const key = `private-room-covers/${user.id}/${crypto.randomUUID()}.${ext}`;
const { uploadUrl } = await presignUpload(key, processed.type || "application/octet-stream");
await uploadFileWithPresignedUrl(uploadUrl, processed);
setCoverUrl(key);
} catch { setError("Cover upload failed."); }
finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
};

const submit = async () => {
setLoading(true); setError(null);
try {
const r = await fetch("/api/private-room/create", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
name: roomName.trim() || undefined,
description: description.trim(),
coverUrl,
topics: Array.from(topics),
enableTextChat,
enableVexa,
isPublic,
invitedUserIds: selectedIds,
}),
});
if (!r.ok) throw new Error("Unable to create room");
const data = (await r.json()) as { room?: { id: string } };
if (!data.room?.id) throw new Error("Invalid room response");
onCreated(data.room.id);
onClose();
} catch (err) {
setError(err instanceof Error ? err.message : "Something went wrong");
} finally { setLoading(false); }
};

const stepTitles = ["", "Name & cover", "Description", "Settings", "Invite friends"];
const spring = { duration: 0.38, ease: [0.34, 1.15, 0.64, 1] as const };

const ToggleRow = ({ id, icon, label, desc, value, onChange }: {
id: string; icon: React.ReactNode; label: string; desc: string; value: boolean; onChange: () => void;
}) => (
<div onClick={onChange} className="flex items-center gap-3 px-4 py-[13px] rounded-[14px] cursor-pointer transition-all"
style={{ ...glassCard, borderColor: value ? "rgba(138,31,56,0.22)" : "rgba(255,255,255,0.11)" }}>
<div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all"
style={value
? { background: "rgba(90,16,32,0.2)", border: "1px solid rgba(138,31,56,0.28)", color: "rgba(213,126,150,0.85)" }
: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.3)" }
}>{icon}</div>
<div className="flex-1">
<div style={{ fontSize: 13.5, fontWeight: 500, color: "#e8e8e8" }}>{label}</div>
<div style={{ fontSize: 11.5, color: "rgba(232,232,232,0.38)", marginTop: 2 }}>{desc}</div>
</div>
<div className="px-[9px] py-[3px] rounded-full text-[10px] font-semibold tracking-[0.06em] transition-all"
style={value
? { background: "rgba(90,16,32,0.18)", border: "1px solid rgba(138,31,56,0.3)", color: "rgba(213,126,150,0.9)" }
: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,232,0.5)" }
}>{value ? "On" : "Off"}</div>
</div>
);

return (
<div className="flex flex-col h-full">
{/* header */}
<div className="flex items-center gap-3 px-5 flex-shrink-0" style={{ paddingTop: 52 }}>
<button onClick={onClose} className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all"
style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.55)" }}>
<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 5 10l7 6"/></svg>
</button>
<div>
<div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-.2px" }}>New Room</div>
<div style={{ fontSize: 11, color: "rgba(232,232,232,0.4)", marginTop: 1 }}>Step {step} of {TOTAL} · {stepTitles[step]}</div>
</div>
</div>

  {/* step dots */}
  <div className="flex gap-[5px] px-5 flex-shrink-0" style={{ paddingTop: 14 }}>
    {Array.from({ length: TOTAL }, (_, i) => (
      <div key={i} className="h-[4px] rounded-[2px] transition-all duration-300"
        style={{ width: i + 1 === step ? 24 : 8, background: i + 1 === step ? "rgba(138,31,56,0.85)" : i + 1 < step ? "rgba(138,31,56,0.35)" : "rgba(255,255,255,0.1)" }} />
    ))}
  </div>

  {/* steps */}
  <div className="flex-1 overflow-hidden relative">
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 0.999, x: 0 }} exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 px-5 flex flex-col gap-[14px] overflow-y-auto"
        style={{ paddingTop: 18, paddingBottom: 32, scrollbarWidth: "none" }}>

        {/* ── STEP 1: name + cover ── */}
        {step === 1 && (<>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", marginBottom: 7 }}>Room identity</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-.55px", lineHeight: 1.1, marginBottom: 6 }}>Name &amp; cover</div>
            <div style={{ fontSize: 13, color: "rgba(232,232,232,.42)", lineHeight: 1.6 }}>Give your room a name and a cover image.</div>
          </div>

          {/* cover upload */}
          <div onClick={() => fileInputRef.current?.click()}
            className="relative flex flex-col items-center justify-center gap-2 rounded-[18px] cursor-pointer transition-all overflow-hidden"
            style={{ aspectRatio: "3/2", border: coverPreview ? "1px solid rgba(255,255,255,0.12)" : "1.5px dashed rgba(255,255,255,0.12)", background: coverPreview ? "transparent" : "rgba(255,255,255,0.03)" }}>
            {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover rounded-[17px]" />}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[17px]" style={{ background: "rgba(0,0,0,0.55)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Uploading...</span>
              </div>
            )}
            {!coverPreview && !uploading && (<>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="rgba(232,232,232,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H7L5 7H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3L13 2Z"/><circle cx="10" cy="12" r="3"/>
              </svg>
              <span style={{ fontSize: 12.5, color: "rgba(232,232,232,0.32)", fontWeight: 500 }}>Add cover photo</span>
            </>)}
            {coverPreview && !uploading && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-[17px]"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <span style={{ fontSize: 12, color: "#fff" }}>Change photo</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onCoverChange(e)} />

          <input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. Night Lounge, Studio Talk..." maxLength={40}
            style={{ ...inputCss, borderRadius: 14 }} />
          <div className="flex justify-between items-center" style={{ marginTop: -6 }}>
            <span style={{ fontSize: 11.5, color: "rgba(232,232,232,0.38)" }}>Leave blank for anonymous room</span>
            <span style={{ fontSize: 11, color: "rgba(232,232,232,0.25)" }}>{roomName.length} / 40</span>
          </div>

          <div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(232,232,232,.25)", marginBottom: 9 }}>Quick picks</div>
            <div className="flex flex-wrap gap-[6px]">
              {["🌙 Night Lounge","🎙 Studio","🏡 The Circle","✨ Late Night","🔴 War Room","🎵 Lofi Hour"].map(n => (
                <button key={n} onClick={() => setRoomName(n)} className="px-3 py-1.5 rounded-[9px] text-[13px] transition-all"
                  style={{ background: roomName === n ? "rgba(90,16,32,0.18)" : "rgba(255,255,255,0.04)", border: roomName === n ? "1px solid rgba(138,31,56,0.3)" : "1px solid rgba(255,255,255,0.09)", color: roomName === n ? "rgba(232,232,232,0.9)" : "rgba(232,232,232,0.55)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>)}

        {/* ── STEP 2: description + topics ── */}
        {step === 2 && (<>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", marginBottom: 7 }}>About this room</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-.55px", lineHeight: 1.1, marginBottom: 6 }}>Add a description</div>
            <div style={{ fontSize: 13, color: "rgba(232,232,232,.42)", lineHeight: 1.6 }}>Tell people what this room is about.</div>
          </div>
          <div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={200}
              placeholder="e.g. Open space for late-night philosophy, life, and real talk. Everyone welcome." rows={4}
              style={{ ...inputCss, borderRadius: 14, resize: "none", lineHeight: 1.55, padding: "12px 15px" }} />
            <div className="flex justify-end" style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(232,232,232,0.25)" }}>{description.length} / 200</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(232,232,232,.25)", marginBottom: 9 }}>Topic tags</div>
            <div className="flex flex-wrap gap-[6px]">
              {TOPIC_OPTIONS.map(t => {
                const on = topics.has(t);
                return (
                  <button key={t} onClick={() => toggleTopic(t)} className="px-3 py-1.5 rounded-[9px] text-[13px] transition-all"
                    style={{ background: on ? "rgba(90,16,32,0.18)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(138,31,56,0.3)" : "1px solid rgba(255,255,255,0.09)", color: on ? "rgba(232,232,232,0.9)" : "rgba(232,232,232,0.55)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </>)}

        {/* ── STEP 3: settings ── */}
        {step === 3 && (<>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", marginBottom: 7 }}>Room settings</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-.55px", lineHeight: 1.1, marginBottom: 6 }}>Configure</div>
            <div style={{ fontSize: 13, color: "rgba(232,232,232,.42)", lineHeight: 1.6 }}>Choose features for this session.</div>
          </div>
          <ToggleRow id="chat" label="Text chat" desc="Allow messages alongside audio" value={enableTextChat} onChange={() => setEnableTextChat(p => !p)}
            icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-5 3V5Z"/></svg>} />
          <ToggleRow id="vexa" label="Vexa AI" desc="AI assistant listens and helps" value={enableVexa} onChange={() => setEnableVexa(p => !p)}
            icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 13.5h.01"/></svg>} />
          <ToggleRow id="priv" label="Private room" desc="Only invited friends can join" value={!isPublic} onChange={() => setIsPublic(p => !p)}
            icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="14" height="8" rx="2.5"/><path d="M6.5 9V7a3.5 3.5 0 0 1 7 0v2"/><circle cx="10" cy="13" r="1" fill="currentColor" stroke="none"/></svg>} />
        </>)}

        {/* ── STEP 4: invite ── */}
        {step === 4 && (<>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", marginBottom: 7 }}>Invite friends</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-.55px", lineHeight: 1.1, marginBottom: 6 }}>Who&apos;s joining?</div>
            <div style={{ fontSize: 13, color: "rgba(232,232,232,.42)", lineHeight: 1.6 }}>Select friends - you can invite more later.</div>
          </div>
          <input value={friendQ} onChange={e => setFriendQ(e.target.value)} placeholder="Search friends..." style={{ ...inputCss, borderRadius: 14 }} />
          <div className="flex flex-col gap-[6px]">
            {filteredFriends.map(f => {
              const sel = selectedIds.includes(f.id);
              return (
                <div key={f.id} onClick={() => toggleFriend(f.id)} className="flex items-center gap-[11px] px-[13px] py-[10px] rounded-[13px] cursor-pointer transition-all"
                  style={{ background: sel ? "rgba(90,16,32,0.1)" : "transparent", border: sel ? "1px solid rgba(138,31,56,0.22)" : "1px solid transparent" }}>
                  <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                    {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover rounded-[10px]" /> : f.username[0].toUpperCase()}
                  </div>
                  <span className="flex-1" style={{ fontSize: 13.5, fontWeight: 500, color: "#e8e8e8" }}>@{f.username}</span>
                  <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all"
                    style={sel ? { background: "rgba(120,25,48,.85)", border: "1px solid rgba(150,40,65,.5)" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {sel && <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 4 6-7"/></svg>}
                  </div>
                </div>
              );
            })}
          </div>
          {error && <p style={{ fontSize: 12.5, color: "rgba(252,165,165,.85)", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)" }}>{error}</p>}
          <p style={{ fontSize: 11.5, color: "rgba(232,232,232,0.35)", textAlign: "center" }}>
            {selectedIds.length === 0 ? "Skip to create now, invite later" : `${selectedIds.length} friend${selectedIds.length > 1 ? "s" : ""} selected`}
          </p>
        </>)}

      </motion.div>
    </AnimatePresence>
  </div>

  {/* footer */}
  <div className="flex gap-[9px] px-5 flex-shrink-0" style={{ paddingBottom: 28, paddingTop: 12 }}>
    <button disabled={step === 1} onClick={() => setStep(p => p - 1)}
      className="flex items-center justify-center rounded-[14px] transition-all disabled:opacity-40"
      style={{ ...glassBtn, width: 48, height: 44, cursor: "pointer", flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 5 10l7 6"/></svg>
    </button>
    <button onClick={() => step < TOTAL ? setStep(p => p + 1) : void submit()} disabled={loading || uploading}
      className="flex flex-1 items-center justify-center gap-2 rounded-[14px] h-11 text-[13.5px] font-semibold transition-all disabled:opacity-40"
      style={{ ...wineBtn, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
      {loading ? "Creating..." : step < TOTAL ? (<>Continue <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l7 6-7 6"/></svg></>) : (<><svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l5 5 9-9"/></svg> Create room</>)}
    </button>
  </div>
</div>

);
}

// ── main page ─────────────────────────────────────────────────────────────────

type View = "dashboard" | "create" | "room";

export default function PrivateRoomPage() {
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

const [view,          setView]          = useState<View>("dashboard");
const [loading,       setLoading]       = useState(true);
const [error,         setError]         = useState<string | null>(null);
const [friends,       setFriends]       = useState<Friend[]>([]);
const [invites,       setInvites]       = useState<Invite[]>([]);
const [publicRooms,   setPublicRooms]   = useState<PublicRoom[]>([]);
const [room,          setRoom]          = useState<RoomDetails | null>(null);
const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
const [localUserId,   setLocalUserId]   = useState<string | null>(null);
const [joinedAudio,   setJoinedAudio]   = useState(false);
const [joiningAudio,  setJoiningAudio]  = useState(false);
const [micMuted,      setMicMuted]      = useState(false);
const [speakingUids,  setSpeakingUids]  = useState<number[]>([]);
const [vexaOpen,      setVexaOpen]      = useState(false);
const [vexaState,     setVexaState]     = useState<VexaState>("idle");
const [chatOpen,      setChatOpen]      = useState(false);
const [chatMessages,  setChatMessages]  = useState<{ mine: boolean; text: string; time: string }[]>([
{ mine: false, text: "Hey! Can everyone hear me?", time: "22:14" },
{ mine: true,  text: "Yes, loud and clear 🎙",    time: "22:15" },
{ mine: false, text: "Great, let's start ✨",      time: "22:15" },
]);
const [chatInput,     setChatInput]     = useState("");
const [inviteLoading, setInviteLoading] = useState(false);
const [declineToast,  setDeclineToast]  = useState<DeclineUpdate | null>(null);
const [leaveConfirm,  setLeaveConfirm]  = useState(false);
const [minimized,     setMinimized]     = useState(false);

const clientRef          = useRef<IAgoraRTCClient | null>(null);
const localTrackRef      = useRef<LocalAudioTrack | null>(null);
const declineSinceRef    = useRef(new Date(Date.now() - 120_000).toISOString());
const seenDeclinesRef    = useRef(new Set<string>());
const chatEndRef         = useRef<HTMLDivElement>(null);

// ── agora ─────────────────────────────────────────────────────────────────

const closeLocalTracks = useCallback(() => {
localTrackRef.current?.close(); localTrackRef.current = null;
}, []);

const leaveAgora = useCallback(async () => {
if (clientRef.current) await clientRef.current.leave();
closeLocalTracks();
setJoinedAudio(false); setMicMuted(false); setSpeakingUids([]);
}, [closeLocalTracks]);

const ensureClient = useCallback(async () => {
const AgoraRTC = await loadAgora();
if (!AgoraRTC) throw new Error("Agora SDK unavailable");
if (clientRef.current) return { AgoraRTC, client: clientRef.current };
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
client.on("user-published", async (user, mediaType) => {
await client.subscribe(user, mediaType);
if (mediaType === "audio") user.audioTrack?.play();
});
client.on("volume-indicator", volumes => {
setSpeakingUids(volumes.filter(v => v.level > 6).map(v => Number(v.uid)).filter(Number.isFinite));
});
client.enableAudioVolumeIndicator();
clientRef.current = client;
return { AgoraRTC, client };
}, []);

// ── data loading ──────────────────────────────────────────────────────────

const fetchRoom = useCallback(async (id: string) => {
const r = await fetch(`/api/private-room/${id}`);
if (!r.ok) return;
const d = (await r.json()) as { room?: RoomDetails };
if (d.room) setRoom(d.room);
}, []);

const loadDashboard = useCallback(async () => {
try {
const [fRes, iRes, aRes, meRes, pubRes] = await Promise.all([
fetch("/api/friends/list"),
fetch("/api/private-room/invites"),
fetch("/api/private-room/active"),
fetch("/api/me"),
fetch("/api/private-room/public").catch(() => null), // optional endpoint
]);
if (fRes.ok) setFriends(((await fRes.json()) as { friends: Friend[] }).friends ?? []);
if (iRes.ok) setInvites(((await iRes.json()) as { invites: Invite[] }).invites ?? []);
if (meRes.ok) { const d = (await meRes.json()) as { user?: { id?: string } }; setLocalUserId(d.user?.id ?? null); }
if (aRes.ok) {
const d = (await aRes.json()) as { room: { id: string } | null };
if (d.room?.id) { setCurrentRoomId(d.room.id); await fetchRoom(d.room.id); setView("room"); }
}
if (pubRes?.ok) {
const d = (await pubRes.json()) as { rooms?: PublicRoom[] };
setPublicRooms(d.rooms ?? []);
}
} catch { /* silent */ }
setLoading(false);
}, [fetchRoom]);

useEffect(() => { void loadDashboard(); }, [loadDashboard]);
useEffect(() => { const t = setInterval(() => void loadDashboard(), 6500); return () => clearInterval(t); }, [loadDashboard]);
useEffect(() => { if (!currentRoomId) return; const t = setInterval(() => void fetchRoom(currentRoomId), 5000); return () => clearInterval(t); }, [currentRoomId, fetchRoom]);
useEffect(() => { return () => { void leaveAgora(); }; }, [leaveAgora]);

// decline poll
useEffect(() => {
const t = setInterval(async () => {
try {
const r = await fetch(`/api/private-room/invites/sent/updates?since=${encodeURIComponent(declineSinceRef.current)}`);
if (!r.ok) return;
const d = (await r.json()) as { updates?: DeclineUpdate[] };
const updates = d.updates ?? [];
if (!updates.length) return;
const last = updates[updates.length - 1];
declineSinceRef.current = last.updatedAt;
const fresh = updates.find(u => !seenDeclinesRef.current.has(u.inviteId));
if (fresh) { seenDeclinesRef.current.add(fresh.inviteId); setDeclineToast(fresh); setTimeout(() => setDeclineToast(null), 2800); }
} catch { /* silent */ }
}, 5000);
return () => clearInterval(t);
}, []);

// ── room actions ──────────────────────────────────────────────────────────

const joinRoom = useCallback(async (roomId: string) => {
const r = await fetch(`/api/private-room/${roomId}/join`, { method: "POST" });
if (!r.ok) return;
setCurrentRoomId(roomId);
await fetchRoom(roomId);
setView("room");
}, [fetchRoom]);

const respondToInvite = async (invite: Invite, action: "accept" | "reject") => {
if (inviteLoading) return;
setInviteLoading(true);
try {
const r = await fetch(`/api/private-room/invites/${invite.id}/respond`, {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({ action }),
});
if (!r.ok) return;
setInvites(prev => prev.filter(i => i.id !== invite.id));
if (action === "accept") await joinRoom(invite.roomId);
} finally { setInviteLoading(false); }
};

const joinAudio = async () => {
if (!room || !appId || joiningAudio || joinedAudio || !localUserId) return;
setJoiningAudio(true);
try {
const { AgoraRTC, client } = await ensureClient();
const uid = stableUid(localUserId);
const tokenRes = await fetch(`/api/agora/token?channel=${encodeURIComponent(room.channelName)}&uid=${uid}`);
if (!tokenRes.ok) throw new Error("Token fetch failed");
const { token } = (await tokenRes.json()) as { token?: string };
if (!token) throw new Error("Invalid token");
await client.join(appId, room.channelName, token, uid);
const track = await AgoraRTC.createMicrophoneAudioTrack();
localTrackRef.current = track;
await client.publish([track]);
setJoinedAudio(true);
} catch (e) { await leaveAgora(); setError(e instanceof Error ? e.message : "Audio join failed"); }
finally { setJoiningAudio(false); }
};

const leaveRoom = async () => {
if (!currentRoomId) return;
await fetch(`/api/private-room/${currentRoomId}/leave`, { method: "POST" });
await leaveAgora();
setCurrentRoomId(null); setRoom(null); setVexaState("idle");
setLeaveConfirm(false); setMinimized(false); setView("dashboard");
await loadDashboard();
};

const toggleMic = async () => {
if (!localTrackRef.current) return;
const next = !micMuted;
await localTrackRef.current.setEnabled(!next);
setMicMuted(next);
};

const speakingIds = useMemo(() => {
if (!room) return new Set<string>();
const active = new Set(speakingUids);
return new Set(room.participants.filter(p => active.has(stableUid(p.userId))).map(p => p.id));
}, [room, speakingUids]);

// ── chat ──────────────────────────────────────────────────────────────────

const sendChat = () => {
if (!chatInput.trim()) return;
const now = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
setChatMessages(prev => [...prev, { mine: true, text: chatInput.trim(), time: now }]);
setChatInput("");
setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
};

// ── shared styles ─────────────────────────────────────────────────────────

const screenBase: React.CSSProperties = {
background: "#050404", minHeight: "100svh", width: "100%", maxWidth: 430,
margin: "0 auto", display: "flex", flexDirection: "column",
fontFamily: "'DM Sans', sans-serif", color: "#e8e8e8", overflow: "hidden",
position: "relative",
};

// ══════════════════════════════════════════════════════════════════════════
// RENDER: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════

if (view === "dashboard") return (
<main style={screenBase}>
{/* background: subtle grid */}
<div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
<div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 80%)" }} />
<div style={{ position: "absolute", left: "-18%", top: "-5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(90,16,32,0.26) 0%,rgba(90,16,32,0.06) 55%,transparent 80%)", filter: "blur(40px)" }} />
<div style={{ position: "absolute", right: "-20%", top: "35%", width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)", filter: "blur(80px)" }} />
</div>
<div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "linear-gradient(90deg,transparent 0%,rgba(138,31,56,0.5) 40%,rgba(138,31,56,0.5) 60%,transparent 100%)", zIndex: 6 }} />

  <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none", paddingBottom: 36, position: "relative", zIndex: 5 }}>

    {/* header */}
    <div style={{ padding: "52px 20px 0" }}>
      <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", display: "block", marginBottom: 8 }}>Private audio</span>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>Rooms</h1>
    </div>

    {loading && <p style={{ padding: "20px 20px 0", fontSize: 13, color: "rgba(232,232,232,.4)" }}>Loading...</p>}
    {error && <p style={{ padding: "12px 20px 0", fontSize: 13, color: "rgba(252,165,165,.8)" }}>{error}</p>}

    {/* create card */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 }}
      onClick={() => setView("create")}
      style={{ margin: "20px 20px 0", borderRadius: 22, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(90,16,32,0.28) 0%,rgba(40,8,16,0.22) 50%,rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(138,31,56,0.22)", borderRadius: 22, padding: "22px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(255,255,255,0.05) 0%,transparent 50%)", pointerEvents: "none" }} />
        <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(213,126,150,0.6)", display: "block", marginBottom: 9 }}>Start a session</span>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: "-.45px", lineHeight: 1.2, marginBottom: 16 }}>Create a private<br />audio room</h2>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={e => { e.stopPropagation(); setView("create"); }}
            className="flex items-center justify-center gap-2 rounded-[14px] h-11 px-5 text-[13.5px] font-semibold transition-all"
            style={{ ...wineBtn, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="2" x2="10" y2="18"/><line x1="2" y1="10" x2="18" y2="10"/></svg>
            Create room
          </button>
          <button onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-2 rounded-[14px] h-11 px-4 text-[13px] font-semibold transition-all"
            style={{ ...glassBtn, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="16" height="16" rx="3"/><path d="M7 10h6M10 7v6"/></svg>
            Join by code
          </button>
        </div>
      </div>
    </motion.div>

    {/* invites */}
    <div style={{ margin: "24px 20px 0" }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(232,232,232,.25)", marginBottom: 11 }}>Incoming invites</div>
      {invites.length === 0 && <p style={{ fontSize: 13, color: "rgba(232,232,232,.3)" }}>No pending invites.</p>}
      <AnimatePresence>
        {invites.map((inv, i) => (
          <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12, scale: 0.96 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="flex items-center gap-[11px] px-[14px] py-[12px] rounded-[16px] mb-[7px]"
            style={{ ...glassCard, cursor: "default" }}>
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[15px] font-semibold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(90,16,32,0.28),rgba(20,5,10,0.4))", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
              {inv.ownerUsername[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e8e8e8", letterSpacing: "-.1px" }}>{inv.roomName || "Private Space"}</div>
              <div style={{ fontSize: 11.5, color: "rgba(232,232,232,.38)", marginTop: 1.5 }}>@{inv.ownerUsername} invited you</div>
            </div>
            <div className="flex gap-[6px] flex-shrink-0">
              <button disabled={inviteLoading} onClick={() => void respondToInvite(inv, "accept")}
                style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "linear-gradient(160deg,rgba(120,25,48,.9),rgba(65,10,24,.88))", border: "1px solid rgba(150,40,65,.25)", color: "rgba(255,255,255,.9)", transition: "all .18s" }}>
                Join
              </button>
              <button disabled={inviteLoading} onClick={() => void respondToInvite(inv, "reject")}
                style={{ height: 32, width: 32, borderRadius: 9, fontSize: 12, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,.09)", color: "rgba(232,232,232,.38)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s" }}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m2 2 12 12M14 2 2 14"/></svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>

    {/* public rooms */}
    <div style={{ margin: "28px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(232,232,232,.25)" }}>Live rooms</div>
        <span style={{ fontSize: 11, color: "rgba(61,230,150,0.65)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3de696", animation: "blink 2s ease-in-out infinite" }} />
          {publicRooms.length || 5} live now
        </span>
      </div>
      {/* demo public rooms (replace with publicRooms.map when API is ready) */}
      {[
        { emoji: "🌙", name: "Late Night Talks", desc: "Philosophy, life choices & late-night thoughts. Open space for real talk.", host: "@elena_k", count: 8, tags: ["Vexa AI","Public","🔥 Trending"], bg: "linear-gradient(135deg,rgba(90,16,32,0.55),rgba(30,4,10,0.75))", avs: ["E","N","Y","+5"], topic: "Philosophy", since: "22:30" },
        { emoji: "🎙", name: "Design & Code", desc: "Deep dive into product design, frontend craft, and the future of human interfaces.", host: "@noah_pls", count: 5, tags: ["Public","UI/UX"], bg: "linear-gradient(135deg,rgba(20,30,80,0.6),rgba(5,10,35,0.8))", avs: ["N","A","+3"], topic: "Tech", since: "21:00" },
        { emoji: "🎵", name: "Lofi & Vibes", desc: "Chilling, studying, and being present together. No pressure, just good vibes.", host: "@yuki.t", count: 12, tags: ["Vexa AI","Public","🔥 Popular"], bg: "linear-gradient(135deg,rgba(20,60,40,0.55),rgba(5,20,12,0.8))", avs: ["Y","S","+10"], topic: "Music", since: "20:00" },
      ].map((r, i) => (
        <motion.div key={r.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 + i * 0.06 }}
          onClick={() => void joinRoom("demo")}
          style={{ borderRadius: 18, marginBottom: 10, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,0.11)", transition: "transform .2s" }}
          whileHover={{ y: -1 }}>
          {/* cover */}
          <div style={{ height: 70, background: r.bg, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.5) 100%)" }} />
            <span style={{ fontSize: 26, position: "relative", zIndex: 2 }}>{r.emoji}</span>
            <div style={{ position: "absolute", bottom: 8, left: 14, display: "flex", zIndex: 3 }}>
              {r.avs.map((a, j) => (
                <div key={j} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid #050404", marginLeft: j > 0 ? -6 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>{a}</div>
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 8, right: 14, zIndex: 3, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3de696", animation: "blink 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(61,230,150,0.8)", fontWeight: 600 }}>{r.count} live</span>
            </div>
          </div>
          {/* body */}
          <div style={{ padding: "12px 14px 13px", background: "linear-gradient(160deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.016) 45%,rgba(0,0,0,0.055) 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-.25px" }}>{r.name}</div>
              <button onClick={e => { e.stopPropagation(); void joinRoom("demo"); }}
                style={{ height: 28, padding: "0 11px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "linear-gradient(160deg,rgba(120,25,48,.9),rgba(65,10,24,.88))", border: "1px solid rgba(150,40,65,.25)", color: "rgba(255,255,255,.9)" }}>
                Join
              </button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
              {r.tags.map(t => (
                <span key={t} style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                  background: t === "Vexa AI" ? "rgba(213,126,150,0.12)" : t.includes("🔥") ? "rgba(239,120,40,0.1)" : "rgba(255,255,255,0.06)",
                  border: t === "Vexa AI" ? "1px solid rgba(213,126,150,0.25)" : t.includes("🔥") ? "1px solid rgba(239,120,40,0.22)" : "1px solid rgba(255,255,255,0.1)",
                  color: t === "Vexa AI" ? "rgba(213,126,150,0.85)" : t.includes("🔥") ? "rgba(251,170,100,0.85)" : "rgba(232,232,232,0.45)" }}>
                  {t === "Vexa AI" && <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ marginRight: 3, display: "inline" }}><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11.5h.01"/></svg>}
                  {t}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(232,232,232,.4)", lineHeight: 1.45, marginBottom: 8 }}>{r.desc}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(232,232,232,.3)" }}>{r.host}</span>
              <span style={{ fontSize: 10, color: "rgba(232,232,232,.25)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px" }}>since {r.since}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

  </div>

  {/* decline toast */}
  <AnimatePresence>
    {declineToast && (
      <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
        style={{ position: "fixed", top: "max(8px,env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 28px)", maxWidth: 406, zIndex: 65, borderRadius: 16, padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,.8)", ...glassCard }}>
        @{declineToast.invitedUsername} declined your room invite
      </motion.div>
    )}
  </AnimatePresence>

  <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
</main>

);

// ══════════════════════════════════════════════════════════════════════════
// RENDER: CREATE WIZARD
// ══════════════════════════════════════════════════════════════════════════

if (view === "create") return (
<main style={{ ...screenBase, minHeight: "100svh" }}>
<div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
<div style={{ position: "absolute", left: "-20%", top: "0%", width: 240, height: 240, borderRadius: "50%", background: "rgba(90,16,32,0.1)", filter: "blur(80px)" }} />
</div>
<div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
<CreateWizard
friends={friends}
onCreated={async (roomId) => { setCurrentRoomId(roomId); await fetchRoom(roomId); setView("room"); }}
onClose={() => setView("dashboard")}
/>
</div>
</main>
);

// ══════════════════════════════════════════════════════════════════════════
// RENDER: LIVE ROOM
// ══════════════════════════════════════════════════════════════════════════

const CtrlBtn = ({ label, onClick, active, danger, muted, children }: {
label: string; onClick: () => void; active?: boolean; danger?: boolean; muted?: boolean; children: React.ReactNode;
}) => (
<button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none", flex: 1, fontFamily: "'DM Sans', sans-serif", transition: "all .18s" }}>
<div style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s",
background: active ? "rgba(61,230,150,0.1)" : danger ? "rgba(239,68,68,0.08)" : muted ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
border: active ? "1px solid rgba(61,230,150,0.25)" : danger ? "1px solid rgba(239,68,68,0.18)" : muted ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(255,255,255,0.08)",
color: active ? "#3de696" : danger ? "rgba(252,165,165,0.75)" : muted ? "rgba(252,165,165,0.8)" : "rgba(232,232,232,0.55)" }}>
{children}
</div>
<span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".02em", color: active ? "rgba(61,230,150,0.8)" : danger ? "rgba(252,165,165,0.65)" : muted ? "rgba(252,165,165,0.7)" : "rgba(232,232,232,0.5)" }}>{label}</span>
</button>
);

return (
<motion.main style={{ ...screenBase, minHeight: "100svh" }}
animate={minimized ? { y: "100%" } : { y: 0 }}
transition={{ type: "spring", stiffness: 260, damping: 30 }}>

  {/* blobs */}
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
    <div style={{ position: "absolute", left: "-15%", top: "20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(90,16,32,0.14)", filter: "blur(90px)" }} />
    <div style={{ position: "absolute", right: "-15%", bottom: "25%", width: 180, height: 180, borderRadius: "50%", background: "rgba(61,230,150,0.03)", filter: "blur(100px)" }} />
  </div>

  {/* header */}
  <div style={{ padding: "52px 20px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, position: "relative", zIndex: 5 }}>
    <button onClick={() => setView("dashboard")} style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.55)", cursor: "pointer", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 5 10l7 6"/></svg>
    </button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,232,232,.28)", marginBottom: 4 }}>Live · private audio</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-.4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {room?.name || "Private Space"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3de696", flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: "rgba(232,232,232,.5)" }}>#{room?.roomCode} · {room?.participants.length ?? 0} joined</span>
      </div>
    </div>
    <button onClick={() => setView("dashboard")} style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,.75)", flexShrink: 0 }}>
      Invite
    </button>
    <button onClick={() => setMinimized(true)} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(232,232,232,.4)", cursor: "pointer", flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12"/></svg>
    </button>
  </div>

  {/* participant grid - fills remaining space */}
  <div style={{ margin: "12px 16px 0", flex: 1, display: "flex", flexDirection: "column", borderRadius: 22, overflow: "hidden", position: "relative", zIndex: 5, ...glassCard }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "16px 16px 0", flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(232,232,232,.28)" }}>In this room</span>
      <button onClick={() => setVexaOpen(v => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: ".04em", background: "rgba(213,126,150,0.1)", border: "1px solid rgba(213,126,150,0.22)", color: "rgba(213,126,150,.8)", cursor: "pointer" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(213,126,150,.9)", animation: vexaState !== "idle" ? "blink 1.4s ease-in-out infinite" : "none" }} />
        Vexa · {vexaState === "idle" ? "standby" : vexaState}
      </button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px 8px", flex: 1, alignContent: "start", padding: "0 12px 16px" }}>
      {/* Vexa bubble */}
      {(room?.enableVexa !== false) && (
        <ParticipantBubble username="Vexa" isVexa vexaState={vexaState} isSpeaking={vexaState === "speaking" || vexaState === "listening"} />
      )}
      {(room?.participants ?? []).map(p => (
        <ParticipantBubble key={p.id} username={p.username} avatarUrl={p.avatarUrl} role={p.role} isLocal={p.userId === localUserId} isSpeaking={speakingIds.has(p.id)} />
      ))}
    </div>
  </div>

  {/* audio status */}
  <div style={{ margin: "8px 16px 0", padding: "9px 14px", borderRadius: 13, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative", zIndex: 5, ...glassCard }}>
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke={joinedAudio ? "rgba(61,230,150,0.65)" : "rgba(232,232,232,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 10 3Z"/>
      <path d="M15.5 9v.5a5.5 5.5 0 0 1-11 0V9"/>
    </svg>
    <span style={{ fontSize: 12, color: "rgba(232,232,232,.45)" }}>
      {joinedAudio ? (micMuted ? "Audio connected · mic muted" : "Audio connected · mic live") : "Tap Join Audio to talk live"}
    </span>
  </div>

  {/* controls */}
  <div style={{ margin: "8px 16px 16px", borderRadius: 20, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-around", flexShrink: 0, position: "relative", zIndex: 5, ...glassCard }}>
    {!joinedAudio ? (
      <CtrlBtn label={joiningAudio ? "Joining..." : "Join Audio"} onClick={() => void joinAudio()} active>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 10 3Z"/><path d="M15.5 9v.5a5.5 5.5 0 0 1-11 0V9"/><line x1="10" y1="16" x2="10" y2="19"/></svg>
      </CtrlBtn>
    ) : (
      <CtrlBtn label={micMuted ? "Muted" : "Mic"} onClick={() => void toggleMic()} active={!micMuted} muted={micMuted}>
        {micMuted
          ? <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l16 16"/><path d="M10 3a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 2.5 2.5"/><path d="M12.5 7.5v2a2.5 2.5 0 0 1-2.5 2.5"/><path d="M15.5 9.5a5.5 5.5 0 0 1-9.8 3.4"/><line x1="10" y1="16" x2="10" y2="19"/></svg>
          : <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 10 3Z"/><path d="M15.5 9v.5a5.5 5.5 0 0 1-11 0V9"/><line x1="10" y1="16" x2="10" y2="19"/></svg>
        }
      </CtrlBtn>
    )}

    <CtrlBtn label="Chat" onClick={() => setChatOpen(o => !o)} active={chatOpen}>
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-5 3V5Z"/></svg>
    </CtrlBtn>

    <CtrlBtn label="Vexa" onClick={() => setVexaOpen(o => !o)}>
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="rgba(213,126,150,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 13.5h.01"/></svg>
    </CtrlBtn>

    <CtrlBtn label="Leave" onClick={() => setLeaveConfirm(true)} danger>
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M13 14l4-4-4-4M17 10H8"/></svg>
    </CtrlBtn>
  </div>

  {/* chat panel */}
  <AnimatePresence>
    {chatOpen && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 50, background: "rgba(5,4,4,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px 24px 0 0", backdropFilter: "blur(30px) saturate(1.4)", boxShadow: "0 -12px 40px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", height: "62%" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "10px auto 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,232,232,.65)" }}>Room chat</span>
          <button onClick={() => setChatOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(232,232,232,.4)", cursor: "pointer" }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m2 2 12 12M14 2 2 14"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none" }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: m.mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 16, fontSize: 13, lineHeight: 1.45,
                background: m.mine ? "linear-gradient(160deg,rgba(120,25,48,.55),rgba(65,10,24,.5))" : "linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.018))",
                border: m.mine ? "1px solid rgba(150,40,65,.2)" : "1px solid rgba(255,255,255,.09)",
                color: m.mine ? "rgba(255,255,255,.88)" : "rgba(232,232,232,.82)",
                borderBottomRightRadius: m.mine ? 4 : 16, borderBottomLeftRadius: m.mine ? 16 : 4 }}>
                {m.text}
              </div>
              <span style={{ fontSize: 10, color: "rgba(232,232,232,.25)", padding: "0 3px" }}>{m.time}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Message the room..."
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "9px 13px", fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: "rgba(232,232,232,.85)", outline: "none", caretColor: "#8a1f38" }} />
          <button onClick={sendChat} style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,rgba(120,25,48,.9),rgba(65,10,24,.88))", border: "1px solid rgba(150,40,65,.28)", color: "rgba(255,255,255,.9)", cursor: "pointer", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="2" x2="9" y2="11"/><polygon points="18 2 11 18 9 11 2 9 18 2"/></svg>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* leave confirm */}
  <AnimatePresence>
    {leaveConfirm && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setLeaveConfirm(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }} />
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 301, background: "linear-gradient(180deg,rgba(14,6,8,.98),rgba(6,2,3,.99))", borderTop: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px 24px 0 0", padding: "6px 20px 32px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "10px auto 20px" }} />
          <div style={{ width: 50, height: 50, borderRadius: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "rgba(252,165,165,0.75)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M13 14l4-4-4-4M17 10H8"/></svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-.3px", textAlign: "center", marginBottom: 5 }}>Leave the room?</h3>
          <p style={{ fontSize: 13, color: "rgba(232,232,232,.42)", textAlign: "center", lineHeight: 1.5, marginBottom: 22 }}>You&apos;ll be disconnected from the audio. Others will stay in the room.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <button onClick={() => void leaveRoom()}
              style={{ height: 48, borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "rgba(252,165,165,.9)" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M13 14l4-4-4-4M17 10H8"/></svg>
              Yes, leave room
            </button>
            <button onClick={() => setLeaveConfirm(false)}
              style={{ height: 48, borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.018))", border: "1px solid rgba(255,255,255,.1)", color: "rgba(232,232,232,.72)" }}>
              Stay in room
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>

  <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
</motion.main>

);
}
