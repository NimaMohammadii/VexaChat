"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
deleteStoredObject,
presignRead,
presignUpload,
uploadFileWithPresignedUrl,
} from "@/lib/client/storage";
import { previewUrl, processImageFile } from "@/lib/image-processing";
import { createSupabaseClient } from "@/lib/supabase-client";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

// ── types ─────────────────────────────────────────────────────────────────────

type MeData = {
user: { id: string; email: string; name: string; avatarUrl: string };
profile: {
name: string; username: string; bio: string; avatarKey: string; avatarUrl: string;
country?: string; city?: string;
identityVerified?: boolean; identityStatus?: string;
createdAt?: string;
} | null;
};

// ── countries list ────────────────────────────────────────────────────────────

const COUNTRIES: [string, string][] = [
["🇦🇫","Afghanistan"],["🇦🇱","Albania"],["🇩🇿","Algeria"],["🇦🇷","Argentina"],
["🇦🇲","Armenia"],["🇦🇺","Australia"],["🇦🇹","Austria"],["🇦🇿","Azerbaijan"],
["🇧🇭","Bahrain"],["🇧🇩","Bangladesh"],["🇧🇾","Belarus"],["🇧🇪","Belgium"],
["🇧🇷","Brazil"],["🇧🇬","Bulgaria"],["🇨🇦","Canada"],["🇨🇱","Chile"],
["🇨🇳","China"],["🇨🇴","Colombia"],["🇭🇷","Croatia"],["🇨🇿","Czech Republic"],
["🇩🇰","Denmark"],["🇪🇬","Egypt"],["🇪🇪","Estonia"],["🇪🇹","Ethiopia"],
["🇫🇮","Finland"],["🇫🇷","France"],["🇬🇪","Georgia"],["🇩🇪","Germany"],
["🇬🇭","Ghana"],["🇬🇷","Greece"],["🇭🇺","Hungary"],["🇮🇳","India"],
["🇮🇩","Indonesia"],["🇮🇷","Iran"],["🇮🇶","Iraq"],["🇮🇪","Ireland"],
["🇮🇱","Israel"],["🇮🇹","Italy"],["🇯🇵","Japan"],["🇯🇴","Jordan"],
["🇰🇿","Kazakhstan"],["🇰🇪","Kenya"],["🇰🇼","Kuwait"],["🇱🇻","Latvia"],
["🇱🇧","Lebanon"],["🇱🇹","Lithuania"],["🇲🇾","Malaysia"],["🇲🇽","Mexico"],
["🇲🇦","Morocco"],["🇳🇱","Netherlands"],["🇳🇿","New Zealand"],["🇳🇬","Nigeria"],
["🇳🇴","Norway"],["🇴🇲","Oman"],["🇵🇰","Pakistan"],["🇵🇭","Philippines"],
["🇵🇱","Poland"],["🇵🇹","Portugal"],["🇶🇦","Qatar"],["🇷🇴","Romania"],
["🇷🇺","Russia"],["🇸🇦","Saudi Arabia"],["🇷🇸","Serbia"],["🇸🇬","Singapore"],
["🇸🇰","Slovakia"],["🇿🇦","South Africa"],["🇰🇷","South Korea"],["🇪🇸","Spain"],
["🇸🇪","Sweden"],["🇨🇭","Switzerland"],["🇸🇾","Syria"],["🇹🇼","Taiwan"],
["🇹🇿","Tanzania"],["🇹🇭","Thailand"],["🇹🇳","Tunisia"],["🇹🇷","Türkiye"],
["🇺🇦","Ukraine"],["🇦🇪","UAE"],["🇬🇧","United Kingdom"],["🇺🇸","United States"],
["🇺🇿","Uzbekistan"],["🇻🇳","Vietnam"],["🇾🇪","Yemen"],["🇿🇲","Zambia"],["🇿🇼","Zimbabwe"],
];

const countryByName = Object.fromEntries(COUNTRIES.map(([f, n]) => [n, f]));

// ── helpers ───────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extensionFromFile(file: File) {
return file.name.split(".").pop()?.toLowerCase() ?? file.type.split("/").pop()?.toLowerCase() ?? "png";
}

function formatJoined(iso?: string) {
if (!iso) return null;
return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── inline style constants ────────────────────────────────────────────────────

const glassField: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.018) 45%,rgba(0,0,0,0.06) 100%)",
border: "1px solid rgba(255,255,255,0.1)",
backdropFilter: "blur(30px) saturate(1.4)",
boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
};

const wineBtn: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)",
border: "1px solid rgba(150,40,65,0.28)",
borderBottom: "1px solid rgba(0,0,0,0.4)",
boxShadow: "inset 0 1.5px 0 rgba(220,80,110,0.2),0 4px 16px rgba(0,0,0,0.4)",
color: "rgba(255,255,255,0.9)",
};

const inputCss: React.CSSProperties = {
flex: 1, background: "none", border: "none", outline: "none",
fontFamily: "'DM Sans', sans-serif", fontSize: 14,
color: "#e8e8e8", caretColor: "#8a1f38", minWidth: 0,
};

// ── sub-components ────────────────────────────────────────────────────────────

function FieldRow({ icon, label, children, onClick }: {
icon: React.ReactNode; label: string; children: React.ReactNode; onClick?: () => void;
}) {
return (
<div
onClick={onClick}
className={`flex items-center gap-3 px-4 ${onClick ? "cursor-pointer" : ""}`}
style={{ minHeight: 52, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
>
<span style={{ color: "rgba(232,232,232,0.3)", flexShrink: 0 }}>{icon}</span>
<span style={{ fontSize: 11, fontWeight: 500, color: "rgba(232,232,232,0.38)", minWidth: 80, flexShrink: 0 }}>
{label}
</span>
{children}
</div>
);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
return (
<p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(232,232,232,0.28)", marginBottom: 10, marginTop: 6 }}>
{children}
</p>
);
}

function Sep({ style }: { style?: React.CSSProperties }) {
return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0", ...style }} />;
}

// ── country picker ────────────────────────────────────────────────────────────

function CountryPicker({ current, onSelect, onClose }: {
current: string; onSelect: (flag: string, name: string) => void; onClose: () => void;
}) {
const [q, setQ] = useState("");
const filtered = q ? COUNTRIES.filter(([, n]) => n.toLowerCase().includes(q.toLowerCase())) : COUNTRIES;

return (
<>
{/* overlay */}
<div
onClick={onClose}
className="fixed inset-0 z-50"
style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
/>
{/* sheet */}
<div
className="fixed bottom-0 left-1/2 z-50 w-full pb-8"
style={{
maxWidth: 430, transform: "translateX(-50%)",
background: "#0d0d0d", borderTop: "1px solid rgba(255,255,255,0.1)",
borderRadius: "24px 24px 0 0",
animation: "slideUp 0.32s cubic-bezier(0.34,1.15,0.64,1)",
}}
>
<style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}`}</style>
<div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "10px auto 14px" }} />
<p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(232,232,232,0.35)", marginBottom: 14 }}>
Select country
</p>
<input
autoFocus
value={q}
onChange={(e) => setQ(e.target.value)}
placeholder="Search countries…"
style={{
display: "block", width: "calc(100% - 32px)", margin: "0 16px 12px",
padding: "11px 14px", borderRadius: 12,
background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
outline: "none", caretColor: "#8a1f38",
}}
/>
<div style={{ maxHeight: 280, overflowY: "auto", padding: "0 8px" }}>
{filtered.map(([flag, name]) => (
<div
key={name}
onClick={() => { onSelect(flag, name); onClose(); }}
className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
style={{
cursor: "pointer", fontSize: 14,
color: name === current ? "#e8e8e8" : "rgba(232,232,232,0.55)",
background: name === current ? "rgba(255,255,255,0.07)" : "transparent",
}}
onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
onMouseLeave={(e) => (e.currentTarget.style.background = name === current ? "rgba(255,255,255,0.07)" : "transparent")}
>
<span style={{ fontSize: 20 }}>{flag}</span>
<span>{name}</span>
</div>
))}
</div>
</div>
</>
);
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function MePage() {
const router = useRouter();

// ── data
const [data,    setData]   = useState<MeData | null>(null);
const [loading, setLoading] = useState(true);

// ── form fields
const [name,     setName]     = useState("");
const [username, setUsername] = useState("");
const [bio,      setBio]      = useState("");
const [country,  setCountry]  = useState("");
const [city,     setCity]     = useState("");

// ── avatar
const [avatarKey,      setAvatarKey]      = useState("");
const [avatarDisplay,  setAvatarDisplay]  = useState("");
const [avatarPreview,  setAvatarPreview]  = useState("");
const [uploadingAvatar, setUploadingAvatar] = useState(false);
const deviceInputRef = useRef<HTMLInputElement>(null);

// ── UI state
const [saving,       setSaving]       = useState(false);
const [toast,        setToast]        = useState<string | null>(null);
const [countryOpen,  setCountryOpen]  = useState(false);

// ── load
useEffect(() => {
void (async () => {
const r = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
if (!r || r.status === 401) { router.push("/"); return; }
if (!r.ok) { setLoading(false); return; }
const payload = (await r.json()) as MeData;
setData(payload);

  const p = payload.profile;
  setName(p?.name ?? payload.user.name ?? "");
  setUsername(p?.username ?? "");
  setBio(p?.bio ?? "");
  setCountry(p?.country ?? "");
  setCity(p?.city ?? "");
  setAvatarKey(p?.avatarKey ?? "");

  if (p?.avatarUrl) {
    setAvatarDisplay(p.avatarUrl);
  } else if (payload.user.avatarUrl) {
    setAvatarDisplay(payload.user.avatarUrl);
  }

  setLoading(false);
})();

}, [router]);

// ── avatar upload (same logic as MeProfileForm)
const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file || !data) return;
if (!file.type.startsWith("image/")) { showToast("Please upload an image file."); return; }
setUploadingAvatar(true);
try {
const processed = await processImageFile(file, { maxWidth: 1024, quality: 0.8, cropAspect: "square" });
if (processed.size > MAX_FILE_SIZE) { showToast("Image must be 5MB or less."); return; }
setAvatarPreview(previewUrl(processed));
const ext = extensionFromFile(processed);
const key = `avatars/${data.user.id}/${crypto.randomUUID()}.${ext}`;
const { uploadUrl } = await presignUpload(key, processed.type || "application/octet-stream");
await uploadFileWithPresignedUrl(uploadUrl, processed);
if (avatarKey) await deleteStoredObject(avatarKey).catch(() => {});
const r = await fetch("/api/me", {
method: "PUT",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ avatarUrl: key }),
});
const result = (await r.json()) as { error?: string; profile?: { avatarUrl: string } };
if (!r.ok) { showToast(result.error ?? "Upload failed."); return; }
const nextKey = result.profile?.avatarUrl ?? key;
setAvatarKey(nextKey);
const displayUrl = await presignRead(nextKey).catch(() => "");
setAvatarDisplay(displayUrl || nextKey);
window.dispatchEvent(new CustomEvent("profile-avatar-updated", { detail: { avatarUrl: displayUrl || nextKey } }));
showToast("Avatar updated.");
} catch { showToast("Unable to upload avatar right now."); }
finally {
setUploadingAvatar(false);
if (deviceInputRef.current) deviceInputRef.current.value = "";
}
};

// ── save profile
const save = async () => {
if (!username.trim()) { showToast("Username is required."); return; }
setSaving(true);
const r = await fetch("/api/me", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
name: name.trim(),
username: username.trim().toLowerCase(),
bio: bio.trim(),
country: country.trim(),
city: city.trim(),
...(avatarKey ? { avatarUrl: avatarKey } : {}),
}),
});
const result = (await r.json()) as { error?: string };
setSaving(false);
if (!r.ok) { showToast(result.error ?? "Unable to save."); return; }
showToast("Profile saved ✓");
};

// ── logout
const logout = async () => {
const supabase = createSupabaseClient();
await supabase.auth.signOut();
router.refresh();
};

// ── toast helper
const showToast = (msg: string) => {
setToast(msg);
setTimeout(() => setToast(null), 2800);
};

const verStatus = data?.profile?.identityStatus ?? "none";
const verDisplay: Record<string, { label: string; color: string; bg: string; border: string }> = {
none:     { label: "Not verified",       color: "rgba(232,232,232,0.45)", bg: "rgba(255,255,255,0.04)",   border: "rgba(255,255,255,0.1)" },
pending:  { label: "Pending review",      color: "rgba(253,224,71,0.85)", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.22)" },
approved: { label: "Identity verified ✓", color: "rgba(110,231,183,0.85)", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.22)" },
rejected: { label: "Rejected — resubmit", color: "rgba(252,165,165,0.85)", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)" },
};
const ver = verDisplay[verStatus] ?? verDisplay.none;

const displayAvatar = avatarPreview || avatarDisplay;
const initials = (name || data?.user?.email || "U")[0].toUpperCase();
const joined = formatJoined(data?.profile?.createdAt as string | undefined);
const countryFlag = countryByName[country] ?? "";

if (loading) {
return (
<main className="relative flex min-h-screen w-full flex-col overflow-hidden" style={{ background: "#000", fontFamily: "'DM Sans', sans-serif" }}>
<div className="flex flex-1 items-center justify-center">
<p style={{ color: "rgba(232,232,232,0.35)", fontSize: 13 }}>Loading…</p>
</div>
</main>
);
}

return (
<main
className="relative flex min-h-screen w-full flex-col overflow-hidden"
style={{ background: "#000", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto" }}
>
{/* animated blobs */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className="absolute rounded-full"
style={{ left: "-20%", top: "5%", width: 280, height: 280, background: "rgba(90,16,32,0.14)", filter: "blur(90px)" }} />
<div className="absolute rounded-full"
style={{ right: "-20%", top: "40%", width: 220, height: 220, background: "rgba(90,16,32,0.08)", filter: "blur(110px)" }} />
</div>

  {/* ── header ── */}
  <header className="relative z-10 flex shrink-0 items-center justify-between px-5" style={{ paddingTop: 24 }}>
    <div className="flex items-center gap-3">
      <HeaderMenuDrawer />
      <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.25)" }}>
        Vexa
      </span>
    </div>
    <button
      onClick={() => void logout()}
      className="rounded-[10px] px-3.5 py-1.5 text-[12px] font-medium transition-all"
      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,232,232,0.4)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "rgba(252,165,165,0.7)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(232,232,232,0.4)"; }}
    >
      Sign out
    </button>
  </header>

  {/* ── scrollable body ── */}
  <div className="relative z-10 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

    {/* ── avatar zone ── */}
    <div className="flex flex-col items-center px-5" style={{ paddingTop: 24, paddingBottom: 20 }}>
      <div className="relative cursor-pointer" style={{ width: 88 }} onClick={() => deviceInputRef.current?.click()}>
        {displayAvatar ? (
          <img src={displayAvatar} alt={name} className="object-cover"
            style={{ width: 88, height: 88, borderRadius: 28, border: "1.5px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
        ) : (
          <div className="flex items-center justify-center"
            style={{ width: 88, height: 88, borderRadius: 28, background: "linear-gradient(135deg,rgba(90,16,32,0.25),rgba(20,5,10,0.4))", border: "1.5px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)", fontFamily: "'Instrument Serif', serif", fontSize: 32, color: "rgba(255,255,255,0.4)" }}>
            {initials}
          </div>
        )}
        {/* edit badge */}
        <div className="absolute flex items-center justify-center" style={{ bottom: -4, right: -4, width: 26, height: 26, borderRadius: 8, background: "linear-gradient(160deg,rgba(120,25,48,0.95),rgba(65,10,24,0.95))", border: "1.5px solid rgba(150,40,65,0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.8)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        {uploadingAvatar && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 28, background: "rgba(0,0,0,0.55)" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Uploading…</p>
          </div>
        )}
      </div>
      <input ref={deviceInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => void onAvatarChange(e)} disabled={uploadingAvatar} />

      <p style={{ marginTop: 12, fontSize: 12.5, color: "rgba(232,232,232,0.38)" }}>{data?.user.email}</p>
      {joined && <p style={{ marginTop: 2, fontSize: 11, color: "rgba(232,232,232,0.2)" }}>Member since {joined}</p>}

      {/* verification badge */}
      <Link href="/me/verification">
        <div className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all"
          style={{ background: ver.bg, border: `1px solid ${ver.border}`, color: ver.color }}>
          {verStatus === "approved" && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          )}
          {ver.label}
        </div>
      </Link>
    </div>

    {/* ── form ── */}
    <div className="px-5 pb-10">

      {/* basic info */}
      <SectionLabel>Basic info</SectionLabel>
      <div className="overflow-hidden rounded-[18px]" style={glassField}>
        {/* name */}
        <FieldRow label="Name" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputCss} />
        </FieldRow>
        {/* username */}
        <FieldRow label="Username" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>}>
          <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="username" style={{ ...inputCss, fontSize: 13.5 }} />
          <span style={{ fontSize: 11, color: "rgba(232,232,232,0.18)", flexShrink: 0 }}>@</span>
        </FieldRow>
        {/* email readonly */}
        <FieldRow label="Email" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          <span style={{ flex: 1, fontSize: 14, color: "rgba(232,232,232,0.38)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data?.user.email}
          </span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(232,232,232,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </FieldRow>
      </div>

      <Sep />

      {/* location */}
      <SectionLabel>Location</SectionLabel>
      <div className="overflow-hidden rounded-[18px]" style={glassField}>
        {/* country picker */}
        <FieldRow label="Country" onClick={() => setCountryOpen(true)}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        >
          <span style={{ flex: 1, fontSize: 14, color: country ? "#e8e8e8" : "rgba(232,232,232,0.22)", display: "flex", alignItems: "center", gap: 8 }}>
            {countryFlag && <span style={{ fontSize: 18 }}>{countryFlag}</span>}
            <span>{country || "Select country"}</span>
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,232,232,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </FieldRow>
        {/* city */}
        <FieldRow label="City" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" style={inputCss} />
        </FieldRow>
      </div>

      <Sep />

      {/* bio */}
      <SectionLabel>About</SectionLabel>
      <div className="overflow-hidden rounded-[18px]" style={glassField}>
        <div className="flex items-start gap-3 px-4" style={{ paddingTop: 4 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(232,232,232,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 16, flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <textarea
            value={bio}
            onChange={(e) => { if (e.target.value.length <= 300) setBio(e.target.value); }}
            placeholder="Tell people a bit about yourself…"
            rows={3}
            style={{ ...inputCss, resize: "none", minHeight: 80, lineHeight: 1.55, paddingTop: 14, paddingBottom: 6 }}
          />
        </div>
        <div className="px-4 pb-3 text-right">
          <span style={{ fontSize: 11, color: "rgba(232,232,232,0.2)" }}>{bio.length} / 300</span>
        </div>
      </div>

      <Sep />

      {/* account */}
      <SectionLabel>Account</SectionLabel>
      <div className="overflow-hidden rounded-[18px]" style={glassField}>
        {/* verification */}
        <FieldRow label="Verification"
          onClick={() => router.push("/me/verification")}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        >
          <span style={{ flex: 1, fontSize: 13.5, color: ver.color }}>{ver.label}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,232,232,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </FieldRow>
        {/* joined */}
        {joined && (
          <FieldRow label="Member since" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
            <span style={{ flex: 1, fontSize: 14, color: "rgba(232,232,232,0.38)" }}>{joined}</span>
          </FieldRow>
        )}
      </div>

      {/* save */}
      <button
        onClick={() => void save()}
        disabled={saving || uploadingAvatar}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] py-3.5 text-[14px] font-semibold disabled:opacity-40"
        style={{ ...wineBtn, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
      >
        {saving ? "Saving…" : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Save changes
          </>
        )}
      </button>

      <Sep style={{ marginTop: 20 }} />

      {/* danger zone */}
      <SectionLabel>Danger zone</SectionLabel>
      <div
        className="flex cursor-pointer items-center justify-between rounded-[14px] px-4 py-3.5 transition-all"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}
        onClick={() => { if (window.confirm("Delete your account? This cannot be undone.")) alert("Implement delete flow"); }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(239,68,68,0.08)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(239,68,68,0.04)"; }}
      >
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(252,165,165,0.75)" }}>Delete account</p>
          <p style={{ fontSize: 11.5, color: "rgba(252,165,165,0.4)", marginTop: 2 }}>Permanently remove all your data</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(252,165,165,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

    </div>
  </div>

  {/* country picker sheet */}
  {countryOpen && (
    <CountryPicker
      current={country}
      onSelect={(_, name) => setCountry(name)}
      onClose={() => setCountryOpen(false)}
    />
  )}

  {/* toast */}
  {toast && (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2.5 text-[12.5px] font-medium"
      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", color: "#e8e8e8", animation: "toastIn 0.3s ease both" }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {toast}
    </div>
  )}

</main>

);
}
