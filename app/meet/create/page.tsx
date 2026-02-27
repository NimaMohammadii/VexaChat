“use client”;

import Link from “next/link”;
import { motion } from “framer-motion”;
import { ChangeEvent, useState } from “react”;
import { presignRead, presignUpload, uploadFileWithPresignedUrl } from “@/lib/client/storage”;

// ── types (identical to original) ────────────────────────────────────────────

type FormState = {
displayName: string;
age: string;
city: string;
gender: “male” | “female” | “other” | “prefer_not”;
lookingFor: “male” | “female” | “any”;
intentTags: string;
bio: string;
imageUrl: string;
};

const initial: FormState = {
displayName: “”,
age: “”,
city: “”,
gender: “prefer_not”,
lookingFor: “any”,
intentTags: “Dinner,Chat”,
bio: “”,
imageUrl: “”,
};

const INTENT_OPTIONS = [“Dinner”, “Chat”, “Dating”, “Friendship”, “Activities”];

// ── helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
background: “linear-gradient(160deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.016) 45%,rgba(0,0,0,0.07) 100%)”,
border: “1px solid rgba(255,255,255,0.11)”,
borderBottom: “1px solid rgba(255,255,255,0.04)”,
backdropFilter: “blur(30px)”,
boxShadow: “inset 0 1.5px 0 rgba(255,255,255,0.07),inset 0 -1px 0 rgba(0,0,0,0.16)”,
caretColor: “#8a1f38”,
fontFamily: “‘DM Sans’, sans-serif”,
color: “white”,
outline: “none”,
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function MeetCreatePage() {
const [form,       setForm]       = useState<FormState>(initial);
const [uploading,  setUploading]  = useState(false);
const [saving,     setSaving]     = useState(false);
const [done,       setDone]       = useState(false);
const [error,      setError]      = useState<string | null>(null);
const [previewUrl, setPreviewUrl] = useState(””);

const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
setForm((c) => ({ …c, [key]: val }));

// ── upload (identical to original) ───────────────────────────────────────
const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
const file = event.target.files?.[0];
if (!file) return;
setUploading(true);
setError(null);
const meRes = await fetch(”/api/me”, { cache: “no-store” }).catch(() => null);
if (!meRes || !meRes.ok) {
setError(“You must be signed in to upload.”);
setUploading(false);
return;
}
const mePayload = (await meRes.json()) as { user: { id: string } };
const ext = file.name.split(”.”).pop() || “jpg”;
const key = `meet-images/${mePayload.user.id}/${crypto.randomUUID()}.${ext}`;
try {
const { uploadUrl } = await presignUpload(key, file.type || “application/octet-stream”);
await uploadFileWithPresignedUrl(uploadUrl, file);
set(“imageUrl”, key);
const readUrl = await presignRead(key);
setPreviewUrl(readUrl);
} catch (err) {
setError(err instanceof Error ? err.message : “Unable to upload image.”);
}
setUploading(false);
};

// ── submit (identical to original) ───────────────────────────────────────
const submit = async () => {
setSaving(true);
setError(null);
const r = await fetch(”/api/meet/card”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
…form,
age: Number(form.age),
intentTags: form.intentTags.split(”,”).map((t) => t.trim()).filter(Boolean),
isAdultConfirmed: true,
}),
});
if (!r.ok) {
const payload = (await r.json()) as { error?: string };
setError(payload.error ?? “Unable to save.”);
setSaving(false);
return;
}
setDone(true);
setSaving(false);
};

const activeIntents = form.intentTags.split(”,”).map((t) => t.trim()).filter(Boolean);
const toggleIntent = (tag: string) => {
const next = activeIntents.includes(tag) ? activeIntents.filter((t) => t !== tag) : […activeIntents, tag];
set(“intentTags”, next.join(”,”));
};

const fade = { duration: 0.28, ease: “easeOut” as const };

return (
<motion.main
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={fade}
className=“relative min-h-screen w-full overflow-hidden pb-16 text-white”
style={{ background: “#000”, fontFamily: “‘DM Sans’, sans-serif” }}
>
{/* ambient */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className=“absolute rounded-full” style={{ left: “-15%”, top: “30%”, width: 240, height: 240, background: “rgba(90,16,32,0.1)”, filter: “blur(100px)” }} />
</div>

```
  <div className="relative z-10 mx-auto max-w-xl px-5">

    {/* header */}
    <div className="flex items-center gap-3 pt-6">
      <Link href="/meet" className="flex h-9 w-9 items-center justify-center rounded-[12px] text-white/60 transition-all active:scale-90"
        style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.1) 100%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </Link>
      <h1 className="text-[24px] text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: "-0.7px", fontWeight: 400 }}>
        Your card
      </h1>
    </div>

    {/* done state */}
    {done ? (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.38, ease: [0.34, 1.15, 0.64, 1] }}
        className="mt-10 rounded-[22px] p-8 text-center"
        style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)", border: "1px solid rgba(255,255,255,0.13)", backdropFilter: "blur(50px) saturate(1.6)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)" }}>
        <p className="mb-5 text-[15px] text-white/80">Card saved ✓</p>
        <Link href="/meet/browse" className="inline-flex h-11 items-center gap-2 rounded-[14px] px-5 text-[13.5px] font-semibold text-white/90 transition-all active:scale-95"
          style={{ background: "linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)", border: "1px solid rgba(150,40,65,0.28)", boxShadow: "inset 0 1.5px 0 rgba(220,80,110,0.2),0 4px 16px rgba(0,0,0,0.4)" }}>
          Go to browse
        </Link>
      </motion.div>
    ) : (
      <div className="mt-6 flex flex-col gap-5">

        {/* photo upload */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.04 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Photo</p>
          <label className="relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[18px] transition-all duration-200"
            style={{ background: previewUrl ? "transparent" : "linear-gradient(160deg,rgba(255,255,255,0.04) 0%,rgba(0,0,0,0.06) 100%)", border: "1.5px dashed rgba(255,255,255,0.13)", color: "rgba(232,232,232,0.4)" }}>
            {previewUrl && <img src={previewUrl} alt="preview" className="absolute inset-0 h-full w-full rounded-[17px] object-cover" />}
            {!previewUrl && (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="text-[12.5px] font-medium">{uploading ? "Uploading…" : "Upload photo"}</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onUpload(e)} disabled={uploading} />
          </label>
        </motion.div>

        {/* name + age */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.07 }} className="flex gap-3">
          <div className="flex-1">
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Name</p>
            <input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Sofia"
              className="w-full rounded-[13px] px-4 py-3 text-[14px] placeholder:text-white/20"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(138,31,56,0.28)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)")} />
          </div>
          <div style={{ width: 100 }}>
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Age</p>
            <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="26"
              className="w-full rounded-[13px] px-4 py-3 text-[14px] placeholder:text-white/20"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(138,31,56,0.28)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)")} />
          </div>
        </motion.div>

        {/* city */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.1 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>City</p>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Berlin"
            className="w-full rounded-[13px] px-4 py-3 text-[14px] placeholder:text-white/20"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(138,31,56,0.28)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)")} />
        </motion.div>

        {/* I am */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.13 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>I am</p>
          <div className="flex flex-wrap gap-2">
            {(["male", "female", "other", "prefer_not"] as const).map((opt) => {
              const labels = { male: "Male", female: "Female", other: "Other", prefer_not: "Prefer not to say" };
              const on = form.gender === opt;
              return (
                <button key={opt} type="button" onClick={() => set("gender", opt)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-95"
                  style={{ background: on ? "rgba(90,16,32,0.28)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(138,31,56,0.32)" : "1px solid rgba(255,255,255,0.09)", color: on ? "rgba(255,255,255,0.82)" : "rgba(232,232,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  {labels[opt]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* looking for */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.16 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Looking for</p>
          <div className="flex flex-wrap gap-2">
            {(["any", "male", "female"] as const).map((opt) => {
              const labels = { any: "Anyone", male: "Men", female: "Women" };
              const on = form.lookingFor === opt;
              return (
                <button key={opt} type="button" onClick={() => set("lookingFor", opt)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-95"
                  style={{ background: on ? "rgba(90,16,32,0.28)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(138,31,56,0.32)" : "1px solid rgba(255,255,255,0.09)", color: on ? "rgba(255,255,255,0.82)" : "rgba(232,232,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  {labels[opt]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* here for */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.19 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Here for</p>
          <div className="flex flex-wrap gap-2">
            {INTENT_OPTIONS.map((tag) => {
              const on = activeIntents.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => toggleIntent(tag)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-95"
                  style={{ background: on ? "rgba(90,16,32,0.28)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(138,31,56,0.32)" : "1px solid rgba(255,255,255,0.09)", color: on ? "rgba(255,255,255,0.82)" : "rgba(232,232,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  {tag}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* bio */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.22 }}>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(232,232,232,0.38)" }}>Bio</p>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell people a bit about yourself…" rows={3}
            className="w-full resize-none rounded-[13px] px-4 py-3 text-[14px] leading-relaxed placeholder:text-white/20"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(138,31,56,0.28)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)")} />
        </motion.div>

        {/* error */}
        {error && (
          <p className="rounded-[10px] px-4 py-2.5 text-[12.5px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(252,165,165,0.8)" }}>
            {error}
          </p>
        )}

        {/* save */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.25 }} className="pb-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => void submit()} disabled={uploading || saving || !form.imageUrl}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14px] font-semibold text-white/90 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)", border: "1px solid rgba(150,40,65,0.28)", borderBottom: "1px solid rgba(0,0,0,0.4)", boxShadow: "inset 0 1.5px 0 rgba(220,80,110,0.2),0 4px 16px rgba(0,0,0,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? "Saving…" : uploading ? "Uploading…" : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save card
              </>
            )}
          </motion.button>
        </motion.div>

      </div>
    )}
  </div>
</motion.main>
```

);
}
