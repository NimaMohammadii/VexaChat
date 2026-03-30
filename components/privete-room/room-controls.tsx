“use client”;

type RoomControlsProps = {
joinedAudio: boolean;
joiningAudio: boolean;
micMuted: boolean;
onJoinAudio: () => void;
onToggleMic: () => void;
onInvite: () => void;
onOpenVexa: () => void;
onLeave: () => void;
};

function ControlButton({ label, onClick, emphasis, danger }: { label: string; onClick: () => void; emphasis?: boolean; danger?: boolean }) {
return (
<button
type=“button”
onClick={onClick}
className={`rounded-full px-4 py-2 text-[11px] font-medium transition ${danger ? "border border-rose-400/45 text-rose-200" : emphasis ? "bg-white text-black" : "border border-white/20 text-white/90"}`}
>
{label}
</button>
);
}

export function RoomControls({
joinedAudio,
joiningAudio,
micMuted,
onJoinAudio,
onToggleMic,
onInvite,
onOpenVexa,
onLeave
}: RoomControlsProps) {
return (
<div className="sticky bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 rounded-full border border-white/10 bg-black/75 p-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
<div className="flex flex-wrap items-center justify-center gap-2">
{!joinedAudio ? (
<ControlButton label={joiningAudio ? “Joining…” : “Join Audio”} onClick={onJoinAudio} emphasis />
) : (
<ControlButton label={micMuted ? “Mic Off” : “Mic On”} onClick={onToggleMic} />
)}
<ControlButton label="Invite" onClick={onInvite} />
<ControlButton label="Vexa" onClick={onOpenVexa} />
<ControlButton label="Leave" onClick={onLeave} danger />
</div>
</div>
);
}
