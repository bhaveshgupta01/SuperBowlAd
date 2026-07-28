import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdBlitz — Real-Time Super Bowl Marketing",
  description: "Trigger Instagram DM campaigns based on live game events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
