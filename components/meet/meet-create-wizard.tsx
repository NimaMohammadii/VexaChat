"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type MeetCard = {
  displayName: string;
  age: number;
  city: string;
  gender: string;
  lookingFor: string;
  bio: string;
  questionPrompt: string;
  answer: string;
  imageUrls: string[];
  isAdultConfirmed: boolean;
  isActive: boolean;
};

const initial: MeetCard = {
  displayName: "",
  age: 18,
  city: "",
  gender: "prefer_not",
  lookingFor: "any",
  bio: "",
  questionPrompt: "",
  answer: "",
  imageUrls: [],
  isAdultConfirmed: false,
  isActive: true
};

async function resizeImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return await new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(file);
      resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
    }, "image/jpeg", 0.85);
  });
}

export function MeetCreateWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MeetCard>(initial);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [hasExistingCard, setHasExistingCard] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/meet/card", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.card) {
        setForm({ ...initial, ...payload.card, bio: payload.card.bio ?? "", questionPrompt: payload.card.questionPrompt ?? "", answer: payload.card.answer ?? "" });
        setHasExistingCard(true);
      }
      setLoading(false);
    })();
  }, []);

  const progress = useMemo(() => `${step + 1}/6`, [step]);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const supabase = createSupabaseClient();
    const nextUrls = [...form.imageUrls];

    for (const file of Array.from(files)) {
      if (nextUrls.length >= 2) break;
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) continue;
      const resized = await resizeImage(file);
      const ext = (resized.name.split(".").pop() || "jpg").toLowerCase();
      const path = `meet/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("meet-images").upload(path, resized, { upsert: false });
      if (error || !data?.path) continue;
      const { data: urlData } = supabase.storage.from("meet-images").getPublicUrl(data.path);
      if (urlData.publicUrl) nextUrls.push(urlData.publicUrl);
    }

    setForm((s) => ({ ...s, imageUrls: nextUrls.slice(0, 2) }));
  };

  const save = async () => {
    const method = hasExistingCard ? "PATCH" : "POST";
    const response = await fetch("/api/meet/card", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (response.ok) setHasExistingCard(true);
    setStatus(response.ok ? "Saved successfully." : payload.error || "Failed to save.");
  };

  if (loading) return <div className="bw-card p-6">Loading...</div>;

  return (
    <section className="bw-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meet Card Wizard</h1>
        <p className="text-sm text-white/60">{progress}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="space-y-3"
        >
          {step === 0 && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isAdultConfirmed} onChange={(e) => setForm({ ...form, isAdultConfirmed: e.target.checked })} /> I confirm I am 18+.</label>}
          {step === 1 && <><input className="bw-input" placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /><input className="bw-input" type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /><input className="bw-input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></>}
          {step === 2 && <><select className="bw-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not">Prefer not</option></select><select className="bw-input" value={form.lookingFor} onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="any">Any</option></select></>}
          {step === 3 && <div className="space-y-2"><input aria-label="Choose images from device" type="file" accept="image/*" multiple onChange={(e) => void uploadImages(e.target.files)} /><input aria-label="Take photo" type="file" accept="image/*" capture="user" onChange={(e) => void uploadImages(e.target.files)} /><p className="text-xs text-white/60">Max 2 images, max 5MB each.</p><ul className="text-xs text-white/70">{form.imageUrls.map((url) => <li key={url}>{url}</li>)}</ul></div>}
          {step === 4 && <><textarea className="bw-input min-h-24" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><input className="bw-input" placeholder="Question prompt" value={form.questionPrompt} onChange={(e) => setForm({ ...form, questionPrompt: e.target.value })} /><input className="bw-input" placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></>}
          {step === 5 && <div className="text-sm text-white/80">Review: {form.displayName}, {form.age}, {form.city}. {form.imageUrls.length} image(s).</div>}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <button className="bw-button-muted" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
        {step < 5 ? (
          <button className="bw-button" onClick={() => setStep((s) => Math.min(5, s + 1))}>Next</button>
        ) : (
          <button className="bw-button" onClick={() => void save()}>Submit</button>
        )}
      </div>
      {status ? <p className="text-sm text-white/70">{status}</p> : null}
    </section>
  );
}
