import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, FileStack, Globe2, Keyboard, ShieldCheck, Sparkles } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = { title:"Chrome Extension — Coming Soon", description:"The yHatePDF Chrome Extension is landing shortly.", alternates: { canonical: "/extension" } };

const tools=[["MERGE PDF","Combine files and mix pages."],["SPLIT PDF","Choose ranges or individual pages."],["PDF STUDIO","Run multiple edits in one session."],["COMPRESS PDF","Optimize a file locally."],["SIGN PDF","Add a visible typed or drawn signature."],["ORGANIZE","Reorder, rotate, duplicate, or remove pages."]];

export default function ExtensionPage(){return <main className="extension-page page-container">
  <Link className="back-link" href="/"><ArrowLeft/> BACK TO HOME</Link>
  <section className="extension-hero">
    <div className="extension-status"><span><Clock3/> LAUNCHING IN 1–2 DAYS</span><b>NOT LIVE YET</b></div>
    <div className="extension-hero-grid"><div><p className="eyebrow">THE PDF TOOLBOX IN YOUR TOOLBAR.</p><h1>yHatePDF <em>Chrome Extension.</em></h1><p>A small quick-tools launcher for Merge, Split, Compress, Sign, Organize, and PDF Studio. It is in its final polish pass and will land here in the next day or two.</p><div className="extension-actions"><span className="button button-muted" aria-disabled="true"><Globe2/> CHROME WEB STORE — COMING SOON</span><span className="button button-muted" aria-disabled="true"><Clock3/> EXTENSION DOWNLOAD — SOON</span></div><small>No install yet. We&apos;ll switch these on once the store listing and final build are ready.</small></div>
      <div className="extension-mock"><div className="mock-top"><BrandMark/><span>QUICK TOOLS</span></div><div className="mock-grid">{tools.map(([name,copy],i)=><div key={name}><span>0{i+1}</span><strong>{name}</strong><p>{copy}</p></div>)}</div><div className="mock-footer"><ShieldCheck/> No file permissions. Opens yHatePDF tools in a new tab.</div></div>
    </div>
  </section>
  <section className="extension-spec"><div className="section-rule"><span>— WHAT&apos;S LANDING</span><span>COMING SOON</span></div><div className="extension-feature-grid"><article><ShieldCheck/><strong>MINIMAL PERMISSIONS</strong><p>No file, history, or all-sites access. The extension only opens the tool you choose.</p></article><article><Keyboard/><strong>ONE SHORTCUT</strong><p>Jump into PDF Studio without hunting through tabs.</p></article><article><FileStack/><strong>QUICK TOOL ROUTING</strong><p>Open a proper workspace for each job instead of squeezing tools into a popup.</p></article><article><Sparkles/><strong>WEBSITE-MATCHED UI</strong><p>Same grid, same type, same yHatePDF energy.</p></article></div></section>
</main>}
