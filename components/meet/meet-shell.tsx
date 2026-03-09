import { ReactNode } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type MeetShellProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function MeetShell({ eyebrow, title, subtitle, actions, children }: MeetShellProps) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#FF2E63]/20 blur-[110px]" />
        <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-[130px]" />
        <div className="absolute bottom-20 left-1/4 h-52 w-52 rounded-full bg-[#742338]/20 blur-[100px]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
              {eyebrow}
            </p>
            <h1 className="text-[34px] font-semibold leading-[1.02] tracking-tight">{title}</h1>
            <p className="max-w-xs text-sm text-white/60">{subtitle}</p>
          </div>
          <div className="relative z-[70] flex shrink-0 items-center gap-2">
            {actions}
            <HeaderMenuDrawer />
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

export const meetPanelClass =
  "rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_14px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl";

export const meetSecondaryPanelClass =
  "rounded-2xl border border-white/10 bg-black/40";

export const meetPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white to-[#ffdce6] px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,46,99,0.25)] transition duration-300 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export const meetGhostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50";
