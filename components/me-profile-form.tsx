"use client";

import { useState } from "react";

type MeData = {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  profile: {
    name: string;
    username: string;
    bio: string;
    avatarUrl: string;
  } | null;
};

function initial(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "U";
}

export function MeProfileForm({ data }: { data: MeData }) {
  const [name, setName] = useState(data.profile?.name ?? data.user.name ?? "");
  const [username, setUsername] = useState(data.profile?.username ?? "");
  const [bio, setBio] = useState(data.profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(data.profile?.avatarUrl ?? data.user.avatarUrl ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const shownName = name || data.user.email;

  const onSave = async () => {
    setIsSaving(true);
    setStatus(null);

    const response = await fetch("/api/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        username,
        bio,
        avatarUrl
      })
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(result.error ?? "Unable to save profile.");
      setIsSaving(false);
      return;
    }

    setStatus("Profile saved.");
    setIsSaving(false);
  };

  return (
    <div className="bw-card mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-4 border-b border-line pb-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={shownName} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-paper">
            {initial(shownName)}
          </div>
        )}
        <div>
          <p className="text-sm text-white/70">Signed in as</p>
          <p className="text-sm font-medium text-paper">{data.user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="space-y-2 text-sm">
          <span>Name</span>
          <input className="bw-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label className="space-y-2 text-sm">
          <span>Username</span>
          <input
            className="bw-input"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            required
          />
          <p className="text-xs text-white/60">Lowercase only. This must be unique.</p>
        </label>

        <label className="space-y-2 text-sm">
          <span>Bio</span>
          <textarea className="bw-input min-h-28" value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>

        <label className="space-y-2 text-sm">
          <span>Avatar URL</span>
          <input className="bw-input" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/80">{status ?? ""}</p>
        <button type="button" onClick={() => void onSave()} className="bw-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
