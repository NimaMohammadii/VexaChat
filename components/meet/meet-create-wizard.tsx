"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, useMemo, useState } from "react";
import { SvjCameraIcon, SvjUploadIcon } from "@/components/svj-icons";
import { createSupabaseClient } from "@/lib/supabase-client";

const tags = ["Dinner", "Drinks", "Chat", "Travel", "Event", "Companionship", "Luxury"];
const steps = ["Basics", "Preferences", "About", "Photo"];

type FormState = {
  displayName: string;
  age: string;
  city: string;
  gender: "male" | "female" | "other" | "prefer_not";
  lookingFor: "male" | "female" | "any";
  intentTags: string[];
  bio: string;
  isAdultConfirmed: boolean;
  imageUrl: string;
};

async function resizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or less.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));

  if (!blob) {
    return file;
  }

  return new File([blob], `${file.name.split(".")[0]}.webp`, { type: "image/webp" });
}

export function MeetCreateWizard() {
  const [step, setStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<FormState>({
    displayName: "",
    age: "",
    city: "",
    gender: "male",
    lookingFor: "any",
    intentTags: [],
    bio: "",
    isAdultConfirmed: false,
    imageUrl: ""
  });

  const progress = useMemo(() => `${Math.round(((step + 1) / steps.length) * 100)}%`, [step]);

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createSupabaseClient();
      const processed = await resizeImage(file);
      const ext = processed.name.split(".").pop() || "jpg";
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You need to be signed in.");
      }

      const path = `${user.id}/${Date.now()}.${ext}`;
      const upload = await supabase.storage.from("meet-images").upload(path, processed, {
        upsert: false,
        contentType: processed.type
      });

      if (upload.error) {
        throw new Error(upload.error.message);
      }

      const { data } = supabase.storage.from("meet-images").getPublicUrl(path);
      setForm((current) => ({ ...current, imageUrl: data.publicUrl }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    setError(null);

    const age = Number(form.age);

    if (!form.displayName.trim() || !form.city.trim() || !Number.isInteger(age) || age < 18 || !form.isAdultConfirmed || !form.imageUrl || form.intentTags.length < 1) {
      setError("Please complete all required fields and confirm 18+.");
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/meet/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName,
        age,
        city: form.city,
        gender: form.gender,
        lookingFor: form.lookingFor,
        intentTags: form.intentTags,
        bio: form.bio,
        imageUrl: form.imageUrl,
        isAdultConfirmed: form.isAdultConfirmed
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not create card.");
      setIsSaving(false);
      return;
    }

    setDone(true);
    setIsSaving(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={done ? "done" : `step-${step}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10"
      >
        {done ? (
          <div className="bw-card space-y-4 p-6 text-center">
            <p className="text-xl font-medium">Meet card created.</p>
            <p className="text-sm text-white/65">You can now start browsing curated profiles.</p>
            <Link href="/meet/browse" className="bw-button">Start browsing</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <p className="text-xs tracking-[0.2em] text-white/55">CREATE MEET CARD</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-white transition-all" style={{ width: progress }} /></div>
              <p className="text-sm text-white/60">Step {step + 1} of {steps.length}: {steps[step]}</p>
            </div>

            <div className="bw-card overflow-hidden p-6">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  {step === 0 && (
                    <div className="space-y-3">
                      <input className="bw-input" placeholder="Display name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
                      <input className="bw-input" type="number" min={18} placeholder="Age (18+)" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} />
                      <input className="bw-input" placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                      <label className="flex items-center gap-2 text-sm text-white/80">
                        <input type="checkbox" checked={form.isAdultConfirmed} onChange={(event) => setForm((current) => ({ ...current, isAdultConfirmed: event.target.checked }))} /> I&apos;m 18+
                      </label>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-3">
                      <select className="bw-input" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as FormState["gender"] }))}>
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not">Prefer not to say</option>
                      </select>
                      <select className="bw-input" value={form.lookingFor} onChange={(event) => setForm((current) => ({ ...current, lookingFor: event.target.value as FormState["lookingFor"] }))}>
                        <option value="any">Looking for any</option><option value="male">Looking for male</option><option value="female">Looking for female</option>
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const selected = form.intentTags.includes(tag);

                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setForm((current) => {
                                if (selected) {
                                  return { ...current, intentTags: current.intentTags.filter((item) => item !== tag) };
                                }

                                if (current.intentTags.length >= 5) {
                                  return current;
                                }

                                return { ...current, intentTags: [...current.intentTags, tag] };
                              })}
                              className={`rounded-full border px-3 py-1.5 text-sm transition ${selected ? "border-white bg-white text-black" : "border-white/20 text-white/75 hover:border-white/60"}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-2">
                      <textarea className="bw-input min-h-36 resize-none" maxLength={280} placeholder="Bio (optional)" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                      <p className="text-right text-xs text-white/50">{form.bio.length}/280</p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <label className="bw-button-muted w-full cursor-pointer gap-2">
                        <SvjUploadIcon className="h-4 w-4" /> Upload from gallery/files
                        <input type="file" accept="image/*" className="hidden" onChange={uploadFile} />
                      </label>
                      <label className="bw-button-muted w-full cursor-pointer gap-2">
                        <SvjCameraIcon className="h-4 w-4" /> Take photo
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={uploadFile} />
                      </label>
                      {isUploading ? <p className="text-sm text-white/60">Uploading image…</p> : null}
                      {form.imageUrl ? <p className="text-sm text-white/75">Image ready.</p> : null}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <div className="mt-5 flex justify-between">
              <motion.button whileTap={{ scale: 0.97 }} type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))} className="bw-button-muted disabled:opacity-40">Back</motion.button>
              {step < steps.length - 1 ? (
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))} className="bw-button">Next</motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} type="button" disabled={isSaving || isUploading} onClick={() => void submit()} className="bw-button disabled:opacity-40">{isSaving ? "Saving..." : "Create card"}</motion.button>
              )}
            </div>
          </>
        )}
      </motion.main>
    </AnimatePresence>
  );
}
