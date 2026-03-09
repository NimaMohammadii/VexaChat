"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChangeEvent, useState } from "react";
import { presignRead, presignUpload, uploadFileWithPresignedUrl } from "@/lib/client/storage";
import { MeetShell, meetGhostButtonClass, meetPanelClass, meetPrimaryButtonClass, meetSecondaryPanelClass } from "@/components/meet/meet-shell";

type FormState = {
  displayName: string;
  age: string;
  countryCode: string;
  city: string;
  gender: "male" | "female" | "other" | "prefer_not";
  lookingFor: "male" | "female" | "any";
  intentTags: string;
  bio: string;
  imageUrl: string;
};

const initial: FormState = {
  displayName: "",
  age: "",
  countryCode: "",
  city: "",
  gender: "prefer_not",
  lookingFor: "any",
  intentTags: "Dinner,Chat",
  bio: "",
  imageUrl: "",
};

const INTENT_OPTIONS = ["Dinner", "Chat", "Dating", "Friendship", "Activities"];
const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
];

export default function MeetCreatePage() {
  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm((current) => ({ ...current, [key]: val }));

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const meRes = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
    if (!meRes || !meRes.ok) {
      setError("You must be signed in to upload.");
      setUploading(false);
      return;
    }

    const mePayload = (await meRes.json()) as { user: { id: string } };
    const ext = file.name.split(".").pop() || "jpg";
    const key = `meet-images/${mePayload.user.id}/${crypto.randomUUID()}.${ext}`;

    try {
      const { uploadUrl } = await presignUpload(key, file.type || "application/octet-stream");
      await uploadFileWithPresignedUrl(uploadUrl, file);
      set("imageUrl", key);
      setPreviewUrl(await presignRead(key));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    }

    setUploading(false);
  };

  const removePhoto = async () => {
    setError(null);
    const response = await fetch("/api/meet/card/image", { method: "DELETE" });
    if (response.status === 404) {
      setPreviewUrl("");
      set("imageUrl", "");
      return;
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Unable to remove photo.");
      return;
    }
    setPreviewUrl("");
    set("imageUrl", "");
  };

  const submit = async () => {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/meet/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        intentTags: form.intentTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        isAdultConfirmed: true,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to save.");
      setSaving(false);
      return;
    }

    setDone(true);
    setSaving(false);
  };

  const activeIntents = form.intentTags.split(",").map((tag) => tag.trim()).filter(Boolean);

  return (
    <MeetShell
      eyebrow="Meet • Card setup"
      title="Craft your profile"
      subtitle="Intentional inputs, premium presentation, and the same trusted save flow."
      actions={<Link href="/meet" className={meetGhostButtonClass}>Back</Link>}
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {done ? (
          <div className={`${meetPanelClass} p-6`}>
            <p className="text-xl font-semibold tracking-tight">Card saved successfully</p>
            <p className="mt-2 text-sm text-white/60">Everything is ready. Start browsing now.</p>
            <Link href="/meet/browse" className={`${meetPrimaryButtonClass} mt-5`}>
              Go to browse
            </Link>
          </div>
        ) : (
          <div className={`${meetPanelClass} space-y-4 p-4`}>
            <section className={meetSecondaryPanelClass + " space-y-3 p-4"}>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Identity</p>
              <label className="space-y-1.5 text-xs text-white/60">Display name
                <input className="w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/35" placeholder="How people should see you" value={form.displayName} onChange={(event) => set("displayName", event.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-white/60">Age
                  <input className="w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/35" placeholder="18+" value={form.age} onChange={(event) => set("age", event.target.value)} />
                </label>
                <label className="space-y-1.5 text-xs text-white/60">City
                  <input className="w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/35" placeholder="Your city" value={form.city} onChange={(event) => set("city", event.target.value)} />
                </label>
              </div>
              <label className="space-y-1.5 text-xs text-white/60">Country
                <select className="w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/35" value={form.countryCode} onChange={(event) => set("countryCode", event.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className={meetSecondaryPanelClass + " space-y-3 p-4"}>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">About</p>
              <label className="space-y-1.5 text-xs text-white/60">Bio
                <textarea className="w-full resize-none rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/35" rows={4} placeholder="Share your style and what kind of conversation you enjoy." value={form.bio} onChange={(event) => set("bio", event.target.value)} />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/45">I am</p>
                  <div className="flex flex-wrap gap-2">
                    {(["male", "female", "other", "prefer_not"] as const).map((opt) => (
                      <button key={opt} type="button" onClick={() => set("gender", opt)} className={`rounded-full border px-3.5 py-2 text-xs ${form.gender === opt ? "border-[#ff9ab5]/50 bg-[#ff2e63]/20 text-white" : "border-white/15 bg-white/5 text-white/70"}`}>
                        {opt === "prefer_not" ? "Prefer not" : opt[0].toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/45">Looking for</p>
                  <div className="flex flex-wrap gap-2">
                    {(["any", "male", "female"] as const).map((opt) => (
                      <button key={opt} type="button" onClick={() => set("lookingFor", opt)} className={`rounded-full border px-3.5 py-2 text-xs ${form.lookingFor === opt ? "border-[#ff9ab5]/50 bg-[#ff2e63]/20 text-white" : "border-white/15 bg-white/5 text-white/70"}`}>
                        {opt === "any" ? "Anyone" : opt[0].toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/45">Intent tags</p>
                <div className="flex flex-wrap gap-2">
                  {INTENT_OPTIONS.map((tag) => {
                    const selected = activeIntents.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const next = selected ? activeIntents.filter((item) => item !== tag) : [...activeIntents, tag];
                          set("intentTags", next.join(","));
                        }}
                        className={`rounded-full border px-3.5 py-2 text-xs ${selected ? "border-[#ff9ab5]/50 bg-[#ff2e63]/20 text-white" : "border-white/15 bg-white/5 text-white/70"}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className={meetSecondaryPanelClass + " p-4"}>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Profile photo</p>
              <div className="rounded-2xl border border-dashed border-white/20 bg-black/35 p-3">
                <div className="flex items-center gap-2.5">
                  <label className={meetGhostButtonClass + " cursor-pointer"}>
                    Upload photo
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void onUpload(event)} disabled={uploading} />
                  </label>
                  <button type="button" onClick={() => void removePhoto()} className={meetGhostButtonClass} disabled={!form.imageUrl}>Remove</button>
                </div>
                {!!previewUrl && <img src={previewUrl} alt="Preview" className="mt-3 h-52 w-full rounded-2xl border border-white/10 object-cover" />}
              </div>
            </section>

            {error && <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}

            <button type="button" onClick={() => void submit()} disabled={saving || uploading || !form.imageUrl || !form.countryCode} className={meetPrimaryButtonClass + " w-full py-3.5"}>
              {saving ? "Saving..." : uploading ? "Uploading..." : "Save card"}
            </button>
          </div>
        )}
      </motion.div>
    </MeetShell>
  );
}
