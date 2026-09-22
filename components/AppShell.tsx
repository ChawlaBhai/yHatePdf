"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Command, Globe2, Menu, Moon, Search, ShieldCheck, Sparkles, Sun, X } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { categories, tools } from "@/lib/tool-registry";
import { processedCount, processedEvent } from "@/lib/processed-counter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);
  const [palette, setPalette] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [processed, setProcessed] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setTheme(localStorage.getItem("yhatepdf_theme") === "dark" ? "dark" : "light"); } catch { /* optional storage */ }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const sync = (event?: Event) => setProcessed(event instanceof CustomEvent && typeof event.detail === "number" ? event.detail : processedCount());
    sync();
    const timer = window.setInterval(sync, 30_000);
    window.addEventListener(processedEvent, sync);
    return () => { window.clearInterval(timer); window.removeEventListener(processedEvent, sync); };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("yhatepdf_theme", theme); } catch { /* optional storage */ }
  }, [theme, hydrated]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPalette(true); }
      if (event.key === "Escape") { setPalette(false); setMobileMenu(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const found = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/);
    return tools.filter((tool) => !query || words.every((word) => `${tool.name} ${tool.description} ${tool.keywords.join(" ")}`.toLowerCase().includes(word)));
  }, [query]);
  const navigate = (route: string) => { setPalette(false); setMobileMenu(false); setQuery(""); router.push(route); };

  return <div className="site-shell">
    <header className="site-header">
      <div className="utility-bar"><span><b>• 100% IN-BROWSER</b><span className="utility-extra"> PRIVATE PDF TOOLS FOR EVERYDAY DOCUMENT WORK</span></span><span>PROCESSED: <b className="processed-count">{processed.toLocaleString("en-US")}</b></span></div>
      <div className="nav-wrap">
        <Link href="/" className="logo-link" aria-label="yHatePDF home"><BrandMark /></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/#tools">TOOLS</Link>
          <Link href="/tools/merge">MERGE PDF</Link>
          <Link href="/tools/split">SPLIT PDF</Link>
          <Link href="/tools/studio" className="nav-studio"><Sparkles size={14} /> PDF STUDIO</Link>
          <Link href="/extension" className="nav-extension"><Globe2 size={14} /> EXTENSION</Link>
          <Link href="/about">ABOUT US</Link>
        </nav>
        <div className="nav-actions">
          <Link className="privacy-badge" href="/privacy"><ShieldCheck size={16} />100% In-Browser Privacy</Link>
          <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
          <button className="command-trigger" onClick={() => setPalette(true)} aria-label="Search every PDF tool"><Command size={15} /> <span>Cmd+K</span></button>
          <button className="mobile-menu-trigger" onClick={() => setMobileMenu((open) => !open)} aria-label="Toggle navigation">{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</button>
        </div>
      </div>
      {mobileMenu && <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/#tools" onClick={() => setMobileMenu(false)}>ALL PDF TOOLS</Link>
        <Link href="/tools/studio" onClick={() => setMobileMenu(false)}>PDF STUDIO</Link>
        <Link href="/extension" onClick={() => setMobileMenu(false)}>CHROME EXTENSION</Link>
        <Link href="/about" onClick={() => setMobileMenu(false)}>ABOUT US</Link>
        <Link href="/privacy" onClick={() => setMobileMenu(false)}>PRIVACY</Link>
      </nav>}
    </header>
    {children}
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand"><Link href="/"><BrandMark /></Link><p>Private, visual PDF tools for people who need the result—not an account, a watermark, or a maze.</p><a className="chai-button" href="https://www.buymeacoffee.com/13sahajchawla" target="_blank" rel="noopener noreferrer">☕ BUY ME A CHAI!</a><span>Sibling project: <a href="https://ilovemd.online" target="_blank" rel="noopener noreferrer">iLoveMD.online ↗</a></span></div>
        <div><strong>— 01 ESSENTIALS</strong>{tools.slice(0, 5).map((tool) => <Link key={tool.id} href={tool.route}>{tool.name}<ArrowUpRight size={13} /></Link>)}</div>
        <div><strong>— 02 WORKSPACES</strong><Link href="/tools/studio">PDF Studio<ArrowUpRight size={13}/></Link><Link href="/extension">Chrome Extension<ArrowUpRight size={13}/></Link><Link href="/#tools">All 50+ tools<ArrowUpRight size={13}/></Link><Link href="/tools/sign">Sign PDF<ArrowUpRight size={13}/></Link><Link href="/tools/compress">Compress PDF<ArrowUpRight size={13}/></Link></div>
        <div><strong>— 03 PROJECT</strong><Link href="/about">About yHatePDF<ArrowUpRight size={13} /></Link><Link href="/privacy">Privacy Policy<ArrowUpRight size={13} /></Link><Link href="/terms">Terms & Conditions<ArrowUpRight size={13} /></Link><a href="https://ilovemd.online" target="_blank" rel="noopener noreferrer">iLoveMD.online<ArrowUpRight size={13} /></a><span>Local processing. No account.</span></div>
      </div>
      <div className="footer-bottom"><span>© 2026 yHatePDF.online</span><span>PROCESSED: <b className="processed-count">{processed.toLocaleString("en-US")}</b> · PDFs were never the problem. Bad PDF tools were.</span></div>
    </footer>
    {palette && <div className="palette-backdrop" onMouseDown={() => setPalette(false)}><section className="palette-dialog" role="dialog" aria-modal="true" aria-label="Find a PDF tool" onMouseDown={(event) => event.stopPropagation()}><div className="palette-input"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && found[0]) navigate(found[0].route); }} placeholder="Search tools: combine, password, pages…" /><button onClick={() => setPalette(false)} aria-label="Close tool search"><X size={18} /></button></div><div className="palette-results"><p>PDF TOOLS · {found.length} RESULTS</p>{found.map((tool) => { const Icon = tool.icon; return <button key={tool.id} onClick={() => navigate(tool.route)}><span className={`palette-icon ${categories[tool.category].color}`}><Icon size={18} /></span><span><b>{tool.name}</b><small>{tool.description}</small></span><em>{tool.status === "ready" ? "READY" : "IN RESEARCH"}</em></button>; })}</div><div className="palette-bottom"><span>↑↓ Browse · ↵ Open · Esc Close</span><span>{pathname === "/" ? "Home" : pathname}</span></div></section></div>}
  </div>;
}
