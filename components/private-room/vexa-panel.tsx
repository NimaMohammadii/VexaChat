"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type VexaPanelProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  response: string;
  error: string | null;
  onSubmit: (prompt: string) => Promise<void>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
};

export function VexaPanel({ open, onClose, loading, response, error, onSubmit }: VexaPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const speechWindow = window as SpeechWindow;
    return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    if (!open || !speechSupported || recognitionRef.current) return;

    const speechWindow = window as SpeechWindow;
    const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setPrompt(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setSpeechError("Voice input failed. You can still type your question.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [open, speechSupported]);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setListening(false);
      setSpeechError(null);
      recognitionRef.current?.stop();
    }
  }, [open]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setSpeechError(null);
    setListening(true);
    recognitionRef.current.start();
  };

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    await onSubmit(prompt.trim());
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-white/10 bg-[#09090b] p-5" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.25 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d58aa0]">Vexa in room</p>
                <h3 className="text-lg font-semibold text-white">Ask Vexa</h3>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">Close</button>
            </div>

            <p className="mt-3 text-xs text-white/55">Status: {loading ? "Thinking…" : listening ? "Listening…" : "Ready"}</p>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask for a summary, idea, or quick answer..."
              className="mt-3 h-24 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/40"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void submit()} disabled={loading || !prompt.trim()} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">
                {loading ? "Vexa thinking…" : "Send"}
              </button>
              {speechSupported ? (
                <button type="button" onClick={toggleListening} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/85">
                  {listening ? "Stop Voice" : "Voice Input"}
                </button>
              ) : (
                <span className="text-xs text-white/45">Voice input not supported in this browser.</span>
              )}
            </div>

            {speechError ? <p className="mt-3 text-xs text-rose-300">{speechError}</p> : null}
            {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
            {response ? <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/90">{response}</p> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
