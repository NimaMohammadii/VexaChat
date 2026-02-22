"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChangeEvent, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type FormState = {
  displayName: string;
  age: string;
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
  city: "",
  gender: "prefer_not",
  lookingFor: "any",
  intentTags: "Dinner,Chat",
  bio: "",
  imageUrl: ""
};

export function MeetCreateWizard() {
  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createSupabaseClient();
    const path = `cards/${crypto.randomUUID()}-${file.name.replace(/\s+/g, "-")}`;
    const upload = await supabase.storage.from("meet-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (upload.error) {
      setError(upload.error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("meet-images").getPublicUrl(path);
    setForm((current) => ({ ...current, imageUrl: data.publicUrl }));
    setUploading(false);
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
        isAdultConfirmed: true
      })
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-black px-4 py-12 text-white">
      <p className="text-xs tracking-[0.2em] text-white/60">MEET CREATE</p>
      <section className="bw-card space-y-4 p-6">
        {done ? (
          <div className="space-y-3">
            <p>Card saved.</p>
            <Link href="/meet/browse" className="bw-button inline-flex">Go to browse</Link>
          </div>
        ) : (
          <>
            <input className="w-full rounded-xl border border-white/20 bg-black px-4 py-3" placeholder="Display name" value={form.displayName} onChange={(event) => setForm((c) => ({ ...c, displayName: event.target.value }))} />
            <input className="w-full rounded-xl border border-white/20 bg-black px-4 py-3" placeholder="Age" type="number" value={form.age} onChange={(event) => setForm((c) => ({ ...c, age: event.target.value }))} />
            <input className="w-full rounded-xl border border-white/20 bg-black px-4 py-3" placeholder="City" value={form.city} onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))} />
            <textarea className="h-28 w-full rounded-xl border border-white/20 bg-black px-4 py-3" placeholder="Bio" value={form.bio} onChange={(event) => setForm((c) => ({ ...c, bio: event.target.value }))} />
            <input className="w-full rounded-xl border border-white/20 bg-black px-4 py-3" placeholder="Intent tags (comma separated)" value={form.intentTags} onChange={(event) => setForm((c) => ({ ...c, intentTags: event.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-xl border border-white/20 bg-black px-4 py-3" value={form.gender} onChange={(event) => setForm((c) => ({ ...c, gender: event.target.value as FormState["gender"] }))}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not">Prefer not to say</option></select>
              <select className="rounded-xl border border-white/20 bg-black px-4 py-3" value={form.lookingFor} onChange={(event) => setForm((c) => ({ ...c, lookingFor: event.target.value as FormState["lookingFor"] }))}><option value="any">Any</option><option value="male">Male</option><option value="female">Female</option></select>
            </div>
            <label className="block rounded-xl border border-dashed border-white/30 px-4 py-6 text-center text-sm text-white/70">
              Upload profile image (gallery/files)
              <input type="file" accept="image/*" className="mt-3 block w-full text-xs" onChange={onUpload} />
            </label>
            {form.imageUrl && <img src={form.imageUrl} alt="preview" className="h-40 w-full rounded-xl border border-white/10 object-cover" />}
            {error && <p className="text-sm text-white/70">{error}</p>}
            <motion.button whileTap={{ scale: 0.97 }} className="bw-button" disabled={uploading || saving || !form.imageUrl} onClick={() => void submit()}>{saving ? "Saving..." : uploading ? "Uploading..." : "Save card"}</motion.button>
          </>
        )}
      </section>
    </main>
  );
}
