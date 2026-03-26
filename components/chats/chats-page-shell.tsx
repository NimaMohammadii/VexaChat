import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type ChatsPageShellProps = {
  children: React.ReactNode;
  conversationCount: number;
};

export function ChatsPageShell({ children, conversationCount }: ChatsPageShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-5 sm:px-6">
        <header className="mb-8 flex items-center gap-4 border-b border-white/10 pb-4">
          <HeaderMenuDrawer variant="minimal" />
          <h1 className="min-w-0 flex-1 text-[2rem] font-semibold tracking-[-0.05em] text-white">Chats</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">{conversationCount} active</p>
        </header>
        {children}
      </div>
    </main>
  );
}
