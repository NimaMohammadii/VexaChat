"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { previewUrl, processImageFile } from "@/lib/image-processing";

type VerificationRequest = {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  docUrls: string[];
  note: string | null;
};

const MAX_DOCS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const transition = { type: "spring", stiffness: 320, damping: 28 };

export default function VerificationWizardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const meResponse = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
      if (!meResponse || !meResponse.ok) {
        setStatus("Please sign in to continue.");
        setLoading(false);
        return;
      }

      const mePayload = (await meResponse.json()) as { user: { id: string } };
      setUserId(mePayload.user.id);

      const response = await fetch("/api/me/verification", { cache: "no-store" }).catch(() => null);
      if (response && response.ok) {
        const payload = (await response.json()) as { request: VerificationRequest | null };
        setRequest(payload.request);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const selectedLabel = useMemo(() => `${selectedFiles.length}/${MAX_DOCS} selected`, [selectedFiles.length]);
  const pendingExists = request?.status === "pending";

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    if (files.length > MAX_DOCS) {
      setStatus(`You can upload up to ${MAX_DOCS} images.`);
      event.target.value = "";
      return;
    }

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setStatus("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    Promise.all(files.map((file) => processImageFile(file, { maxWidth: 1024, quality: 0.8, cropAspect: "none" })))
      .then((processed) => {
        if (processed.some((file) => file.size > MAX_FILE_SIZE)) {
          setStatus("Each processed image must be <= 5MB.");
          return;
        }
        setSelectedFiles(processed);
        setPreviewImages(processed.map((file) => previewUrl(file)));
      })
      .catch(() => setStatus("Unable to process files."));
    setStatus(`${files.length} image(s) ready for review.`);
  };

  const onSubmit = async () => {
    if (!userId) {
      setStatus("Please sign in again.");
      return;
    }

    if (pendingExists) {
      setStatus("You already have a pending request.");
      return;
    }

    if (selectedFiles.length === 0) {
      setStatus("Please select at least one image.");
      return;
    }

    setSubmitting(true);
    setStatus("Uploading verification images...");

    const supabase = createSupabaseClient();
    const requestId = crypto.randomUUID();
    const uploadedPaths: string[] = [];

    try {
      const docUrls: string[] = [];
      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${requestId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("verification-docs").upload(path, file, {
          upsert: false,
          contentType: file.type
        });

        if (error) {
          throw new Error(error.message);
        }

        uploadedPaths.push(path);
        const { data } = supabase.storage.from("verification-docs").getPublicUrl(path);
        docUrls.push(data.publicUrl);
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

      setRequest(payload.request);
      setStep(4);
      setSelectedFiles([]);
      setStatus("Pending review.");
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("verification-docs").remove(uploadedPaths);
      }
      setStatus(error instanceof Error ? error.message : "Failed to submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10"><p className="text-sm text-white/70">Loading verification wizard...</p></main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Identity Verification</h1>
        <Link href="/me" className="bw-button-muted">Back</Link>
      </div>

      <section className="bw-card min-h-[360px] overflow-hidden p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={transition}
            className="space-y-4"
          >
            {step === 1 ? (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Step 1 of 4</p>
                <h2 className="text-xl font-semibold">Before you upload</h2>
                <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
                  <li>Accepted: Government ID, passport, or driver license image.</li>
                  <li>Up to {MAX_DOCS} files total.</li>
                  <li>Each file must be an image and 5MB or less.</li>
                </ul>
                <button type="button" className="bw-button" onClick={() => setStep(2)}>Continue</button>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Step 2 of 4</p>
                <h2 className="text-xl font-semibold">Upload verification images</h2>
                {pendingExists ? <p className="text-sm text-amber-300">You already have a pending request. Please wait for review.</p> : null}
                <div className="rounded-xl border border-line p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Documents</p>
                    <span className="text-xs text-white/60">{selectedLabel}</span>
                  </div>
                  <input ref={deviceFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} disabled={pendingExists || submitting} />
                  <input ref={cameraFileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFilesSelected} disabled={pendingExists || submitting} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="bw-button-muted" onClick={() => deviceFileInputRef.current?.click()} disabled={pendingExists || submitting}>Upload from gallery/files</button>
                    <button type="button" className="bw-button-muted" onClick={() => cameraFileInputRef.current?.click()} disabled={pendingExists || submitting}>Take photo</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="bw-button-muted" onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="bw-button" onClick={() => setStep(3)} disabled={pendingExists || selectedFiles.length === 0}>Review</button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Step 3 of 4</p>
                <h2 className="text-xl font-semibold">Review and submit</h2>
                <ul className="space-y-2 text-sm text-white/80">
                  {previewImages.map((src, idx) => (<li key={src} className="rounded-lg border border-line p-2"><img src={src} alt={`Doc preview ${idx + 1}`} className="h-24 w-auto rounded" /></li>))}
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`} className="rounded-lg border border-line px-3 py-2">{file.name}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button type="button" className="bw-button-muted" onClick={() => setStep(2)} disabled={submitting}>Back</button>
                  <button type="button" className="bw-button" onClick={onSubmit} disabled={submitting || pendingExists}>{submitting ? "Submitting..." : "Submit verification"}</button>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Step 4 of 4</p>
                <h2 className="text-xl font-semibold">Submitted</h2>
                <p className="text-sm text-emerald-300">Your verification is pending review.</p>
                <Link href="/me" className="bw-button inline-flex">Back to /me</Link>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>

      {request?.status ? <p className="text-sm text-white/70">Current status: {request.status}</p> : null}
      {status ? <p className="text-sm text-white/70">{status}</p> : null}
      {request?.note ? <p className="text-sm text-white/70">Admin note: {request.note}</p> : null}
    </main>
  );
}
