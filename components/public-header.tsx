import { ReactNode } from "react";

type PublicHeaderProps = {
  rightSlot?: ReactNode;
};

function SearchBar() {
  return (
    <div className="w-full rounded-xl border border-line bg-slate px-4 py-3">
      <input
        aria-label="Search profiles"
        placeholder="Search by name, city, service..."
        className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-white/50"
      />
    </div>
  );
}

export function PublicHeader({ rightSlot }: PublicHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex items-center gap-4">
          <p className="text-sm tracking-[0.2em]">VEXA</p>

          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <SearchBar />
            </div>

            <div className="flex-shrink-0">
              {rightSlot ?? <div aria-hidden className="h-10 w-10" />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
