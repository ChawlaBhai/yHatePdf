/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Cpu, ExternalLink, HeartHandshake, Lock, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = { title: "About Us — yHatePDF", description: "Meet the people and principles behind yHatePDF's private, practical PDF toolkit." };

const team = [
  { name:"Shiro", role:"Founder & CEO", tag:"THE VISIONARY", image:"/team/shiro.png", url:"https://www.linkedin.com/in/shiro-ilovemd/?utm_source=yhatepdf.online", className:"orange" },
  { name:"Antigravity", role:"CTO", tag:"CORE ARCHITECT", image:"/team/antigravity.png", url:"https://antigravity.google/?utm_source=yhatepdf.online", className:"blue" },
  { name:"Claude", role:"CMO", tag:"STRATEGY", image:"/team/claude.jpg", url:"https://claude.com/product/claude-code?utm_source=yhatepdf.online", className:"amber" },
  { name:"ChatGPT", role:"COO", tag:"OPERATIONS", image:"/team/chatgpt.jpeg", url:"https://openai.com/codex/?utm_source=yhatepdf.online", className:"green" },
  { name:"Sahaj", role:"Cleaner & Dishwasher", tag:"TIME-PASS", image:"/team/sahaj.jpeg", url:"https://www.linkedin.com/in/13sahajchawla/?utm_source=yhatepdf.online", className:"purple" },
];

export default function AboutPage() {
  return <main className="content-page page-container">
    <div className="section-rule"><span>— PLATFORM MISSION & STORY</span><Link href="/#tools">EXPLORE TOOLS ↗</Link></div>
    <section className="editorial-hero-card">
      <div className="editorial-label"><span>WHY WE BUILT IT</span><b>ABOUT US</b></div>
      <h1>Why We Built <BrandMark className="about-brand" /></h1>
      <p>Built by daily power users for people who need PDFs handled quickly, privately, and precisely—without upload queues, account walls, or surprise limits.</p>
    </section>

    <section className="story-panel">
      <div className="story-section"><header><Rocket/><h2>1. Who We Are & Our Broader Mission</h2></header><p>We are tool-obsessed power users in our everyday lives. We merge contracts, reorganize scanned notes, sign forms, extract pages, and convert stubborn files constantly. The same friction kept appearing: everyday PDF jobs were wrapped in clutter, uploads, and upsells.</p><p>Our broader mission is to build high-utility, privacy-first software that solves real operational bottlenecks. <strong>yHatePDF is the PDF sibling of iLoveMD</strong>: the same visual discipline and practical spirit, re-engineered around page-level document work.</p></div>
      <div className="story-section"><header><Cpu/><h2>2. Solving the PDF Friction We Actually Felt</h2></header><p>A PDF is often treated like one sealed file even when the task is really about individual pages. That is why our core tools show every page before export. You can mix pages across files, move them, remove them, rotate them, and understand the result before downloading it.</p><p>Supported work happens locally in browser memory. No document account, no watermark, and no pretend button for a tool whose engine is not ready.</p></div>
      <div className="story-section"><header><ShieldCheck/><h2>3. Our Core Principles</h2></header>
        <div className="principle-grid">
          <article><Lock/><strong>100% IN-BROWSER PRIVACY</strong><p>Supported PDF operations run on your device. Your working files are not uploaded to yHatePDF servers.</p></article>
          <article><Sparkles/><strong>PREVIEW BEFORE COMMIT</strong><p>Page-aware tools let you see selection, order, rotation, and edits before the final export.</p></article>
          <article><HeartHandshake/><strong>HONEST, USEFUL SOFTWARE</strong><p>Free to use, clear about limitations, and engineered around the job instead of the funnel.</p></article>
        </div>
      </div>

      <section className="support-panel">
        <div className="support-heading"><span>☕ SUPPORT YHATEPDF — BUY US A CHAI!</span><b>FREE PASSION PROJECT</b></div>
        <p>yHatePDF is a free, independent project built for people who want reliable document tools without giving away their files. If it saves you time or gets one difficult PDF out of your way, you can fuel the next round of improvements with a Chai.</p>
        <div className="support-actions"><a className="chai-button large" href="https://www.buymeacoffee.com/13sahajchawla" target="_blank" rel="noopener noreferrer">☕ BUY ME A CHAI!</a><span className="listing-placeholder">PRODUCT HUNT · LISTING SOON</span><span className="listing-placeholder">PEERLIST · LISTING SOON</span></div>
        <small>Product Hunt and Peerlist links will activate here as soon as their yHatePDF listings are live.</small>
      </section>

      <div className="story-section team-section"><header><Users/><h2>4. Meet the Team Behind yHatePDF</h2></header><p className="team-intro">The same team behind iLoveMD, now making PDFs less annoying. Open any card to meet the crew.</p>
        <div className="team-grid">{team.map((member)=><a key={member.name} className={`team-card ${member.className}`} href={member.url} target="_blank" rel="noopener noreferrer"><div className="team-photo"><img src={member.image} alt={member.name}/></div><strong>{member.name}<ExternalLink/></strong><span>{member.role}</span><b>{member.tag}</b></a>)}</div>
      </div>
    </section>
    <section className="about-cta"><div><span>— READY WHEN YOUR PDF ISN&apos;T</span><h2>One page, one action,<br/><em>one less problem.</em></h2></div><Link href="/tools/studio" className="button button-dark">OPEN PDF STUDIO <ArrowUpRight/></Link></section>
  </main>;
}
