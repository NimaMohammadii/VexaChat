import { ReactNode } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type PublicHeaderProps = {
  rightSlot?: ReactNode;
};

export function PublicHeader({ rightSlot }: PublicHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-4 py-6 md:gap-4">
        <div className="justify-self-start">
          <HeaderMenuDrawer />
        </div>
        <p className="text-sm tracking-[0.2em]">VEXA</p>
        <div className="w-full max-w-2xl justify-self-center rounded-xl border border-line bg-slate px-4 py-3">
          <input
            aria-label="Search profiles"
            placeholder="Search by name, city, service..."
            className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-white/50"
          />
        </div>
        <div className="justify-self-end">{rightSlot ?? <div aria-hidden className="h-10 w-10" />}</div>
      </div>
    </header>
  );
}
