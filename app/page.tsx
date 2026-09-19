import Link from "next/link";
import { ArrowUpRight, Files, Fingerprint, LayoutGrid, MousePointer2, ShieldCheck, Sparkles } from "lucide-react";
import { categories, tools, type ToolCategory } from "@/lib/tool-registry";

const features = [
  { title: "Every page, your call", copy: "See real page previews. Reorder, remove, rotate, and select before you export.", icon: LayoutGrid },
  { title: "Local by design", copy: "Your documents are processed in your browser, not uploaded to a server.", icon: Fingerprint },
  { title: "No account. No watermark.", copy: "Open a tool and get the file you need without the familiar PDF-tool runaround.", icon: Sparkles },
  { title: "Useful names", copy: "Outputs identify the action, source document, and page count so they stay findable.", icon: Files },
];
const order: ToolCategory[] = ["organize", "convert", "edit", "create", "security", "utility"];

export default function Home() {
  return <main className="home-page">
    <section className="home-hero page-container">
      <div className="section-rule"><span>— 01 THE PDF TOOLS YOU ACTUALLY NEED</span><a href="#tools">EXPLORE THE TOOLKIT ↗</a></div>
      <div className="hero-grid"><div className="hero-copy"><p className="eyebrow">YEAH, WE HATE PDFs TOO.</p><h1>PDFs weren&apos;t the problem. <em>Bad PDF tools</em> were.</h1><p className="hero-description">A practical, private PDF toolkit for the everyday stuff: merge, split, rotate, convert, and make every page land exactly where you want it. Your files stay in your browser.</p><div className="hero-actions"><Link className="button button-dark" href="#tools">EXPLORE ALL TOOLS <ArrowUpRight size={17}/></Link><Link className="button button-outline" href="/tools/merge">MERGE A PDF <Files size={17}/></Link></div></div><aside className="engine-card"><div className="engine-title"><span>TOOLKIT SPECIFICATION</span><span className="engine-private">100% PRIVATE</span></div><div className="engine-item"><ShieldCheck/><div><strong>IN-BROWSER PROCESSING</strong><p>Files stay on your device while supported tools work locally.</p></div></div><div className="engine-item"><LayoutGrid/><div><strong>PAGE-LEVEL CONTROL</strong><p>Visual previews and per-page actions where page order matters.</p></div></div><div className="engine-item"><MousePointer2/><div><strong>ONE TOOL, ONE PAGE</strong><p>Dedicated, bookmarkable workspaces. No cramped all-in-one panel.</p></div></div></aside></div>
      <div className="feature-row">{features.map(({title,copy,icon:Icon},index)=><div className="feature-card" key={title}><span className="feature-index">0{index+1}</span><Icon size={22}/><strong>{title}</strong><p>{copy}</p></div>)}</div>
    </section>
    <section id="tools" className="tools-section page-container"><div className="section-rule"><span>— 02 YOUR PDF TOOLKIT</span><span>{tools.length} DEDICATED TOOL PAGES</span></div><div className="toolkit-intro"><div><p className="eyebrow">ONE TASK AT A TIME. DONE WELL.</p><h2>Find your way <em>through a PDF.</em></h2></div><p>Choose the job, open its own workspace, and know exactly what will happen before download. Tools still being researched are clearly marked.</p></div>
      {order.map((category,index)=>{const group=tools.filter(tool=>tool.category===category);return <div className="tool-group" key={category}><div className="group-heading"><span>0{index+1} / {categories[category].label.toUpperCase()}</span><span>{group.length} TOOLS</span></div><div className="tool-grid">{group.map(tool=>{const Icon=tool.icon;return <Link href={tool.route} className="tool-card" key={tool.id}><div className="tool-card-top"><span className={`tool-icon ${categories[category].color}`}><Icon size={23}/></span><ArrowUpRight size={19}/></div><div><h3>{tool.name}</h3><p>{tool.description}</p></div><span className={`tool-state ${tool.status}`}>{tool.status==="ready"?"READY TO USE":"IN RESEARCH"}</span></Link>})}</div></div>})}
    </section>
    <section className="closing-section page-container"><div><span>— 03 NO COMPLICATED FINALE</span><h2>Choose a tool.<br/><em>Keep your files.</em></h2></div><Link href="/tools/merge" className="button button-dark">START WITH MERGE PDF <ArrowUpRight size={18}/></Link></section>
  </main>;
}
