"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MeProfileForm } from "@/components/me-profile-form";
import { createSupabaseClient } from "@/lib/supabase-client";

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
    identityVerified?: boolean;
    identityStatus?: string;
  } | null;
};

type OwnedProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  price: number;
  verified: boolean;
  imageUrl: string;
  images: string[];
  createdAt: string;
};

type VerificationRequest = {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  docUrls: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

const MAX_DOCS = 3;

const statusLabel: Record<string, string> = {
  none: "Not submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthorized" | "error" | "ready">("loading");
  const [myProfiles, setMyProfiles] = useState<OwnedProfile[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const loadMyProfiles = async () => {
    const response = await fetch("/api/me/profiles", { cache: "no-store" }).catch(() => null);

    if (!response || response.status === 401 || !response.ok) {
      setMyProfiles([]);
      return;
    }

    const payload = (await response.json()) as { profiles: OwnedProfile[] };
    setMyProfiles(payload.profiles);
  };

  const loadVerification = async () => {
    const response = await fetch("/api/me/verification", { cache: "no-store" }).catch(() => null);
    if (!response || response.status === 401 || !response.ok) {
      setVerificationRequest(null);
      return;
    }

    const payload = (await response.json()) as { request: VerificationRequest | null };
    setVerificationRequest(payload.request);
  };

  const onDeleteProfile = async (profile: OwnedProfile) => {
    const shouldDelete = window.confirm(`Delete ${profile.name}? This also removes all uploaded profile images.`);
    if (!shouldDelete) {
      return;
    }

    setDeletingId(profile.id);
    setActionStatus(null);

    const response = await fetch(`/api/me/profiles/${profile.id}`, {
      method: "DELETE"
    }).catch(() => null);

    if (!response || !response.ok) {
      const payload = response ? ((await response.json()) as { error?: string }) : null;
      setActionStatus(payload?.error ?? "Unable to delete this profile right now.");
      setDeletingId(null);
      return;
    }

    setActionStatus("Profile deleted.");
    setDeletingId(null);
    await loadMyProfiles();
  };

  const onSelectVerificationFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    if (files.length > MAX_DOCS) {
      setVerificationStatus(`You can upload up to ${MAX_DOCS} documents.`);
      setSelectedFiles([]);
      event.target.value = "";
      return;
    }

    const oversized = files.find((file) => file.size > 8 * 1024 * 1024);
    if (oversized) {
      setVerificationStatus("Each document must be 8MB or less.");
      setSelectedFiles([]);
      event.target.value = "";
      return;
    }

    setSelectedFiles(files);
    setVerificationStatus(`${files.length} file(s) selected.`);
  };

  const onSubmitVerification = async () => {
    if (!data?.user.id) {
      setVerificationStatus("Please sign in again.");
      return;
    }

    if (selectedFiles.length === 0) {
      setVerificationStatus("Please select at least one document.");
      return;
    }

    setSubmittingVerification(true);
    setVerificationStatus("Uploading verification documents...");

    const supabase = createSupabaseClient();
    const requestId = verificationRequest?.status === "pending" ? verificationRequest.id : crypto.randomUUID();
    const uploadedPaths: string[] = [];

    try {
      const docUrls: string[] = [];

      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${data.user.id}/${requestId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("verification-docs").upload(path, file, { upsert: false });

        if (error) {
          throw new Error(error.message);
        }

        uploadedPaths.push(path);
        const { data: publicData } = supabase.storage.from("verification-docs").getPublicUrl(path);
        docUrls.push(publicData.publicUrl);
      }

      const response = await fetch("/api/me/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, docUrls })
      });

      const payload = (await response.json()) as { error?: string; request?: VerificationRequest };

      if (!response.ok || !payload.request) {
        throw new Error(payload.error ?? "Unable to submit verification request.");
      }

      setVerificationRequest(payload.request);
      setSelectedFiles([]);
      setVerificationStatus("Verification request submitted.");
      await loadVerification();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("verification-docs").remove(uploadedPaths);
      }

      setVerificationStatus(error instanceof Error ? error.message : "Failed to submit verification.");
    } finally {
      setSubmittingVerification(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/me", { cache: "no-store" }).catch(() => null);

      if (!response || response.status === 401) {
        setStatus("unauthorized");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const payload = (await response.json()) as MeData;
      setData(payload);
      setStatus("ready");
      void loadMyProfiles();
      void loadVerification();
    };

    void load();
  }, []);

  if (status !== "ready" || !data) {
    return <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10"><p className="text-sm text-white/70">{status === "loading" ? "Loading profile..." : "Please sign in to continue."}</p></main>;
  }

  const hasProfile = myProfiles.length > 0;
  const currentVerificationStatus = verificationRequest?.status ?? data.profile?.identityStatus ?? "none";
  const canSubmitVerification = verificationRequest?.status !== "approved";
  const docUrls = Array.isArray(verificationRequest?.docUrls) ? verificationRequest?.docUrls : [];
  const pendingReplacement = verificationRequest?.status === "pending";
  const selectedFilesLabel = useMemo(() => `${selectedFiles.length}/${MAX_DOCS} selected`, [selectedFiles.length]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Link href="/" className="bw-button-muted">Home</Link>
      </div>

      <MeProfileForm data={data} />

      <section className="bw-card space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Identity Verification</h2>
          <span className={`rounded-full px-3 py-1 text-xs ${
            currentVerificationStatus === "approved"
              ? "border border-emerald-400/60 text-emerald-300"
              : currentVerificationStatus === "rejected"
                ? "border border-red-400/60 text-red-300"
                : currentVerificationStatus === "pending"
                  ? "border border-amber-400/60 text-amber-300"
                  : "border border-line text-white/70"
          }`}>
            {statusLabel[currentVerificationStatus] ?? "Not submitted"}
          </span>
        </div>

        <p className="text-sm text-white/70">Upload government ID or similar proof. We accept up to {MAX_DOCS} files per request.</p>

        {docUrls.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Submitted documents</p>
            <ul className="space-y-2">
              {docUrls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 underline underline-offset-2">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {canSubmitVerification ? (
          <div className="space-y-3 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{pendingReplacement ? "Replace pending documents" : "Submit documents"}</p>
              <span className="text-xs text-white/60">{selectedFilesLabel}</span>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              multiple
              className="bw-input"
              onChange={onSelectVerificationFiles}
              disabled={submittingVerification}
            />
            <button type="button" className="bw-button" onClick={onSubmitVerification} disabled={submittingVerification || selectedFiles.length === 0}>
              {submittingVerification ? "Submitting..." : pendingReplacement ? "Update Pending Request" : "Submit Verification"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-emerald-300">Your identity is already approved.</p>
        )}

        {verificationStatus ? <p className="text-sm text-white/70">{verificationStatus}</p> : null}
        {verificationRequest?.note ? <p className="text-sm text-white/70">Admin note: {verificationRequest.note}</p> : null}
      </section>

      {hasProfile ? (
        <section className="bw-card rounded-2xl border border-dashed border-line/80 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Home Profiles</p>
          <p className="mt-2 text-sm text-amber-300">You already have one profile. Only one profile is allowed per account.</p>
        </section>
      ) : (
        <Link href="/me/create-profile" className="bw-card block rounded-2xl border border-dashed border-paper/30 p-6 transition hover:border-paper/70 hover:bg-white/5 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Home Profiles</p>
          <h2 className="mt-2 text-xl font-semibold">Create a Profile</h2>
          <p className="mt-2 text-sm text-white/70">Start the submission flow. Your profile stays pending until an admin verifies it.</p>
          <span className="mt-4 inline-flex rounded-lg border border-line px-3 py-2 text-sm">Open create flow →</span>
        </Link>
      )}

      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">My Profiles</h2>
        {myProfiles.length === 0 ? <p className="text-sm text-white/70">You have not created any profiles yet.</p> : null}
        {actionStatus ? <p className="text-sm text-white/70">{actionStatus}</p> : null}
        <ul className="space-y-3">
          {myProfiles.map((profile) => {
            const previewImage = profile.images[0] || profile.imageUrl || "";
            return (
              <li key={profile.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-black/30">
                    {previewImage ? <Image src={previewImage} alt={profile.name} fill className="object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-sm text-white/70">{profile.city} · ${profile.price}/hr</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs ${profile.verified ? "border border-emerald-400/60 text-emerald-300" : "border border-amber-400/60 text-amber-300"}`}>
                      {profile.verified ? "Verified" : "Pending verification"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${profile.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line/80 text-sm text-white/70 transition hover:border-red-400/70 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => onDeleteProfile(profile)}
                      disabled={deletingId === profile.id}
                    >
                      {deletingId === profile.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
