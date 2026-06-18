export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink px-5 py-8 text-paper">
      <section className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center text-center">
        <div className="mb-5 rounded-full border border-line bg-white/[0.06] px-4 py-2 text-sm text-muted">
          Telegram Mini App
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Vexa Chat</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Lightweight version is active.</p>
      </section>
    </main>
  );
}
