import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "yHatePDF — private PDF tools, on your device",
  description: "Free local-first PDF tools. No account, no watermark, no uploads.",
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
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:"try{if(localStorage.getItem('yhatepdf_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}"}} /></head>
      <body className="antialiased"><AppShell>{children}</AppShell></body>
    </html>
  );
}
