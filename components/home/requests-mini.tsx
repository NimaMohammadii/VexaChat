"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type RequestItem = {
  id: string;
  sender: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string;
  };
};

type RequestsMiniProps = {
  requests: RequestItem[];
};

export function RequestsMini({ requests }: RequestsMiniProps) {
  const router = useRouter();
  const [items, setItems] = useState(requests);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.slice(0, 2), [items]);

  const updateRequest = async (requestId: string, action: "accept" | "reject") => {
    setBusyId(requestId);
    const response = await fetch(`/api/friends/requests/${requestId}/${action}`, { method: "POST" });

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== requestId));
      router.refresh();
    }

    setBusyId(null);
  };

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-3.5 shadow-[0_10px_28px_rgba(122,30,44,0.16)] backdrop-blur-[16px]">
      <p className="px-1 text-xs uppercase tracking-[0.14em] text-white/60">Pending requests</p>
      <div className="mt-3 space-y-2.5">
        {visibleItems.map((request) => {
          const isBusy = busyId === request.id;
          return (
            <div key={request.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2.5">
              <img src={request.sender.avatarUrl} alt={request.sender.name} className="h-10 w-10 rounded-full border border-white/15 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{request.sender.name}</p>
                <p className="truncate text-xs text-white/55">@{request.sender.username}</p>
              </div>
              <button
                type="button"
                onClick={() => void updateRequest(request.id, "accept")}
                disabled={isBusy}
                className="rounded-xl border border-white/20 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-white transition hover:border-[#7A1E2C]/50 hover:bg-[#7A1E2C]/20 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => void updateRequest(request.id, "reject")}
                disabled={isBusy}
                className="rounded-xl border border-white/15 bg-black/35 px-2.5 py-1.5 text-[11px] text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
