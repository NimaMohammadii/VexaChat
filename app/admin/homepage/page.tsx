"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type HomeSection = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  order: number;
  isActive: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminHomepageManagerPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [status, setStatus] = useState<"loading" | "forbidden" | "ready" | "error">("loading");
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", order: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/home-sections", { cache: "no-store" }).catch(() => null);

    if (!response) return setStatus("error");
    if (response.status === 403) return setStatus("forbidden");
    if (!response.ok) return setStatus("error");

    const payload = (await response.json()) as { sections: HomeSection[] };
    setSections(payload.sections);
    setStatus("ready");
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: data });
    if (!response.ok) return;
    const payload = (await response.json()) as { url: string };
    setForm((current) => ({ ...current, imageUrl: payload.url }));
  };

  const createSection = async () => {
    setSaving(true);
    const response = await fetch("/api/admin/home-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);

    if (response.ok) {
      setForm({ title: "", subtitle: "", imageUrl: "", order: 0, isActive: true });
      void load();
    }
  };

  const updateSection = async (id: string, patch: Partial<HomeSection>) => {
    const response = await fetch(`/api/admin/home-sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (response.ok) void load();
  };

  const deleteSection = async (id: string) => {
    const response = await fetch(`/api/admin/home-sections/${id}`, { method: "DELETE" });
    if (response.ok) void load();
  };

  if (status === "loading") return <p className="text-sm text-white/70">Loading homepage manager…</p>;
  if (status === "forbidden") return <p className="text-sm text-red-300">Forbidden.</p>;
  if (status === "error") return <p className="text-sm text-red-300">Unable to load homepage manager.</p>;

  return (
    <section className="space-y-8">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }}>
        <h1 className="text-3xl font-semibold">Homepage Manager</h1>
        <div className="mt-3 h-px w-28 bg-[#FF2E63]/60" />
      </motion.div>

      <motion.article initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }} className="rounded-2xl border border-white/[0.08] bg-black/40 p-5">
        <p className="mb-4 text-sm text-white/70">Create Home Section</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="bw-input" placeholder="Title" value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} />
          <input className="bw-input" placeholder="Subtitle" value={form.subtitle} onChange={(event) => setForm((c) => ({ ...c, subtitle: event.target.value }))} />
          <input className="bw-input" type="number" placeholder="Order" value={form.order} onChange={(event) => setForm((c) => ({ ...c, order: Number(event.target.value) || 0 }))} />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((c) => ({ ...c, isActive: event.target.checked }))} />
            Active
          </label>
          <input
            className="bw-input md:col-span-2"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(event) => setForm((c) => ({ ...c, imageUrl: event.target.value }))}
          />
          <input
            className="md:col-span-2 block w-full text-xs text-white/80"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadImage(file);
            }}
          />
        </div>
        <button disabled={saving} className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:border hover:border-[#FF2E63]/70 hover:opacity-90" onClick={() => void createSection()}>
          {saving ? "Saving..." : "Create Section"}
        </button>
      </motion.article>

      <div className="space-y-4">
        {sections.map((section) => (
          <motion.article key={section.id} initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }} className="rounded-2xl border border-white/[0.08] bg-black/35 p-4">
            <div className="grid gap-4 md:grid-cols-[120px_1fr]">
              <div className="relative h-28 overflow-hidden rounded-xl border border-white/[0.08]">
                <Image src={section.imageUrl} alt={section.title} fill className="object-cover" />
              </div>
              <div className="space-y-2">
                <input className="bw-input" value={section.title} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item))} />
                <input className="bw-input" value={section.subtitle ?? ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, subtitle: event.target.value } : item))} />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="bw-input w-28"
                    type="number"
                    value={section.order}
                    onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, order: Number(event.target.value) || 0 } : item))}
                  />
                  <label className="flex items-center gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={section.isActive}
                      onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, isActive: event.target.checked } : item))}
                    />
                    Active
                  </label>
                  <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-[#FF2E63]/70" onClick={() => void updateSection(section.id, section)}>
                    Save
                  </button>
                  <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-[#FF2E63]/70" onClick={() => void deleteSection(section.id)}>
                    Delete
                  </button>
                </div>
                <input
                  className="block w-full text-xs text-white/80"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const data = new FormData();
                    data.set("file", file);
                    const response = await fetch("/api/admin/upload", { method: "POST", body: data });
                    if (!response.ok) return;
                    const payload = (await response.json()) as { url: string };
                    await updateSection(section.id, { imageUrl: payload.url });
                  }}
                />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
