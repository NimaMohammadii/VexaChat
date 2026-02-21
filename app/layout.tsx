import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexa Directory",
  description: "Ultra-minimal black and white directory"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}
