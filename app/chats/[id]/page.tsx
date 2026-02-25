"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { compressChatImage, validateVideo } from "@/lib/chat-media-client";

type ChatMedia = { id: string; type: "image" | "video"; url: string; expiresAt: string };
type ChatMessage = { id: string; senderId: string; type: string; text: string | null; createdAt: string; media?: ChatMedia | null };

type ConversationPayload = {
  conversation: { id: string; userAId: string; userBId: string; expiresAt: string };
  messages: ChatMessage[];
  nextCursor: string | null;
};

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function expiresInLabel(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "expired";
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `expires in ${hours}h`;
  return `expires in ${Math.max(1, minutes)}m`;
}

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isEmojiOnly(text: string) {
  const trimmed = text.trim();
  return /^[\p{Emoji}\s]+$/u.test(trimmed) && trimmed.length <= 4;
}

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const [pollDelayMs, setPollDelayMs] = useState(2500);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [friend, setFriend] = useState<{ username: string; avatarUrl: string; id: string } | null>(null);
  const [input, setInput] = useState("");
  const [expired, setExpired] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showExpiryInfo, setShowExpiryInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const didInitialScrollRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const node = messagesContainerRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = messagesContainerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]) => {
    if (!incoming.length) return prev;
    const merged = [...prev];
    const existingIds = new Set(prev.map((message) => message.id));
    for (const message of incoming) {
      if (!existingIds.has(message.id)) {
        existingIds.add(message.id);
        merged.push(message);
      }
    }
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, []);

  const loadMessages = useCallback(
    async (cursor?: string) => {
      const response = await fetch(`/api/chats/${params.id}/messages${cursor ? `?cursor=${cursor}` : ""}`, { cache: "no-store" });
      if (response.status === 410) return setExpired(true);
      if (response.status === 401) return setIsAuthenticated(false);
      if (!response.ok) return;

      const data = (await response.json()) as ConversationPayload;
      setExpiresAt(data.conversation.expiresAt);
      setNextCursor(data.nextCursor);
      setMessages((prev) => (cursor ? [...data.messages, ...prev] : data.messages));

      const [listResponse, me] = await Promise.all([fetch("/api/chats/list", { cache: "no-store" }), fetch("/api/me")]);
      if (listResponse.ok) {
        const listData = (await listResponse.json()) as { conversations: { id: string; friendUser: { username: string; avatarUrl: string; id: string } }[] };
        const row = listData.conversations.find((item) => item.id === params.id);
        if (row) setFriend(row.friendUser);
      }

      if (me.ok) {
        const meData = (await me.json()) as { user: { id: string } };
        setCurrentUserId(meData.user?.id ?? "");
      } else if (me.status === 401) {
        setIsAuthenticated(false);
      }
    },
    [params.id]
  );

  const pollForNewMessages = useCallback(async () => {
    if (pollInFlightRef.current || expired || !isAuthenticated || !isPageVisible) return;
    pollInFlightRef.current = true;
    const wasNearBottom = isNearBottom();

    try {
      const newestCreatedAt = messages[messages.length - 1]?.createdAt;
      const query = newestCreatedAt ? `?after=${encodeURIComponent(newestCreatedAt)}` : "";
      const response = await fetch(`/api/chats/${params.id}/messages${query}`, { cache: "no-store" });

      if (response.status === 410) return setExpired(true);
      if (response.status === 401) return setIsAuthenticated(false);
      if (!response.ok) throw new Error("poll failed");

      const data = (await response.json()) as ConversationPayload;
      setExpiresAt(data.conversation.expiresAt);
      if (data.messages.length) {
        setMessages((prev) => mergeMessages(prev, data.messages));
        if (wasNearBottom) {
          setShowNewMessagesPill(false);
          setTimeout(() => scrollToBottom("smooth"), 30);
        } else {
          setShowNewMessagesPill(true);
        }
      }

      setPollDelayMs(2500);
    } catch {
      setPollDelayMs(5000);
    } finally {
      pollInFlightRef.current = false;
    }
  }, [expired, isAuthenticated, isNearBottom, isPageVisible, mergeMessages, messages, params.id, scrollToBottom]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (!visible && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (!expired && isAuthenticated && isPageVisible) {
      pollIntervalRef.current = setInterval(() => void pollForNewMessages(), pollDelayMs);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    };
  }, [expired, isAuthenticated, isPageVisible, pollDelayMs, pollForNewMessages]);

  useEffect(() => {
    if (!messages.length) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom("auto");
      return;
    }
    if (isNearBottom()) scrollToBottom("smooth");
  }, [isNearBottom, messages.length, scrollToBottom]);

  const send = async () => {
    if (!input.trim() || expired) return;
    const response = await fetch(`/api/chats/${params.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() })
    });
    if (response.status === 410) return setExpired(true);
    if (!response.ok) return;
    setInput("");
    if (textAreaRef.current) textAreaRef.current.style.height = "auto";
    await pollForNewMessages();
    scrollToBottom("smooth");
  };

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || expired) return;

    if (typeof params.id !== "string" || !params.id.trim()) {
      setUploadStatus("Invalid conversation.");
      return;
    }

    try {
      setUploading(true);
      setUploadStatus("Preparing media...");
      let mediaType: "image" | "video";
      let uploadPayload: Blob = file;
      let uploadFileName = file.name || "upload";
      const fileType = file.type || "";
      const normalizedFileType = fileType.toLowerCase();
      const fileName = file.name.toLowerCase();
      const looksLikeImage = normalizedFileType.startsWith("image/") || (!fileType && /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(fileName));
      const looksLikeVideo = normalizedFileType.startsWith("video/") || (!fileType && /\.(mp4|mov|webm|m4v)$/i.test(fileName));

      if (looksLikeImage) {
        mediaType = "image";
        const normalizedImageType = normalizedFileType || "image/jpeg";
        const imageFile = fileType ? file : new File([file], uploadFileName, { type: normalizedImageType, lastModified: file.lastModified });
        const compressed = await compressChatImage(imageFile);
        uploadPayload = compressed.blob;
        uploadFileName = compressed.fileName;
      } else if (looksLikeVideo) {
        mediaType = "video";
        const normalizedVideoType = normalizedFileType || "video/mp4";
        const videoFile = fileType ? file : new File([file], uploadFileName, { type: normalizedVideoType, lastModified: file.lastModified });
        await validateVideo(videoFile);
        uploadPayload = videoFile;
      } else {
        throw new Error("Please select an image or video file.");
      }

      setUploadStatus("Uploading...");
      const formData = new FormData();
      formData.append("type", mediaType);
      formData.append("file", uploadPayload, uploadFileName);

      const response = await fetch(`/api/chats/${params.id}/media/upload`, { method: "POST", body: formData });
      if (response.status === 410) return setExpired(true);

      let payload: { error?: string } | null = null;
      let failedToParseJson = false;
      try {
        payload = (await response.json()) as { error?: string };
      } catch {
        payload = null;
        failedToParseJson = true;
      }

      if (!response.ok) {
        if (payload?.error) {
          throw new Error(payload.error);
        }
        throw new Error(failedToParseJson ? "Upload failed (server error)." : "Upload failed.");
      }

      setUploadStatus("Uploaded");
      await pollForNewMessages();
      scrollToBottom("smooth");
      setTimeout(() => setUploadStatus(""), 900);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 100)}px`;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const left = useMemo(() => (expiresAt ? daysLeft(expiresAt) : 0), [expiresAt]);
  const isSendDisabled = !input.trim() || expired;

  return (
    <motion.main className="chat-main" initial={{ x: 40, opacity: 0 }} animate={isExiting ? { x: 40, opacity: 0 } : { x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      <style jsx global>{`
        .chat-main {
          --black: #000000;
          --surface: #0f0f0f;
          --glass-border: rgba(255, 255, 255, 0.055);
          --wine: #5a1020;
          --wine-bright: #8a1f38;
          --text: #e8e8e8;
          --text-muted: rgba(232, 232, 232, 0.35);
          --text-dim: rgba(232, 232, 232, 0.55);
          --radius-sm: 12px;
          position: fixed;
          inset: 0;
          background: var(--black);
          color: var(--text);
          display: flex;
          flex-direction: column;
          max-width: 430px;
          margin: 0 auto;
          font-family: "DM Sans", sans-serif;
          overflow: hidden;
        }
        .chat-header { padding: 16px 20px 0; }
        .header-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .back-btn, .icon-btn {
          width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
          background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.1) 100%);
          display: flex; align-items: center; justify-content: center; color: var(--text-dim); cursor: pointer;
        }
        .back-btn svg, .icon-btn svg { width: 18px; height: 18px; }
        .contact-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .avatar-wrap { position: relative; }
        .avatar { width: 42px; height: 42px; border-radius: 999px; object-fit: cover; border: 1px solid rgba(90,16,32,0.35); background: #1a0508; }
        .avatar-fallback { display: flex; align-items: center; justify-content: center; font-family: "Syne", sans-serif; font-weight: 700; color: rgba(255,255,255,.85); }
        .online-dot { position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px; border-radius: 999px; background: #4ade80; border: 2px solid var(--black); }
        .contact-name { font-family: "Syne", sans-serif; font-size: 15px; font-weight: 600; }
        .contact-status { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
        .contact-status span { color: #4ade80; }
        .header-actions { display: flex; gap: 8px; }
        .icon-btn.wine { color: rgba(160,60,80,0.85); background: linear-gradient(160deg, rgba(90,16,32,0.25), rgba(0,0,0,0.2)); }
        .expiry-bar { display:flex; align-items:center; gap:8px; padding:10px 16px; margin-bottom:6px; border-radius: var(--radius-sm); border:1px solid rgba(255,255,255,0.12); background: linear-gradient(160deg, rgba(255,255,255,0.055), rgba(0,0,0,0.08)); }
        .expiry-icon { width: 16px; height: 16px; color: var(--wine-bright); }
        .expiry-track { flex:1; height:3px; background: rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; }
        .expiry-fill { height: 100%; background: linear-gradient(90deg, var(--wine), var(--wine-bright)); }
        .expiry-text { font-size:11px; color:var(--text-muted); white-space: nowrap; }
        .expiry-text strong { color: var(--wine-bright); }
        .messages-scroll { flex:1; overflow-y:auto; padding: 12px 20px 8px; display:flex; flex-direction:column; gap:6px; }
        .date-divider { display:flex; align-items:center; gap:10px; margin:8px 0; }
        .date-divider::before, .date-divider::after { content:""; flex:1; height:1px; background: var(--glass-border); }
        .date-divider span { font-size:10.5px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .msg { display:flex; flex-direction:column; max-width: 78%; }
        .msg.them { align-self: flex-start; }
        .msg.me { align-self: flex-end; align-items: flex-end; }
        .bubble-wrap { position: relative; display:inline-block; }
        .reaction-bar { position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: rgba(20,20,20,.9); border: 1px solid rgba(255,255,255,.12); border-radius: 30px; padding: 4px 8px; display:flex; gap:7px; opacity:0; pointer-events: none; }
        .bubble-wrap:hover .reaction-bar { opacity:1; pointer-events:auto; }
        .bubble { padding:11px 15px; font-size:14px; line-height:1.55; border-radius:18px; border: 1px solid rgba(255,255,255,0.12); }
        .msg.them .bubble { background: linear-gradient(160deg, rgba(255,255,255,0.065), rgba(0,0,0,0.06)); border-radius:4px 18px 18px 18px; }
        .msg.me .bubble { background: linear-gradient(160deg, rgba(100,18,38,0.65), rgba(30,5,12,0.7)); border-color: rgba(150,40,65,.28); border-radius:18px 4px 18px 18px; }
        .bubble.emoji-only { background: transparent !important; border: none !important; font-size: 32px; padding: 2px 4px; }
        .msg-time { font-size:10px; color: var(--text-muted); margin-top:4px; padding:0 4px; }
        .read-ticks { color: var(--wine-bright); }
        .media-box { display: flex; flex-direction: column; gap: 8px; }
        .media-img, .media-video { max-height: 18rem; width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); object-fit: cover; }
        .media-label { display: inline-flex; width: fit-content; border-radius: 99px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.35); padding: 2px 8px; font-size: 10px; color: rgba(255,255,255,0.75); }
        .new-pill { position:absolute; left:50%; transform: translateX(-50%); bottom: 82px; border-radius: 999px; border:1px solid rgba(111,26,44,0.55); background: rgba(0,0,0,.75); color:#b96d81; font-size:12px; padding: 4px 10px; }
        .input-area { padding: 8px 16px 24px; position: relative; }
        .upload-status { min-height: 16px; text-align:center; font-size:11px; color: rgba(255,255,255,0.6); margin-bottom: 6px; }
        .input-row { display:flex; align-items:flex-end; gap:10px; }
        .input-glass { flex:1; display:flex; align-items:center; gap:6px; padding: 11px 14px; border-radius: 26px; border:1px solid rgba(255,255,255,0.1); background: linear-gradient(160deg, rgba(255,255,255,0.07), rgba(0,0,0,0.15)); }
        .inp-icon { width:26px; height:26px; display:flex; align-items:center; justify-content:center; color: rgba(255,255,255,0.35); }
        .inp-icon svg { width: 17px; height: 17px; }
        .input-field { flex:1; background:transparent; border:none; outline:none; color:var(--text); font-size:14.5px; resize:none; min-height:20px; max-height:90px; line-height:1.5; }
        .input-field::placeholder { color: rgba(255,255,255,0.18); }
        .input-actions { display:flex; gap:8px; }
        .mic-btn, .send-btn { width:46px; height:46px; border-radius:999px; display:flex; align-items:center; justify-content:center; }
        .mic-btn { border:1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.38); background: linear-gradient(160deg, rgba(255,255,255,0.07), rgba(0,0,0,0.15)); }
        .send-btn { border:1px solid rgba(150,40,65,0.28); color: rgba(255,255,255,0.88); background: linear-gradient(160deg, rgba(120,25,48,0.95), rgba(30,4,12,0.97)); }
        .send-btn:disabled { opacity: .45; }
      `}</style>

      <div className="chat-header">
        <div className="header-top">
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => router.push("/chats"), 250);
            }}
            className="back-btn"
            aria-label="Back to chats"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="contact-info">
            <div className="avatar-wrap">
              {friend?.avatarUrl ? <img className="avatar" src={friend.avatarUrl} alt={friend.username || "avatar"} /> : <div className="avatar avatar-fallback">{friend?.username?.slice(0, 2).toUpperCase() || "NM"}</div>}
              <div className="online-dot" />
            </div>
            <div className="contact-meta">
              <div className="contact-name">@{friend?.username || "nimi"}</div>
              <div className="contact-status"><span>●</span> Online now</div>
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn wine" aria-label="Video call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
            </button>
            <button className="icon-btn" aria-label="More">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
            </button>
          </div>
        </div>

        <button className="expiry-bar" onClick={() => setShowExpiryInfo(true)}>
          <svg className="expiry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <div className="expiry-track"><div className="expiry-fill" style={{ width: `${Math.max(6, Math.min(100, (left / 15) * 100))}%` }} /></div>
          <div className="expiry-text">Expires in <strong>{left} days</strong></div>
        </button>
      </div>

      <AnimatePresence>
        {showExpiryInfo ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpiryInfo(false)} className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-5">
            <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-black p-5">
              <p className="text-base font-semibold">Chat expiration</p>
              <p className="mt-3 text-sm text-white/75">This conversation expires in {left} days.</p>
              <button onClick={() => setShowExpiryInfo(false)} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 text-sm">Got it</button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="relative flex min-h-0 flex-1 flex-col">
        <div ref={messagesContainerRef} onScroll={() => isNearBottom() && setShowNewMessagesPill(false)} className="messages-scroll" id="msgList">
          <div className="date-divider"><span>Today</span></div>
          {nextCursor ? <button onClick={() => void loadMessages(nextCursor)} className="w-full rounded-full border border-white/15 bg-white/[0.04] py-2 text-xs text-white/70">Load older messages</button> : null}

          {messages.map((message) => {
            const mine = currentUserId && message.senderId === currentUserId;
            const rawText = message.text ?? "";
            return (
              <div key={message.id} className={`msg ${mine ? "me" : "them"}`}>
                <div className="bubble-wrap">
                  <div className="reaction-bar"><span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span></div>
                  {message.media ? (
                    <div className="bubble">
                      <div className="media-box">
                        {message.media.type === "image" ? <img src={message.media.url} alt="Shared image" className="media-img" /> : <video src={message.media.url} controls preload="metadata" className="media-video" />}
                        <span className="media-label">{expiresInLabel(message.media.expiresAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`bubble ${isEmojiOnly(rawText) ? "emoji-only" : ""}`}>{rawText}</div>
                  )}
                </div>
                <div className="msg-time">{formatMessageTime(message.createdAt)}{mine ? <span className="read-ticks"> ✓✓</span> : null}</div>
              </div>
            );
          })}
        </div>

        {showNewMessagesPill ? (
          <button onClick={() => { scrollToBottom("smooth"); setShowNewMessagesPill(false); }} className="new-pill">New messages</button>
        ) : null}
      </section>

      <footer className="input-area">
        <div className="upload-status">{uploadStatus}</div>
        <div className="input-row">
          <div className="input-glass">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => void handleAttach(event)} disabled={expired || uploading} />
            <button onClick={() => fileInputRef.current?.click()} className="inp-icon" aria-label="Attach media" disabled={expired || uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </button>
            <textarea ref={textAreaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown} className="input-field" placeholder="Message..." rows={1} disabled={expired} />
            <div className="inp-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            </div>
          </div>
          <div className="input-actions">
            <button className="mic-btn" aria-label="Voice message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
            </button>
            <button disabled={isSendDisabled} onClick={() => void send()} className="send-btn" id="sendBtn" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        </div>
      </footer>
    </motion.main>
  );
}
