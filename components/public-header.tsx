export function PublicHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-4 px-4 py-6 md:grid-cols-[1fr_2fr_1fr]">
        <p className="text-sm tracking-[0.2em]">VEXA</p>
        <div className="rounded-xl border border-line bg-slate px-4 py-3">
          <input
            aria-label="Search profiles"
            placeholder="Search by name, city, service..."
            className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-white/50"
          />
        </div>
        <p className="justify-self-start text-sm md:justify-self-end">Login</p>
      </div>
    </header>
  );
}
