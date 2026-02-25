import { ReactNode } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type PublicHeaderProps = {
  rightSlot?: ReactNode;
};

export function PublicHeader({ rightSlot }: PublicHeaderProps) {
  return (
    <header className="border-b border-white/[0.08] bg-black/60 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:gap-4 md:px-6 md:pb-5 md:pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="justify-self-start">
          <HeaderMenuDrawer />
        </div>
        <p className="text-xs font-medium tracking-[0.28em] text-white/90 md:text-sm">VEXA</p>
        <div className="relative w-full max-w-2xl justify-self-center overflow-hidden rounded-full border border-white/[0.14] bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-10px_18px_rgba(0,0,0,0.4),0_12px_34px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60">
            <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.6 13.4L16.4 16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Search profiles"
            placeholder="Search by name, city, service..."
            className="w-full bg-transparent py-3 pl-11 pr-5 text-[16px] leading-tight text-paper outline-none placeholder:text-white/50"
          />
        </div>
        <div className="justify-self-end">{rightSlot ?? <div aria-hidden className="h-10 w-10" />}</div>
      </div>
    </header>
  );
}
