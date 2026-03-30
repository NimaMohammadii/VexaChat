“use client”;

import { AnimatePresence, motion } from “framer-motion”;
import { useEffect, useMemo, useRef, useState } from “react”;

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
continuous?: boolean;
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
const [prompt, setPrompt] = useState(””);
const [listening, setListening] = useState(false);
const [responding, setResponding] = useState(false);
const [autoSpeak, setAutoSpeak] = useState(true);
const [speechError, setSpeechError] = useState<string | null>(null);
const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

const speechSupported = useMemo(() => {
if (typeof window === “undefined”) return false;
const speechWindow = window as SpeechWindow;
return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
}, []);

useEffect(() => {
if (!open || !speechSupported || recognitionRef.current) return;

```
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
  setSpeechError("Voice capture failed. You can still type your message.");
  setListening(false);
};

recognition.onend = () => setListening(false);
recognitionRef.current = recognition;
```

}, [open, speechSupported]);

useEffect(() => {
if (!open) {
setPrompt(””);
setListening(false);
setResponding(false);
setSpeechError(null);
recognitionRef.current?.stop();
if (typeof window !== “undefined”) window.speechSynthesis?.cancel();
}
}, [open]);

useEffect(() => {
if (!response || !open) return;
setResponding(true);
const timer = window.setTimeout(() => setResponding(false), 1200);

```
if (autoSpeak && typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(response);
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

return () => window.clearTimeout(timer);
```

}, [autoSpeak, open, response]);

const toggleListening = () => {
if (!recognitionRef.current) return;

```
if (listening) {
  recognitionRef.current.stop();
  setListening(false);
  return;
}

setSpeechError(null);
setListening(true);
recognitionRef.current.start();
```

};

const submit = async () => {
if (!prompt.trim() || loading) return;
await onSubmit(prompt.trim());
};

const statusLabel = listening ? “Listening” : loading ? “Thinking” : responding ? “Responding” : “Ready”;

return (
<AnimatePresence>
{open ? (
<>
<motion.div className=“fixed inset-0 z-40 bg-black/70” initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
<motion.div
className=“fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-white/10 bg-[#09090b] p-4”
initial={{ y: “100%” }}
animate={{ y: 0 }}
exit={{ y: “100%” }}
transition={{ duration: 0.25 }}
>
<div className="flex items-center justify-between">
<div>
<p className="text-[10px] uppercase tracking-[0.18em] text-[#d58aa0]">Vexa live</p>
<h3 className="text-base font-semibold text-white">Talk to Vexa</h3>
</div>
<button type="button" onClick={onClose} className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/70">
Close
</button>
</div>

```
        <div className="mt-3 flex items-center gap-2 text-[11px] text-white/65">
          <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-[#d58aa0]" : listening ? "bg-emerald-300" : "bg-white/40"}`} />
          {statusLabel}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Say or type: summarize this, suggest a reply, explain quickly..."
          className="mt-3 h-24 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/40"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void submit()} disabled={loading || !prompt.trim()} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">
            {loading ? "Thinking…" : "Ask Vexa"}
          </button>
          {speechSupported ? (
            <button type="button" onClick={toggleListening} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/85">
              {listening ? "Stop" : "Voice"}
            </button>
          ) : (
            <span className="text-xs text-white/45">Voice input unsupported in this browser.</span>
          )}
          <button
            type="button"
            onClick={() => setAutoSpeak((current) => !current)}
            className={`rounded-full border px-3 py-2 text-xs ${autoSpeak ? "border-[#d58aa0]/70 text-[#efb3c3]" : "border-white/20 text-white/70"}`}
          >
            Auto voice {autoSpeak ? "On" : "Off"}
          </button>
        </div>

        {speechError ? <p className="mt-3 text-xs text-rose-300">{speechError}</p> : null}
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        {response ? <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/90">{response}</p> : null}
      </motion.div>
    </>
  ) : null}
</AnimatePresence>
```

);
}
