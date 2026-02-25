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
    <section className="liquid-glass rounded-[24px] p-3.5">
      <p className="px-1 text-xs uppercase tracking-[0.14em] text-white/65">Pending requests</p>
      <div className="mt-3 space-y-2.5">
        {visibleItems.map((request) => {
          const isBusy = busyId === request.id;
          return (
            <div key={request.id} className="liquid-glass-soft flex items-center gap-2 rounded-2xl p-2.5">
              <img src={request.sender.avatarUrl} alt={request.sender.name} className="h-10 w-10 rounded-full border border-white/30 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{request.sender.name}</p>
                <p className="truncate text-xs text-white/65">@{request.sender.username}</p>
              </div>
              <button
                type="button"
                onClick={() => void updateRequest(request.id, "accept")}
                disabled={isBusy}
                className="liquid-glass-soft rounded-xl px-2.5 py-1.5 text-[11px] text-white transition hover:border-white/50 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => void updateRequest(request.id, "reject")}
                disabled={isBusy}
                className="rounded-xl border border-white/25 bg-black/20 px-2.5 py-1.5 text-[11px] text-white/85 transition hover:border-white/40 hover:text-white disabled:opacity-50"
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
