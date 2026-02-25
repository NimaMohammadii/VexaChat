import Link from "next/link";

const actions = [
  { href: "/friends", label: "Add Friend" },
  { href: "/chats", label: "New Chat" },
  { href: "/private-room", label: "Create Room (Beta)" }
];

export function QuickActions() {
  return (
    <section>
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/65">Quick actions</p>
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="liquid-glass flex min-h-16 items-center justify-center rounded-[24px] px-2 py-3 text-center text-[13px] font-medium text-white/90 transition duration-200 hover:border-white/45 hover:shadow-[0_16px_38px_rgba(110,172,255,0.36)] active:scale-[0.98]"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
