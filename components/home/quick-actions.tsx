import Link from "next/link";

const actions = [
  { href: "/friends", label: "Add Friend" },
  { href: "/chats", label: "New Chat" },
  { href: "/private-room", label: "Create Room (Beta)" }
];

export function QuickActions() {
  return (
    <section>
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/60">Quick actions</p>
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex min-h-16 items-center justify-center rounded-[24px] border border-white/12 bg-[rgba(255,255,255,0.04)] px-2 py-3 text-center text-[13px] font-medium text-white/85 shadow-[0_10px_24px_rgba(122,30,44,0.1)] backdrop-blur-[14px] transition duration-200 hover:border-[#7A1E2C]/45 hover:shadow-[0_14px_28px_rgba(122,30,44,0.24)] active:scale-[0.98]"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
