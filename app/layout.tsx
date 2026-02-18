import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexa Directory",
  description: "Ultra-minimal black and white directory"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseEnv = {
    url: process.env.SUPABASE_URL ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? ""
  };

  return (
    <html lang="en">
      <body className="bg-ink text-paper antialiased">
        <Script
          id="supabase-env"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__SUPABASE_ENV__ = ${JSON.stringify(supabaseEnv)};`
          }}
        />
        {children}
      </body>
    </html>
  );
}
