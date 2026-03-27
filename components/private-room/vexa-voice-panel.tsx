"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VoiceStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

type VexaVoicePanelProps = {
  open: boolean;
  roomId: string | null;
  onClose: () => void;
  onStatusChange?: (status: VoiceStatus) => void;
};

const statusLabelMap: Record<VoiceStatus, string> = {
  idle: "Hold to talk",
  connecting: "Connecting...",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
  error: "Try again"
};

function buildRealtimeEvent(type: string, extra: Record<string, unknown> = {}) {
  return {
    event_id: crypto.randomUUID(),
    type,
    ...extra
  };
}

export function VexaVoicePanel({ open, roomId, onClose, onStatusChange }: VexaVoicePanelProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const microphoneTrackRef = useRef<MediaStreamTrack | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPointerDownRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  const setVoiceStatus = useCallback(
    (next: VoiceStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const cleanupRealtimeSession = useCallback(() => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    microphoneTrackRef.current?.stop();
    microphoneTrackRef.current = null;

    microphoneRef.current?.getTracks().forEach((track) => track.stop());
    microphoneRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
  }, []);

  const sendRealtimeEvent = useCallback((event: Record<string, unknown>) => {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") return;
    channel.send(JSON.stringify(event));
  }, []);

  const ensureRealtimeSession = useCallback(async () => {
    if (!roomId) {
      throw new Error("Join a room first to talk to Vexa.");
    }

    if (peerConnectionRef.current && dataChannelRef.current?.readyState === "open") {
      return;
    }

    setVoiceStatus("connecting");

    const microphone = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const track = microphone.getAudioTracks()[0];
    if (!track) {
      microphone.getTracks().forEach((streamTrack) => streamTrack.stop());
      throw new Error("No microphone track was captured.");
    }

    track.enabled = false;

    const peerConnection = new RTCPeerConnection();
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");

    audio.onplaying = () => {
      if (!isPointerDownRef.current) {
        setVoiceStatus("speaking");
      }
    };

    audio.onended = () => {
      if (!isPointerDownRef.current) {
        setVoiceStatus("idle");
      }
    };

    peerConnection.ontrack = (event) => {
      audio.srcObject = event.streams[0];
      void audio.play().catch(() => {
        // Browser autoplay policy may require user gesture; pointer down gesture retries this naturally.
      });
    };

    const dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; error?: { message?: string } };
        const type = payload.type || "";

        if (type === "response.created" || type === "response.in_progress") {
          if (!isPointerDownRef.current) {
            setVoiceStatus("thinking");
          }
          return;
        }

        if (type.includes("output_audio") || type === "response.output_item.added") {
          if (!isPointerDownRef.current) {
            setVoiceStatus("speaking");
          }
          return;
        }

        if (type === "response.done" || type === "output_audio_buffer.stopped") {
          if (!isPointerDownRef.current) {
            setVoiceStatus("idle");
          }
          return;
        }

        if (type === "error") {
          setError(payload.error?.message || "Realtime voice session returned an error.");
          setVoiceStatus("error");
        }
      } catch {
        // Non-JSON events can be safely ignored.
      }
    };

    dataChannel.onclose = () => {
      if (open) {
        setVoiceStatus("idle");
      }
    };

    peerConnection.addTrack(track, microphone);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch(`/api/private-room/vexa/realtime?roomId=${encodeURIComponent(roomId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!sdpResponse.ok) {
      const payload = (await sdpResponse.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Failed to start realtime voice session.");
    }

    const answerSdp = await sdpResponse.text();
    await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });

    peerConnectionRef.current = peerConnection;
    dataChannelRef.current = dataChannel;
    microphoneRef.current = microphone;
    microphoneTrackRef.current = track;
    remoteAudioRef.current = audio;

    setVoiceStatus("idle");
  }, [open, roomId, setVoiceStatus]);

  const startTalking = useCallback(async () => {
    if (status === "connecting") return;

    try {
      setError(null);
      await ensureRealtimeSession();

      const microphoneTrack = microphoneTrackRef.current;
      if (!microphoneTrack) {
        throw new Error("Microphone is unavailable.");
      }

      sendRealtimeEvent(buildRealtimeEvent("response.cancel"));
      microphoneTrack.enabled = true;
      isPointerDownRef.current = true;
      setVoiceStatus("listening");
    } catch (startError) {
      cleanupRealtimeSession();
      setError(startError instanceof Error ? startError.message : "Unable to start voice capture.");
      setVoiceStatus("error");
    }
  }, [cleanupRealtimeSession, ensureRealtimeSession, sendRealtimeEvent, setVoiceStatus, status]);

  const stopTalking = useCallback(() => {
    if (!isPointerDownRef.current) return;

    isPointerDownRef.current = false;

    const microphoneTrack = microphoneTrackRef.current;
    if (microphoneTrack) {
      microphoneTrack.enabled = false;
    }

    sendRealtimeEvent(buildRealtimeEvent("input_audio_buffer.commit"));
    sendRealtimeEvent(buildRealtimeEvent("response.create"));
    setVoiceStatus("thinking");
  }, [sendRealtimeEvent, setVoiceStatus]);

  useEffect(() => {
    if (!open) {
      cleanupRealtimeSession();
      setError(null);
      setVoiceStatus("idle");
    }
  }, [cleanupRealtimeSession, open, setVoiceStatus]);

  useEffect(() => {
    return () => {
      cleanupRealtimeSession();
    };
  }, [cleanupRealtimeSession]);

  const statusLabel = useMemo(() => statusLabelMap[status], [status]);
  const isPressDisabled = status === "connecting";

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
                        : status === "connecting"
                          ? "animate-pulse bg-sky-300"
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
                  void startTalking();
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  if (activePointerIdRef.current === null || event.pointerId === activePointerIdRef.current) {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    stopTalking();
                    activePointerIdRef.current = null;
                  }
                }}
                onPointerCancel={() => {
                  stopTalking();
                  activePointerIdRef.current = null;
                }}
                onLostPointerCapture={() => {
                  stopTalking();
                  activePointerIdRef.current = null;
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
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
