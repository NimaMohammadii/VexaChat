export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <article className="rounded-2xl border border-line bg-slate/40 p-8 sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-paper sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-paper/70">Last updated: February 19, 2026</p>
        </header>

        <div className="space-y-8 text-base leading-7 text-paper/90">
          <section className="space-y-3">
            <p>
              We respect your privacy. This Privacy Policy explains what information we collect and
              how we use it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-medium text-paper">Information We Collect</h2>
            <p>
              When you sign in with Google, we collect your email address and basic profile
              information (such as your name and profile picture).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-medium text-paper">How We Use This Information</h2>
            <p>
              We use your information only for authentication and account functionality. We do not
              sell, share, or distribute your personal data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-medium text-paper">Data Security</h2>
            <p>We take reasonable measures to protect your information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-medium text-paper">Contact</h2>
            <p>
              If you have questions, contact us at:{" "}
              <a className="underline decoration-paper/50 underline-offset-2" href="mailto:support@example.com">
                support@example.com
              </a>
            </p>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <p>By using this service, you agree to this Privacy Policy.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
