import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type ChatsPageShellProps = {
  children: React.ReactNode;
  conversationCount: number;
};

export function ChatsPageShell({ children, conversationCount }: ChatsPageShellProps) {
  return (
    <main
      className="relative min-h-screen overflow-hidden pb-16 text-white"
      style={{ background: "#050505", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-[-18%] top-10 h-64 w-64 rounded-full blur-[130px]"
          style={{ background: "rgba(120, 24, 48, 0.16)" }}
        />
        <div
          className="absolute right-[-28%] top-[24%] h-80 w-80 rounded-full blur-[160px]"
          style={{ background: "rgba(255, 255, 255, 0.055)" }}
        />
        <div
          className="absolute bottom-[-14%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-[180px]"
          style={{ background: "rgba(73, 12, 29, 0.14)" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-5">
        <header className="mb-5 flex items-start gap-3">
          <HeaderMenuDrawer />
          <div className="min-w-0 flex-1 rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/38">Private messaging</p>
                <div className="mt-1 flex items-center gap-2.5">
                  <h1
                    className="truncate text-[1.85rem] font-semibold tracking-[-0.06em] text-white"
                    style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
                  >
                    Chats
                  </h1>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/64 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    {conversationCount}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-white/45">Recent conversations</p>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
