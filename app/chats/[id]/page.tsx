<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Vexa Chat</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
–black: #000000;
–deep: #0a0a0a;
–surface: #0f0f0f;
–glass: rgba(255,255,255,0.03);
–glass-border: rgba(255,255,255,0.055);
–glass-hover: rgba(255,255,255,0.055);
–wine: #5a1020;
–wine-mid: #6e1428;
–wine-bright: #8a1f38;
–wine-glow: rgba(90,16,32,0.25);
–wine-soft: rgba(90,16,32,0.1);
–text: #e8e8e8;
–text-muted: rgba(232,232,232,0.35);
–text-dim: rgba(232,232,232,0.55);
–radius: 20px;
–radius-sm: 12px;
–radius-xs: 8px;
}

html, body {
height: 100%;
background: var(–black);
font-family: ‘DM Sans’, sans-serif;
color: var(–text);
overflow: hidden;
}

/* Pure black */
body::before { display: none; }
body::after { display: none; }

.app {
position: relative;
z-index: 2;
display: flex;
flex-direction: column;
height: 100vh;
max-width: 430px;
margin: 0 auto;
}

/* ─── HEADER ─── */
.header {
padding: 16px 20px 0;
flex-shrink: 0;
}

.header-top {
display: flex;
align-items: center;
gap: 14px;
margin-bottom: 20px;
}

.back-btn {
width: 40px;
height: 40px;
border-radius: 12px;
background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.1) 100%);
border: 1px solid rgba(255,255,255,0.14);
border-bottom-color: rgba(255,255,255,0.04);
border-right-color: rgba(255,255,255,0.04);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
backdrop-filter: blur(40px) saturate(1.6);
-webkit-backdrop-filter: blur(40px) saturate(1.6);
flex-shrink: 0;
transition: all 0.2s ease;
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.12),
inset 0 -1px 0 rgba(0,0,0,0.2),
inset 1px 0 0 rgba(255,255,255,0.06),
0 6px 20px rgba(0,0,0,0.4),
0 1px 4px rgba(0,0,0,0.25);
}
.back-btn:hover {
background: linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.08) 100%);
border-top-color: rgba(255,255,255,0.2);
}
.back-btn svg { width: 18px; height: 18px; color: var(–text-dim); }

.contact-info {
display: flex;
align-items: center;
gap: 12px;
flex: 1;
}

.avatar-wrap {
position: relative;
flex-shrink: 0;
}

.avatar {
width: 42px;
height: 42px;
border-radius: 50%;
background: linear-gradient(135deg, #1a0508, #3d0a14);
display: flex;
align-items: center;
justify-content: center;
font-family: ‘Syne’, sans-serif;
font-weight: 700;
font-size: 14px;
color: rgba(255,255,255,0.85);
border: 1.5px solid rgba(90,16,32,0.35);
overflow: hidden;
}

.avatar img {
width: 100%;
height: 100%;
object-fit: cover;
}

.online-dot {
position: absolute;
bottom: 1px;
right: 1px;
width: 10px;
height: 10px;
border-radius: 50%;
background: #4ade80;
border: 2px solid var(–black);
box-shadow: 0 0 6px rgba(74,222,128,0.6);
}

.contact-meta { flex: 1; min-width: 0; }
.contact-name {
font-family: ‘Syne’, sans-serif;
font-weight: 600;
font-size: 15px;
color: var(–text);
line-height: 1.2;
}
.contact-status {
font-size: 11.5px;
color: var(–text-muted);
margin-top: 2px;
letter-spacing: 0.02em;
}
.contact-status span {
color: #4ade80;
font-size: 10px;
}

.header-actions {
display: flex;
gap: 8px;
}
.icon-btn {
width: 38px;
height: 38px;
border-radius: 11px;
background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.1) 100%);
border: 1px solid rgba(255,255,255,0.14);
border-bottom-color: rgba(255,255,255,0.04);
border-right-color: rgba(255,255,255,0.04);
backdrop-filter: blur(40px) saturate(1.6);
-webkit-backdrop-filter: blur(40px) saturate(1.6);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
transition: all 0.2s ease;
color: var(–text-dim);
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.1),
inset 0 -1px 0 rgba(0,0,0,0.2),
0 4px 16px rgba(0,0,0,0.35),
0 1px 3px rgba(0,0,0,0.2);
}
.icon-btn:hover {
background: linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.08) 100%);
color: var(–text);
border-top-color: rgba(255,255,255,0.2);
}
.icon-btn.wine {
background: linear-gradient(160deg, rgba(90,16,32,0.25) 0%, rgba(55,9,20,0.15) 50%, rgba(0,0,0,0.2) 100%);
border-color: rgba(110,20,40,0.3);
border-bottom-color: rgba(0,0,0,0.15);
color: rgba(160,60,80,0.85);
box-shadow:
inset 0 1.5px 0 rgba(180,60,80,0.12),
inset 0 -1px 0 rgba(0,0,0,0.25),
0 4px 16px rgba(0,0,0,0.35);
}
.icon-btn svg { width: 17px; height: 17px; }

/* Expiry badge */
.expiry-bar {
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
padding: 10px 16px;
background: linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 50%, rgba(0,0,0,0.08) 100%);
border: 1px solid rgba(255,255,255,0.12);
border-bottom-color: rgba(255,255,255,0.035);
border-radius: var(–radius-sm);
backdrop-filter: blur(50px) saturate(1.6);
-webkit-backdrop-filter: blur(50px) saturate(1.6);
margin-bottom: 4px;
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.09),
inset 0 -1px 0 rgba(0,0,0,0.15),
0 4px 20px rgba(0,0,0,0.3),
0 1px 4px rgba(0,0,0,0.2);
}

.expiry-icon {
width: 16px;
height: 16px;
color: var(–wine-bright);
flex-shrink: 0;
}

.expiry-track {
flex: 1;
height: 3px;
background: rgba(255,255,255,0.07);
border-radius: 2px;
overflow: hidden;
}

.expiry-fill {
height: 100%;
width: 53%;
background: linear-gradient(90deg, var(–wine), var(–wine-bright));
border-radius: 2px;
animation: pulse-fill 3s ease-in-out infinite;
}

@keyframes pulse-fill {
0%, 100% { opacity: 1; }
50% { opacity: 0.7; }
}

.expiry-text {
font-size: 11px;
color: var(–text-muted);
font-weight: 500;
white-space: nowrap;
}
.expiry-text strong {
color: var(–wine-bright);
}

/* ─── MESSAGES ─── */
.messages-scroll {
flex: 1;
overflow-y: auto;
padding: 12px 20px 8px;
display: flex;
flex-direction: column;
gap: 6px;
scrollbar-width: none;
}
.messages-scroll::-webkit-scrollbar { display: none; }

/* Date divider */
.date-divider {
display: flex;
align-items: center;
gap: 10px;
margin: 10px 0;
}
.date-divider::before,
.date-divider::after {
content: ‘’;
flex: 1;
height: 1px;
background: var(–glass-border);
}
.date-divider span {
font-size: 10.5px;
color: var(–text-muted);
letter-spacing: 0.08em;
text-transform: uppercase;
font-weight: 500;
}

/* Message bubble */
.msg {
display: flex;
flex-direction: column;
max-width: 78%;
animation: fadeUp 0.35s ease forwards;
opacity: 0;
}

@keyframes fadeUp {
from { opacity: 0; transform: translateY(8px); }
to { opacity: 1; transform: translateY(0); }
}

.msg.them { align-self: flex-start; }
.msg.me { align-self: flex-end; align-items: flex-end; }

.bubble {
padding: 11px 15px;
border-radius: 18px;
font-size: 14px;
line-height: 1.55;
position: relative;
transition: transform 0.15s ease;
}
.bubble:active { transform: scale(0.97); }

/* Them bubbles — liquid glass */
.msg.them .bubble {
background: linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 45%, rgba(0,0,0,0.06) 100%);
border: 1px solid rgba(255,255,255,0.13);
border-bottom-color: rgba(255,255,255,0.04);
border-right-color: rgba(255,255,255,0.04);
backdrop-filter: blur(50px) saturate(1.6);
-webkit-backdrop-filter: blur(50px) saturate(1.6);
border-radius: 4px 18px 18px 18px;
color: var(–text);
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.1),
inset 0 -1px 0 rgba(0,0,0,0.15),
inset 1px 0 0 rgba(255,255,255,0.05),
0 6px 24px rgba(0,0,0,0.45),
0 2px 6px rgba(0,0,0,0.3);
}

/* Highlight on first them bubble */
.msg.them .bubble::before {
content: ‘’;
position: absolute;
top: 0; left: 0; right: 0;
height: 50%;
background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
border-radius: inherit;
pointer-events: none;
}

/* Me bubbles — wine glass */
.msg.me .bubble {
background: linear-gradient(160deg, rgba(100,18,38,0.65) 0%, rgba(65,11,24,0.55) 50%, rgba(30,5,12,0.7) 100%);
border: 1px solid rgba(150,40,65,0.28);
border-bottom-color: rgba(20,4,10,0.3);
border-right-color: rgba(20,4,10,0.2);
backdrop-filter: blur(50px) saturate(1.8);
-webkit-backdrop-filter: blur(50px) saturate(1.8);
border-radius: 18px 4px 18px 18px;
color: rgba(255,255,255,0.88);
box-shadow:
inset 0 1.5px 0 rgba(200,80,100,0.18),
inset 0 -1px 0 rgba(0,0,0,0.3),
inset 1px 0 0 rgba(180,60,80,0.08),
0 6px 24px rgba(50,8,20,0.35),
0 2px 6px rgba(0,0,0,0.4);
}

.msg.me .bubble::before {
content: ‘’;
position: absolute;
top: 0; left: 0; right: 0;
height: 40%;
background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
border-radius: inherit;
pointer-events: none;
}

.msg-time {
font-size: 10px;
color: var(–text-muted);
margin-top: 4px;
padding: 0 4px;
display: flex;
align-items: center;
gap: 4px;
}

.msg.me .msg-time { justify-content: flex-end; }

.msg-time .read-ticks { color: var(–wine-bright); }

/* Emoji bubble */
.bubble.emoji-only {
background: transparent !important;
border: none !important;
box-shadow: none !important;
backdrop-filter: none !important;
-webkit-backdrop-filter: none !important;
padding: 2px 4px;
font-size: 32px;
line-height: 1.2;
}

/* Typing indicator */
.typing-wrap {
display: flex;
align-items: center;
gap: 10px;
align-self: flex-start;
margin-top: 4px;
}

.typing-bubble {
padding: 12px 16px;
background: linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 45%, rgba(0,0,0,0.06) 100%);
border: 1px solid rgba(255,255,255,0.13);
border-bottom-color: rgba(255,255,255,0.04);
backdrop-filter: blur(50px) saturate(1.6);
-webkit-backdrop-filter: blur(50px) saturate(1.6);
border-radius: 4px 18px 18px 18px;
display: flex;
gap: 5px;
align-items: center;
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.1),
inset 0 -1px 0 rgba(0,0,0,0.15),
0 6px 24px rgba(0,0,0,0.4);
}

.typing-dot {
width: 6px;
height: 6px;
border-radius: 50%;
background: rgba(255,255,255,0.45);
animation: typing 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
30% { transform: translateY(-5px); opacity: 1; }
}

/* ─── INPUT AREA ─── */
.input-area {
padding: 8px 16px 34px;
flex-shrink: 0;
position: relative;
}

.input-area::before {
content: ‘’;
position: absolute;
top: -48px; left: 0; right: 0;
height: 48px;
background: linear-gradient(to bottom, transparent, #000);
pointer-events: none;
}

.input-row {
display: flex;
align-items: flex-end;
gap: 10px;
}

/* Floating pill — no outer wrapper */
.input-glass {
flex: 1;
display: flex;
align-items: center;
gap: 6px;
padding: 11px 14px;
background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 45%, rgba(0,0,0,0.15) 100%);
border: 1px solid rgba(255,255,255,0.1);
border-bottom-color: rgba(0,0,0,0.3);
border-right-color: rgba(0,0,0,0.15);
border-radius: 26px;
backdrop-filter: blur(60px) saturate(1.8);
-webkit-backdrop-filter: blur(60px) saturate(1.8);
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.08),
inset 0 -1px 0 rgba(0,0,0,0.3),
0 4px 28px rgba(0,0,0,0.55),
0 1px 6px rgba(0,0,0,0.3);
transition: all 0.25s ease;
}

.input-glass:focus-within {
border-top-color: rgba(255,255,255,0.15);
border-left-color: rgba(255,255,255,0.1);
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.1),
inset 0 -1px 0 rgba(0,0,0,0.3),
0 4px 28px rgba(0,0,0,0.5);
}

.inp-icon {
width: 26px;
height: 26px;
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
color: rgba(255,255,255,0.25);
transition: color 0.15s ease;
flex-shrink: 0;
}
.inp-icon:hover { color: rgba(255,255,255,0.45); }
.inp-icon svg { width: 17px; height: 17px; }

.input-field {
flex: 1;
background: transparent;
border: none;
outline: none;
color: var(–text);
font-family: ‘DM Sans’, sans-serif;
font-size: 14.5px;
font-weight: 400;
caret-color: rgba(160,50,75,0.9);
resize: none;
min-height: 20px;
max-height: 90px;
line-height: 1.5;
scrollbar-width: none;
}
.input-field::-webkit-scrollbar { display: none; }
.input-field::placeholder { color: rgba(255,255,255,0.18); }

/* Standalone floating buttons */
.input-actions {
display: flex;
align-items: center;
gap: 8px;
flex-shrink: 0;
}

.mic-btn {
width: 46px;
height: 46px;
border-radius: 50%;
background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.15) 100%);
border: 1px solid rgba(255,255,255,0.09);
border-bottom-color: rgba(0,0,0,0.3);
backdrop-filter: blur(40px);
-webkit-backdrop-filter: blur(40px);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
color: rgba(255,255,255,0.38);
box-shadow:
inset 0 1.5px 0 rgba(255,255,255,0.07),
inset 0 -1px 0 rgba(0,0,0,0.25),
0 4px 20px rgba(0,0,0,0.5);
transition: all 0.2s ease;
flex-shrink: 0;
}
.mic-btn:hover { color: rgba(255,255,255,0.6); border-top-color: rgba(255,255,255,0.14); }
.mic-btn svg { width: 17px; height: 17px; }

.send-btn {
width: 46px;
height: 46px;
border-radius: 50%;
background: linear-gradient(160deg, rgba(120,25,48,0.95) 0%, rgba(65,10,24,0.92) 55%, rgba(30,4,12,0.97) 100%);
border: 1px solid rgba(150,40,65,0.28);
border-bottom-color: rgba(0,0,0,0.5);
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
box-shadow:
inset 0 1.5px 0 rgba(220,80,110,0.2),
inset 0 -1px 0 rgba(0,0,0,0.4),
0 6px 22px rgba(0,0,0,0.55),
0 2px 6px rgba(0,0,0,0.3);
transition: all 0.2s ease;
}
.send-btn:hover {
transform: scale(1.05);
box-shadow:
inset 0 1.5px 0 rgba(220,80,110,0.26),
inset 0 -1px 0 rgba(0,0,0,0.4),
0 8px 28px rgba(0,0,0,0.5);
}
.send-btn:active { transform: scale(0.94); }
.send-btn svg { width: 16px; height: 16px; color: rgba(255,255,255,0.88); margin-left: 1px; }

/* Stagger animation delays */
.msg:nth-child(1) { animation-delay: 0.05s; }
.msg:nth-child(2) { animation-delay: 0.12s; }
.msg:nth-child(3) { animation-delay: 0.19s; }
.msg:nth-child(4) { animation-delay: 0.26s; }
.msg:nth-child(5) { animation-delay: 0.33s; }
.msg:nth-child(6) { animation-delay: 0.40s; }
.msg:nth-child(7) { animation-delay: 0.47s; }
.msg:nth-child(8) { animation-delay: 0.54s; }
.typing-wrap { animation: fadeUp 0.35s 0.65s ease forwards; opacity: 0; }

/* Reaction popup (hover) */
.bubble-wrap {
position: relative;
display: inline-block;
}
.bubble-wrap:hover .reaction-bar {
opacity: 1;
transform: translateY(0);
pointer-events: all;
}
.reaction-bar {
position: absolute;
top: -38px;
left: 50%;
transform: translateX(-50%) translateY(4px);
background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(20,20,20,0.85) 100%);
border: 1px solid rgba(255,255,255,0.12);
border-bottom-color: rgba(255,255,255,0.04);
backdrop-filter: blur(60px) saturate(1.5);
-webkit-backdrop-filter: blur(60px) saturate(1.5);
border-radius: 30px;
padding: 5px 10px;
display: flex;
gap: 8px;
opacity: 0;
transition: all 0.2s ease;
pointer-events: none;
white-space: nowrap;
z-index: 10;
box-shadow:
inset 0 1px 0 rgba(255,255,255,0.1),
0 8px 30px rgba(0,0,0,0.55);
}
.reaction-bar span {
font-size: 16px;
cursor: pointer;
transition: transform 0.15s ease;
display: inline-block;
}
.reaction-bar span:hover { transform: scale(1.3); }

/* Page load fade */
.app { animation: appFade 0.5s ease forwards; }
@keyframes appFade {
from { opacity: 0; }
to { opacity: 1; }
}
</style>

</head>
<body>

<div class="app">

  <!-- HEADER -->

  <div class="header">
    <div class="header-top">
      <!-- Back -->
      <div class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>

```
  <!-- Contact -->
  <div class="contact-info">
    <div class="avatar-wrap">
      <div class="avatar">NM</div>
      <div class="online-dot"></div>
    </div>
    <div class="contact-meta">
      <div class="contact-name">@nimi</div>
      <div class="contact-status"><span>●</span> Online now</div>
    </div>
  </div>

  <!-- Actions -->
  <div class="header-actions">
    <div class="icon-btn wine">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    </div>
    <div class="icon-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    </div>
  </div>
</div>

<!-- Expiry bar -->
<div class="expiry-bar">
  <svg class="expiry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
  <div class="expiry-track">
    <div class="expiry-fill"></div>
  </div>
  <div class="expiry-text">Expires in <strong>15 days</strong></div>
</div>
```

  </div>

  <!-- MESSAGES -->

  <div class="messages-scroll" id="msgList">

```
<div class="date-divider"><span>Today</span></div>

<!-- them -->
<div class="msg them">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble">Hey! Just matched you 👀 your profile caught my eye</div>
  </div>
  <div class="msg-time">2:30 PM</div>
</div>

<!-- me -->
<div class="msg me">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble emoji-only">😏</div>
  </div>
  <div class="msg-time">2:31 PM <span class="read-ticks">✓✓</span></div>
</div>

<!-- me -->
<div class="msg me">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble">finally someone with taste 😂 what are you up to tonight?</div>
  </div>
  <div class="msg-time">2:31 PM <span class="read-ticks">✓✓</span></div>
</div>

<!-- them -->
<div class="msg them">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble">nothing planned honestly, was thinking of joining a voice room later. you ever use those?</div>
  </div>
  <div class="msg-time">2:33 PM</div>
</div>

<!-- me -->
<div class="msg me">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble">yeah all the time, we could start a private room? just us</div>
  </div>
  <div class="msg-time">2:34 PM <span class="read-ticks">✓✓</span></div>
</div>

<!-- them -->
<div class="msg them">
  <div class="bubble-wrap">
    <div class="reaction-bar">
      <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
    </div>
    <div class="bubble">ooh bold move 🔥 I like it</div>
  </div>
  <div class="msg-time">2:35 PM</div>
</div>

<!-- typing -->
<div class="typing-wrap">
  <div class="typing-bubble">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>
</div>
```

  </div>

  <!-- INPUT AREA -->

  <div class="input-area">
    <div class="input-row">
      <div class="input-glass">
        <div class="inp-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <textarea class="input-field" placeholder="Message..." rows="1" id="inputField"></textarea>
        <div class="inp-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>

```
  <div class="input-actions">
    <div class="mic-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </div>

    <button class="send-btn" id="sendBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
</div>
```

  </div>

</div>

<script>
  const input = document.getElementById('inputField');
  const sendBtn = document.getElementById('sendBtn');
  const msgList = document.getElementById('msgList');

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  function addMessage(text, isMe = true) {
    // Remove typing indicator if present
    const typingWrap = msgList.querySelector('.typing-wrap');
    if (typingWrap) typingWrap.remove();

    const msg = document.createElement('div');
    msg.className = `msg ${isMe ? 'me' : 'them'}`;

    const isEmoji = /^[\p{Emoji}\s]+$/u.test(text.trim()) && text.trim().length <= 4;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    msg.innerHTML = `
      <div class="bubble-wrap">
        <div class="reaction-bar">
          <span>❤️</span><span>🔥</span><span>😂</span><span>😮</span><span>👍</span>
        </div>
        <div class="bubble${isEmoji ? ' emoji-only' : ''}">${text}</div>
      </div>
      <div class="msg-time">${time}${isMe ? ' <span class="read-ticks">✓✓</span>' : ''}</div>
    `;

    msg.style.animationDelay = '0s';
    msgList.appendChild(msg);
    msgList.scrollTop = msgList.scrollHeight;

    // Simulate typing reply
    if (isMe) {
      setTimeout(() => {
        const tw = document.createElement('div');
        tw.className = 'typing-wrap';
        tw.style.cssText = 'animation:fadeUp 0.3s ease forwards;opacity:0;';
        tw.innerHTML = `
          <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        `;
        msgList.appendChild(tw);
        msgList.scrollTop = msgList.scrollHeight;
      }, 800);
    }
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, true);
    input.value = '';
    input.style.height = 'auto';
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // Scroll to bottom on load
  msgList.scrollTop = msgList.scrollHeight;
</script>

</body>
</html>
