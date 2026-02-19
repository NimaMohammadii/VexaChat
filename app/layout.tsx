import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexa Directory",
  description: "Ultra-minimal black and white directory"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-ink text-paper antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-line/80 px-6 py-4 text-center text-sm text-paper/70">
            <Link className="transition hover:text-paper" href="/privacy">
              Privacy Policy
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
