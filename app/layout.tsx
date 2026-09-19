import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yHatePDF — private PDF tools, on your device",
  description: "Free local-first PDF tools. No account, no watermark, no uploads.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
