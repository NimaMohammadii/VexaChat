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
    <main className="relative min-h-[100svh] overflow-hidden bg-[#060609] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,46,99,0.2),_transparent_36%),radial-gradient(circle_at_72%_18%,_rgba(103,139,255,0.16),_transparent_35%),linear-gradient(to_bottom,_#11111a_0%,_#060609_55%)]" />
        <div className="absolute inset-x-4 top-3 h-24 rounded-[28px] border border-white/10 bg-white/[0.02] blur-2xl" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-[calc(1.1rem+env(safe-area-inset-bottom))] pt-[calc(0.9rem+env(safe-area-inset-top))]">
        <header className="relative z-[120] rounded-[30px] border border-white/10 bg-black/35 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2.5">
              <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                {eyebrow}
              </p>
              <h1 className="text-[32px] font-semibold leading-[1.05] tracking-tight text-white">{title}</h1>
              <p className="max-w-[18rem] text-sm text-white/65">{subtitle}</p>
            </div>
            <div className="relative z-[140] flex shrink-0 items-center gap-2">
              {actions}
              <HeaderMenuDrawer />
            </div>
          </div>
        </header>

        <div className="relative z-10 mt-6 flex flex-1 flex-col">{children}</div>
      </section>
    </main>
  );
}

export const meetPanelClass =
  "rounded-[30px] border border-white/12 bg-[#0b0c12]/90 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl";

export const meetSecondaryPanelClass =
  "rounded-3xl border border-white/10 bg-white/[0.03]";

export const meetPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ffd7e2]/30 bg-gradient-to-r from-[#fff3f7] to-[#ffd7e3] px-6 py-3 text-sm font-semibold text-[#141218] shadow-[0_15px_40px_rgba(255,46,99,0.28)] transition duration-300 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export const meetGhostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50";
