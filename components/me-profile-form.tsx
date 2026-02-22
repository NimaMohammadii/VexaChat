"use client";

import { ChangeEvent, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { previewUrl, processImageFile } from "@/lib/image-processing";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extensionFromFile(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();

  if (fileNameExtension) {
    return fileNameExtension;
  }

  const mimeExtension = file.type.split("/").pop()?.toLowerCase();
  return mimeExtension || "png";
}

export function MeProfileForm({ data }: { data: MeData }) {
  const [name, setName] = useState(data.profile?.name ?? data.user.name ?? "");
  const [username, setUsername] = useState(data.profile?.username ?? "");
  const [bio, setBio] = useState(data.profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(data.profile?.avatarUrl ?? data.user.avatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const onAvatarFileSelected = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("Please upload an image file.");
      return;
    }

    setIsUploadingAvatar(true);
    setStatus(null);

    try {
      const processedFile = await processImageFile(file, { maxWidth: 1024, quality: 0.8, cropAspect: "square" });
      if (processedFile.size > MAX_FILE_SIZE) {
        setStatus("Processed image must be 5MB or less.");
        return;
      }
      setAvatarPreview(previewUrl(processedFile));
      const supabase = createSupabaseClient();
      const ext = extensionFromFile(processedFile);
      const userId = data.user.id;

      const { data: existing, error: listError } = await supabase.storage.from("avatars").list(userId, { limit: 100 });

      if (listError) {
        setStatus(listError.message || "Unable to prepare avatar upload.");
        return;
      }

      const paths = (existing ?? []).map((f) => `${userId}/${f.name}`);

      if (paths.length) {
        const { error: removeError } = await supabase.storage.from("avatars").remove(paths);

        if (removeError) {
          setStatus(removeError.message || "Unable to replace existing avatar.");
          return;
        }
      }

      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, processedFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: processedFile.type
      });

      if (uploadError) {
        setStatus(uploadError.message || "Unable to upload avatar.");
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const nextPublicUrl = `${publicUrl}?v=${Date.now()}`;

      const profileResponse = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ avatarUrl: nextPublicUrl })
      });

      const profileResult = (await profileResponse.json()) as { error?: string; profile?: { avatarUrl: string } };

      if (!profileResponse.ok) {
        setStatus(profileResult.error ?? "Unable to update avatar.");
        return;
      }

      const nextAvatarUrl = profileResult.profile?.avatarUrl ?? nextPublicUrl;
      setAvatarUrl(nextAvatarUrl);
      window.dispatchEvent(new CustomEvent("profile-avatar-updated", { detail: { avatarUrl: nextAvatarUrl } }));
      setStatus("Avatar uploaded.");
    } catch (_error) {
      setStatus("Unable to upload avatar right now.");
    } finally {
      setIsUploadingAvatar(false);
      if (deviceFileInputRef.current) {
        deviceFileInputRef.current.value = "";
      }

      if (cameraFileInputRef.current) {
        cameraFileInputRef.current.value = "";
      }
    }
  };

  const onAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    void onAvatarFileSelected(file);
  };

  return (
    <div className="bw-card mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-4 border-b border-line pb-5">
        {(avatarPreview || avatarUrl) ? (
          <img src={avatarPreview || avatarUrl} alt={shownName} className="h-14 w-14 rounded-full object-cover" />
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
        <div className="space-y-2 text-sm">
          <span>Avatar</span>
          <div className="flex flex-wrap gap-2">
            <input
              ref={deviceFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarFileChange}
              disabled={isUploadingAvatar}
            />
            <button
              type="button"
              className="bw-button-muted"
              onClick={() => deviceFileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              Upload from device
            </button>

            <input
              ref={cameraFileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={onAvatarFileChange}
              disabled={isUploadingAvatar}
            />
            <button
              type="button"
              className="bw-button-muted"
              onClick={() => cameraFileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              Take photo
            </button>
          </div>
          <p className="text-xs text-white/60">Upload a JPG/PNG/WebP image up to 5MB.</p>
        </div>

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
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/80">{status ?? ""}</p>
        <button type="button" onClick={() => void onSave()} className="bw-button" disabled={isSaving || isUploadingAvatar}>
          {isSaving ? "Saving..." : isUploadingAvatar ? "Uploading..." : "Save"}
        </button>
      </div>
    </div>
  );
}
