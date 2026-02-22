"use client";

import { useEffect, useState } from "react";

type VerificationRequest = {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  docUrls: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
  userProfile: {
    userId: string;
    name: string;
    username: string;
  } | null;
};

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState<"loading" | "forbidden" | "error" | "ready">("loading");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/verifications", { cache: "no-store" }).catch(() => null);

    if (!response) {
      setStatus("error");
      return;
    }

    if (response.status === 403) {
      setStatus("forbidden");
      return;
    }

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const payload = (await response.json()) as { verifications: VerificationRequest[] };
    setItems(payload.verifications);
    setStatus("ready");
  };

  useEffect(() => {
    void load();
  }, []);

  const onAction = async (id: string, action: "approve" | "reject") => {
    setActingId(id);

    const response = await fetch(`/api/admin/verifications/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: notes[id] ?? "" })
    }).catch(() => null);

    setActingId(null);

    if (response?.ok) {
      void load();
    }
  };

  if (status === "loading") {
    return <p className="text-sm text-white/70">Loading verification requests…</p>;
  }

  if (status === "forbidden") {
    return <p className="text-sm text-red-300">Forbidden. Login as admin to review verifications.</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-red-300">Unable to load verification requests right now.</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Identity Verification Requests</h1>
      {items.length === 0 ? <p className="text-sm text-white/70">No verification requests yet.</p> : null}
      {items.map((item) => (
        <article key={item.id} className="bw-card space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{item.userProfile?.name || item.userProfile?.username || "User"}</p>
              <p className="text-sm text-white/70">User ID: {item.userId}</p>
              <p className="text-xs text-white/55">Submitted: {new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${
              item.status === "approved"
                ? "border border-emerald-400/60 text-emerald-300"
                : item.status === "rejected"
                  ? "border border-red-400/60 text-red-300"
                  : "border border-amber-400/60 text-amber-300"
            }`}>
              {item.status}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {item.docUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-line p-3 text-sm text-cyan-300 underline underline-offset-2">
                {url}
              </a>
            ))}
          </div>

          <textarea
            className="bw-input min-h-20"
            placeholder="Optional admin note"
            value={notes[item.id] ?? item.note ?? ""}
            onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
          />

          <div className="flex gap-2">
            <button type="button" className="bw-button" disabled={actingId === item.id} onClick={() => onAction(item.id, "approve")}>Approve</button>
            <button type="button" className="bw-button-muted" disabled={actingId === item.id} onClick={() => onAction(item.id, "reject")}>Reject</button>
          </div>
        </article>
      ))}
    </section>
  );
}
