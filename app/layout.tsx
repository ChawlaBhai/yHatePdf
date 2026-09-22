import type { Metadata } from "next";
import Analytics from "@/components/Analytics";
import AppShell from "@/components/AppShell";
import { absoluteUrl, siteDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "yHatePDF — private PDF tools, on your device", template: "%s | yHatePDF" },
  description: siteDescription,
  keywords: ["PDF tools", "merge PDF", "split PDF", "edit PDF", "sign PDF", "browser PDF tools", "private PDF tools"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_US", url: siteUrl, siteName, title: "yHatePDF — PDFs weren’t the problem.", description: siteDescription, images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "yHatePDF private browser PDF tools" }] },
  twitter: { card: "summary_large_image", title: "yHatePDF — private PDF tools", description: siteDescription, images: [absoluteUrl("/opengraph-image")] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", name: siteName, url: siteUrl, description: siteDescription },
    { "@type": "WebSite", name: siteName, url: siteUrl, description: siteDescription, inLanguage: "en" },
    { "@type": "SoftwareApplication", name: siteName, url: siteUrl, applicationCategory: "BusinessApplication", operatingSystem: "Web browser", description: siteDescription, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
  ] };
  return <html lang="en" suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('yhatepdf_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
  </head><body className="antialiased"><AppShell>{children}</AppShell><Analytics /></body></html>;
}
