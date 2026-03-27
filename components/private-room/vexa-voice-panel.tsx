"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VoiceStatus = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

type VoiceApiResponse = {
  transcript?: string;
  response?: string;
  audioBase64?: string | null;
  audioMimeType?: string;
  error?: string;
  code?: string;
  stage?: string;
  debug?: Record<string, unknown>;
  warnings?: {
    tts?: {
      category?: string;
      code?: string;
      message?: string;
      retriable?: boolean;
    } | null;
  };
  tts?: {
    ready?: boolean;
    code?: string | null;
  };
};

type VexaVoicePanelProps = {
  open: boolean;
  roomId: string | null;
  onClose: () => void;
  onStatusChange?: (status: VoiceStatus) => void;
};

const statusLabelMap: Record<VoiceStatus, string> = {
  idle: "Hold to talk",
  listening: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  speaking: "Speaking...",
  error: "Try again"
};

const ttsWarningMessageMap: Record<string, string> = {
  TTS_CONFIG: "Voice generation is not configured yet. Please contact support.",
  TTS_AUTH: "Voice generation authentication failed on the server.",
  TTS_INVALID_VOICE: "The configured voice is unavailable right now.",
  TTS_INVALID_MODEL: "The configured voice model is unavailable right now.",
  TTS_INVALID_OUTPUT_FORMAT: "The voice output format is not supported right now.",
  TTS_UNSUPPORTED_REQUEST: "Voice generation request was rejected. Please retry.",
  TTS_TIMEOUT: "Voice generation timed out. Please retry.",
  TTS_NETWORK: "Network issue while generating voice. Please retry.",
  TTS_EMPTY_AUDIO: "Voice generation returned empty audio.",
  TTS_BAD_CONTENT_TYPE: "Voice generation returned an unexpected response.",
  TTS_PROVIDER_UNAVAILABLE: "Voice generation service is temporarily unavailable.",
  TTS_FAILED: "Voice generation is unavailable right now.",
  TTS_PRIMARY_MODEL_FALLBACK: "Voice generated using fallback model."
};

function preferredMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return mimeTypes.find((value) => MediaRecorder.isTypeSupported(value));
}

export function VexaVoicePanel({ open, roomId, onClose, onStatusChange }: VexaVoicePanelProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordStartAtRef = useRef<number>(0);
  const activePressRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);
  const thinkingTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const setVoiceStatus = useCallback(
    (next: VoiceStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const resetThinkingTimer = useCallback(() => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (status === "transcribing" || status === "thinking" || status === "speaking" || activePressRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      setVoiceStatus("error");
      return;
    }

    try {
      setError(null);
      setTranscript("");
      setResponseText("");
      clearAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream, preferredMimeType() ? { mimeType: preferredMimeType() } : undefined);

      chunksRef.current = [];
      recorderRef.current = recorder;
      streamRef.current = stream;
      activePressRef.current = true;
      recordStartAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(180);
      setVoiceStatus("listening");
    } catch (captureError) {
      stopTracks();
      const message = captureError instanceof Error ? captureError.message : "Microphone unavailable.";
      const lower = message.toLowerCase();
      const permissionBlocked =
        (captureError instanceof DOMException && captureError.name === "NotAllowedError") ||
        lower.includes("permission") ||
        lower.includes("denied");
      setError(
        permissionBlocked
          ? "Microphone permission is blocked. Enable mic access and try again."
          : "Unable to start your microphone right now."
      );
      setVoiceStatus("error");
      activePressRef.current = false;
    }
  }, [clearAudio, setVoiceStatus, status, stopTracks]);

  const playAudio = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      clearAudio();
      const normalizedMimeType = mimeType || "audio/mpeg";
      const playableBlob = audioBlob.type === normalizedMimeType ? audioBlob : new Blob([audioBlob], { type: normalizedMimeType });
      const url = URL.createObjectURL(playableBlob);
      audioUrlRef.current = url;

      const audio = document.createElement("audio");
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.src = url;
      audioRef.current = audio;

      audio.onended = () => {
        setVoiceStatus("idle");
      };

      audio.onerror = () => {
        setError("I replied, but playback failed. You can still read the response below.");
        setVoiceStatus("idle");
      };

      setVoiceStatus("speaking");
      audio.load();

      try {
        await audio.play();
      } catch (playbackError) {
        const message = playbackError instanceof Error ? playbackError.message.toLowerCase() : "";
        const isGestureIssue = message.includes("gesture") || message.includes("user") || message.includes("notallowed");
        setError(
          isGestureIssue
            ? "Playback was blocked by the browser. Tap and hold to speak again, then allow audio playback."
            : "I replied, but playback failed. You can still read the response below."
        );
        setVoiceStatus("idle");
      }
    },
    [clearAudio, setVoiceStatus]
  );

  const processRecording = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!roomId) {
        setError("Join a room first to talk to Vexa.");
        setVoiceStatus("error");
        return;
      }

      if (durationMs < 550 || blob.size < 2500) {
        setError("That was too short. Hold to talk for a moment longer, then release.");
        setVoiceStatus("error");
        return;
      }

      setVoiceStatus("transcribing");
      resetThinkingTimer();
      thinkingTimerRef.current = window.setTimeout(() => {
        setStatus((current) => {
          if (current === "transcribing") {
            onStatusChange?.("thinking");
            return "thinking";
          }
          return current;
        });
      }, 1000);

      try {
        const form = new FormData();
        const mimeType = blob.type || "audio/webm";
        const fileExtension = mimeType.includes("mp4") ? "m4a" : "webm";
        form.append("roomId", roomId);
        form.append("audio", new File([blob], `vexa-ptt.${fileExtension}`, { type: mimeType }));

        const response = await fetch("/api/private-room/vexa/voice", {
          method: "POST",
          body: form
        });

        const data = (await response.json().catch(() => ({}))) as VoiceApiResponse;

        if (!response.ok) {
          if (data.code === "RECORDING_TOO_SHORT") {
            throw new Error("I couldn't hear enough audio. Hold to talk a little longer and retry.");
          }
          if (data.code === "TRANSCRIPTION_TIMEOUT") {
            throw new Error("Transcription timed out. Please try again.");
          }
          if (data.code === "OPENAI_CONFIG") {
            throw new Error("Voice transcription is not configured yet. Please contact support.");
          }
          if (data.code === "OPENAI_AUTH") {
            throw new Error("Voice transcription auth failed on the server. Please contact support.");
          }
          if (data.code === "UNSUPPORTED_AUDIO_FORMAT") {
            throw new Error("Your browser recorded an unsupported format. Try the latest Safari or Chrome.");
          }
          if (data.code === "NETWORK") {
            throw new Error("Network issue while transcribing. Check your connection and retry.");
          }
          if (data.code === "PROVIDER_UNAVAILABLE") {
            throw new Error("Transcription provider is temporarily unavailable. Please retry.");
          }
          throw new Error(data.error || "Voice request failed.");
        }

        const transcriptText = data.transcript?.trim() || "";
        const responseValue = data.response?.trim() || "";

        setTranscript(transcriptText);
        setResponseText(responseValue);

        if (!data.audioBase64) {
          const ttsCode = data.warnings?.tts?.code || data.tts?.code || "";
          const fallbackMessage =
            data.warnings?.tts?.message ||
            ttsWarningMessageMap[ttsCode] ||
            "Vexa replied in text, but voice generation is unavailable right now.";
          setError(fallbackMessage);
          setVoiceStatus("idle");
          return;
        }

        let bytes: Uint8Array;
        try {
          const binary = atob(data.audioBase64);
          bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
        } catch {
          throw new Error("Received invalid voice audio data.");
        }

        if (!bytes.length) {
          throw new Error("Received empty voice audio.");
        }

        const audioMimeType = data.audioMimeType || "audio/mpeg";
        const audioBlob = new Blob([bytes], { type: audioMimeType });
        await playAudio(audioBlob, audioMimeType);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to process voice right now.");
        setVoiceStatus("error");
      } finally {
        resetThinkingTimer();
      }
    },
    [onStatusChange, playAudio, resetThinkingTimer, roomId, setVoiceStatus]
  );

  const stopRecording = useCallback(async () => {
    if (!activePressRef.current || !recorderRef.current || isStoppingRef.current) return;

    isStoppingRef.current = true;
    activePressRef.current = false;

    const recorder = recorderRef.current;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        resolve();
      };
      recorder.stop();
    });

    recorderRef.current = null;
    stopTracks();

    const recordedBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    chunksRef.current = [];

    const durationMs = Date.now() - recordStartAtRef.current;
    try {
      await processRecording(recordedBlob, durationMs);
    } finally {
      isStoppingRef.current = false;
      activePointerIdRef.current = null;
    }
  }, [processRecording, stopTracks]);

  useEffect(() => {
    if (!open) {
      activePressRef.current = false;
      recorderRef.current?.stop();
      recorderRef.current = null;
      stopTracks();
      clearAudio();
      resetThinkingTimer();
      setError(null);
      setTranscript("");
      setResponseText("");
      setVoiceStatus("idle");
      activePointerIdRef.current = null;
      isStoppingRef.current = false;
    }
  }, [clearAudio, open, resetThinkingTimer, setVoiceStatus, stopTracks]);

  useEffect(() => {
    return () => {
      stopTracks();
      clearAudio();
      resetThinkingTimer();
    };
  }, [clearAudio, resetThinkingTimer, stopTracks]);

  const statusLabel = useMemo(() => statusLabelMap[status], [status]);
  const isPressDisabled = status === "transcribing" || status === "thinking";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-white/10 bg-[#09090b] p-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#d58aa0]">Vexa voice</p>
                <h3 className="text-base font-semibold text-white">Press & hold to talk</h3>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/70">
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-white/65">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "listening"
                    ? "animate-pulse bg-emerald-300"
                    : status === "speaking"
                      ? "animate-pulse bg-[#d58aa0]"
                      : status === "error"
                        ? "bg-rose-300"
                        : "bg-white/40"
                }`}
              />
              {statusLabel}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={isPressDisabled}
                onPointerDown={(event) => {
                  event.preventDefault();
                  activePointerIdRef.current = event.pointerId;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  void startRecording();
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  if (activePointerIdRef.current === null || event.pointerId === activePointerIdRef.current) {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    void stopRecording();
                  }
                }}
                onPointerCancel={() => void stopRecording()}
                onPointerLeave={() => undefined}
                onLostPointerCapture={() => {
                  if (activePressRef.current) {
                    void stopRecording();
                  }
                }}
                className={`relative h-24 w-24 touch-none rounded-full border text-xs font-semibold transition ${
                  status === "listening"
                    ? "scale-105 border-emerald-300/70 bg-emerald-300/20 text-emerald-100"
                    : "border-[#d58aa0]/50 bg-[#1a1115] text-[#f1bdd0]"
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                <span className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
                <span className="relative z-10">Hold to Talk</span>
              </button>
            </div>

            {error ? <p className="mt-3 text-center text-xs text-rose-300">{error}</p> : null}

            {(transcript || responseText) && (
              <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                {transcript ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">You said</p>
                    <p className="mt-1 text-sm text-white/90">{transcript}</p>
                  </div>
                ) : null}
                {responseText ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#d58aa0]/90">Vexa</p>
                    <p className="mt-1 text-sm text-white/90">{responseText}</p>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
