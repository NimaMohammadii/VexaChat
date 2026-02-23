"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type HomeSection = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  order: number;
  isActive: boolean;
};

type HomeConfig = {
  id: string;
  heroTitle: string;
  heroAccentWord: string | null;
  heroSubtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string | null;
};

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function AdminHomepageManagerPage() {
  const [activeTab, setActiveTab] = useState<"hero" | "sections">("hero");
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [heroForm, setHeroForm] = useState({
    heroTitle: "",
    heroAccentWord: "",
    heroSubtitle: "",
    primaryCtaText: "",
    secondaryCtaText: ""
  });
  const [status, setStatus] = useState<"loading" | "forbidden" | "ready" | "error">("loading");
  const [savingHero, setSavingHero] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", subtitle: "", imageUrl: "", isActive: true });
  const [toast, setToast] = useState<string | null>(null);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    [sections]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: data });
    if (!response.ok) throw new Error("Upload failed");
    return (await response.json() as { url: string }).url;
  };

  const loadAll = async () => {
    setStatus("loading");
    const [configResponse, sectionsResponse] = await Promise.all([
      fetch("/api/admin/home-config", { cache: "no-store" }).catch(() => null),
      fetch("/api/admin/home-sections", { cache: "no-store" }).catch(() => null)
    ]);

    if (!configResponse || !sectionsResponse) return setStatus("error");
    if (configResponse.status === 403 || sectionsResponse.status === 403) return setStatus("forbidden");
    if (!configResponse.ok || !sectionsResponse.ok) return setStatus("error");

    const configPayload = await configResponse.json() as { config: HomeConfig };
    const sectionsPayload = await sectionsResponse.json() as { sections: HomeSection[] };

    setHeroForm({
      heroTitle: configPayload.config.heroTitle,
      heroAccentWord: configPayload.config.heroAccentWord ?? "",
      heroSubtitle: configPayload.config.heroSubtitle,
      primaryCtaText: configPayload.config.primaryCtaText,
      secondaryCtaText: configPayload.config.secondaryCtaText ?? ""
    });
    setSections(sectionsPayload.sections);
    setStatus("ready");
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const saveHero = async () => {
    setSavingHero(true);
    const response = await fetch("/api/admin/home-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(heroForm)
    });
    setSavingHero(false);
    if (response.ok) setToast("Saved");
  };

  const saveSection = async (section: HomeSection) => {
    const response = await fetch(`/api/admin/home-sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section)
    });

    if (response.ok) setToast("Saved");
  };

  const moveSection = async (id: string, direction: -1 | 1) => {
    const index = sortedSections.findIndex((item) => item.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sortedSections.length) return;

    const current = sortedSections[index];
    const target = sortedSections[swapIndex];

    await Promise.all([
      fetch(`/api/admin/home-sections/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: target.order }) }),
      fetch(`/api/admin/home-sections/${target.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: current.order }) })
    ]);

    await loadAll();
  };

  if (status === "loading") return <p className="text-sm text-white/70">Loading homepage manager…</p>;
  if (status === "forbidden") return <p className="text-sm text-red-300">Forbidden.</p>;
  if (status === "error") return <p className="text-sm text-red-300">Unable to load homepage manager.</p>;

  return (
    <motion.section className="space-y-6" initial="hidden" animate="visible" variants={fadeUp}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Homepage Manager</h1>
          <div className="mt-2 h-px w-24 bg-[#FF2E63]/60" />
        </div>
        <AnimatePresence>
          {toast ? (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/85">
              {toast}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="inline-flex rounded-full border border-white/[0.08] bg-black/20 p-1 text-sm">
        {(["hero", "sections"] as const).map((tab) => (
          <motion.button
            key={tab}
            className={`rounded-full px-4 py-1.5 capitalize ${activeTab === tab ? "bg-white text-black" : "text-white/75"}`}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "hero" ? (
          <motion.article key="hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/40 p-5">
            <label className="space-y-1 text-sm"><span>Hero Title</span><input className="bw-input" value={heroForm.heroTitle} onChange={(event) => setHeroForm((current) => ({ ...current, heroTitle: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Hero Accent Word</span><input className="bw-input" value={heroForm.heroAccentWord} onChange={(event) => setHeroForm((current) => ({ ...current, heroAccentWord: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Hero Subtitle</span><textarea className="bw-input min-h-28" value={heroForm.heroSubtitle} onChange={(event) => setHeroForm((current) => ({ ...current, heroSubtitle: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Primary CTA text</span><input className="bw-input" value={heroForm.primaryCtaText} onChange={(event) => setHeroForm((current) => ({ ...current, primaryCtaText: event.target.value }))} /></label>
            <label className="space-y-1 text-sm"><span>Secondary CTA text</span><input className="bw-input" value={heroForm.secondaryCtaText} onChange={(event) => setHeroForm((current) => ({ ...current, secondaryCtaText: event.target.value }))} /></label>

            <div className="rounded-xl border border-white/[0.06] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Preview</p>
              <p className="mt-2 text-2xl font-semibold">{heroForm.heroTitle} <span className="text-[#FF2E63]">{heroForm.heroAccentWord}</span></p>
              <p className="mt-2 text-sm text-white/70">{heroForm.heroSubtitle}</p>
            </div>

            <motion.button whileTap={{ scale: 0.98 }} disabled={savingHero} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black" onClick={() => void saveHero()}>
              {savingHero ? "Saving..." : "Save"}
            </motion.button>
          </motion.article>
        ) : (
          <motion.div key="sections" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setIsCreateOpen(true)} className="rounded-full border border-white/25 px-4 py-2 text-sm hover:border-[#FF2E63]/70">Create New Section</motion.button>

            <AnimatePresence>
              {isCreateOpen ? (
                <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3 rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                  <input className="bw-input" placeholder="Title" value={newSection.title} onChange={(event) => setNewSection((current) => ({ ...current, title: event.target.value }))} />
                  <textarea className="bw-input min-h-20" placeholder="Subtitle (optional)" value={newSection.subtitle} onChange={(event) => setNewSection((current) => ({ ...current, subtitle: event.target.value }))} />
                  <input type="file" accept="image/*" className="block w-full text-xs text-white/80" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    setNewSection((current) => ({ ...current, imageUrl: url }));
                  }} />
                  <div className="flex items-center gap-2">
                    <button className="rounded-full bg-white px-4 py-1.5 text-xs text-black" onClick={async () => {
                      const response = await fetch("/api/admin/home-sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSection) });
                      if (!response.ok) return;
                      setNewSection({ title: "", subtitle: "", imageUrl: "", isActive: true });
                      setIsCreateOpen(false);
                      setToast("Saved");
                      await loadAll();
                    }}>Create</button>
                    <button className="rounded-full border border-white/20 px-4 py-1.5 text-xs" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                  </div>
                </motion.article>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {sortedSections.map((section, index) => (
                <motion.article key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl border border-white/[0.08] bg-black/35 p-4">
                  <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                    <div className="relative h-28 overflow-hidden rounded-xl border border-white/[0.08]">
                      <Image src={section.imageUrl} alt={section.title} fill className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <input className="bw-input" value={section.title} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item))} />
                      <textarea className="bw-input min-h-20" value={section.subtitle ?? ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, subtitle: event.target.value } : item))} />
                      <div className="flex flex-wrap items-center gap-2">
                        <input className="bw-input w-24" type="number" value={section.order} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, order: Number(event.target.value) || 0 } : item))} />
                        <label className="flex items-center gap-2 text-xs text-white/80"><input type="checkbox" checked={section.isActive} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, isActive: event.target.checked } : item))} />Active</label>
                        <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs" onClick={() => void moveSection(section.id, -1)} disabled={index === 0}>Up</button>
                        <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs" onClick={() => void moveSection(section.id, 1)} disabled={index === sortedSections.length - 1}>Down</button>
                        <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-[#FF2E63]/70" onClick={() => void saveSection(section)}>Save</button>
                        <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-[#FF2E63]/70" onClick={async () => {
                          const response = await fetch(`/api/admin/home-sections/${section.id}`, { method: "DELETE" });
                          if (!response.ok) return;
                          setSections((current) => current.filter((item) => item.id !== section.id));
                        }}>Delete</button>
                      </div>
                      <input type="file" accept="image/*" className="block w-full text-xs text-white/80" onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        setSections((current) => current.map((item) => item.id === section.id ? { ...item, imageUrl: url } : item));
                      }} />
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
