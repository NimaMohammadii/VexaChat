import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type ChatsPageShellProps = {
  children: React.ReactNode;
  conversationCount: number;
};

export function ChatsPageShell({ children, conversationCount }: ChatsPageShellProps) {
  const activeLabel = `${conversationCount} active`;

  return (
    <main className="min-h-screen bg-[#040404] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-16 pt-4 sm:px-6">
        <header className="mb-7 flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="shrink-0">
            <HeaderMenuDrawer variant="minimal" />
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className="text-[1.9rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.1rem]"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              Chats
            </h1>
          </div>

          <p className="shrink-0 text-[12px] font-medium uppercase tracking-[0.18em] text-white/42">
            {activeLabel}
          </p>
        </header>

        {children}
      </div>
    </main>
  );
}
