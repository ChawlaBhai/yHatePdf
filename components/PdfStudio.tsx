"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Crop, Download, FilePlus2, GripVertical, Highlighter, ImagePlus, LoaderCircle, Plus, RotateCcw, RotateCw, ShieldCheck, Stamp, Trash2, Type, Upload, X } from "lucide-react";
import { appendPagePlan, createThumbnails, exportStudioPdf, renderFullPreview, type PagePlanItem, type PdfPageInfo, type StudioAction } from "@/lib/pdf-client";

const pageKey=(item:Pick<PagePlanItem,"fileIndex"|"pageIndex">)=>`${item.fileIndex}:${item.pageIndex}`;
const actionName:Record<StudioAction["type"],string>={"watermark":"Watermark","page-numbers":"Page numbers","header-footer":"Header & footer","signature":"Visible signature","annotation":"Note / highlight","crop":"Crop margins","remove-metadata":"Remove metadata"};

export default function PdfStudio(){
  const [files,setFiles]=useState<File[]>([]);
  const [plan,setPlan]=useState<PagePlanItem[]>([]);
  const [thumbs,setThumbs]=useState<Record<string,PdfPageInfo>>({});
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [active,setActive]=useState<string>("");
  const [fullPreview,setFullPreview]=useState("");
  const [actions,setActions]=useState<StudioAction[]>([]);
  const [tool,setTool]=useState<StudioAction["type"]>("watermark");
  const [scope,setScope]=useState<"selected"|"all">("selected");
  const [text,setText]=useState("DRAFT");
  const [secondary,setSecondary]=useState("");
  const [position,setPosition]=useState<"bottom"|"top">("bottom");
  const [signaturePosition,setSignaturePosition]=useState<"bottom-right"|"bottom-left"|"top-right"|"top-left">("bottom-right");
  const [signatureImage,setSignatureImage]=useState("");
  const [signatureX,setSignatureX]=useState(62);
  const [signatureTop,setSignatureTop]=useState(72);
  const [signatureWidth,setSignatureWidth]=useState(26);
  const [signatureRotation,setSignatureRotation]=useState(0);
  const [signatureOpacity,setSignatureOpacity]=useState(1);
  const [margin,setMargin]=useState(18);
  const [annotationX,setAnnotationX]=useState(52);
  const [annotationTop,setAnnotationTop]=useState(72);
  const [highlight,setHighlight]=useState(true);
  const [busy,setBusy]=useState(false);
  const [previewBusy,setPreviewBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [drag,setDrag]=useState<string>("");
  const input=useRef<HTMLInputElement>(null);
  const signatureInput=useRef<HTMLInputElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const drawing=useRef(false);
  const activeItem=plan.find((item)=>item.id===active)??plan[0];

  useEffect(()=>{
    if(!activeItem||!files[activeItem.fileIndex])return;
    let alive=true; setFullPreview("");
    void renderFullPreview(files[activeItem.fileIndex],activeItem.pageIndex).then(url=>{if(alive)setFullPreview(url)}).catch(cause=>{if(alive)setError(cause instanceof Error?cause.message:"Preview failed.")});
    return()=>{alive=false};
  },[activeItem?.id,activeItem?.fileIndex,activeItem?.pageIndex,files]);

  async function addFiles(incoming:FileList){
    const additions=Array.from(incoming); if(!additions.length)return;
    setBusy(true);setError("");setNotice("");
    try{
      if(additions.some(file=>!file.name.toLowerCase().endsWith(".pdf")&&file.type!=="application/pdf"))throw new Error("PDF Studio accepts PDF files.");
      const first=files.length; const next=[...files,...additions]; const newPages=await appendPagePlan(next,first);
      setFiles(next); setPlan(current=>[...current,...newPages]); setSelected(current=>new Set([...current,...newPages.map(item=>item.id)])); if(!active&&newPages[0])setActive(newPages[0].id);
      setPreviewBusy(true); await createThumbnails(next,first,info=>setThumbs(current=>({...current,[`${info.fileIndex}:${info.pageIndex}`]:info})));
      setNotice(`${additions.length} PDF${additions.length===1?"":"s"} added. The canvas now has ${plan.length+newPages.length} pages.`);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not open that PDF.");}
    finally{setBusy(false);setPreviewBusy(false);if(input.current)input.current.value="";}
  }
  function move(from:number,to:number){if(from===to||to<0||to>=plan.length)return;setPlan(current=>{const next=[...current];const [item]=next.splice(from,1);next.splice(to,0,item);return next;});}
  function rotate(id:string,angle:number){setPlan(current=>current.map(item=>item.id===id?{...item,rotation:(item.rotation+angle+360)%360}:item));}
  function remove(id:string){setPlan(current=>current.filter(item=>item.id!==id));setSelected(current=>{const next=new Set(current);next.delete(id);return next});if(active===id)setActive(plan.find(item=>item.id!==id)?.id??"");}
  function duplicate(id:string){const index=plan.findIndex(item=>item.id===id);if(index<0)return;const copy={...plan[index],id:crypto.randomUUID()};setPlan(current=>[...current.slice(0,index+1),copy,...current.slice(index+1)]);setSelected(current=>new Set([...current,copy.id]));}
  function toggle(id:string){setSelected(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next});setActive(id);}
  function beginDraw(event:ReactPointerEvent<HTMLCanvasElement>){const target=canvas.current;if(!target)return;drawing.current=true;target.setPointerCapture(event.pointerId);const box=target.getBoundingClientRect();const context=target.getContext("2d");if(!context)return;context.strokeStyle="#17346f";context.lineWidth=3;context.lineCap="round";context.beginPath();context.moveTo((event.clientX-box.left)*(target.width/box.width),(event.clientY-box.top)*(target.height/box.height));}
  function draw(event:ReactPointerEvent<HTMLCanvasElement>){if(!drawing.current||!canvas.current)return;const box=canvas.current.getBoundingClientRect();const context=canvas.current.getContext("2d");if(!context)return;context.lineTo((event.clientX-box.left)*(canvas.current.width/box.width),(event.clientY-box.top)*(canvas.current.height/box.height));context.stroke();}
  function endDraw(){drawing.current=false;if(canvas.current)setSignatureImage(canvas.current.toDataURL("image/png"));}
  async function importSignature(file:File){
    const url=URL.createObjectURL(file);
    try{const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const next=new Image();next.onload=()=>resolve(next);next.onerror=()=>reject(new Error("That signature image could not be read."));next.src=url;});const target=document.createElement("canvas");const scale=Math.min(1,1000/Math.max(image.width,image.height));target.width=Math.max(1,Math.round(image.width*scale));target.height=Math.max(1,Math.round(image.height*scale));const context=target.getContext("2d",{willReadFrequently:true});if(!context)throw new Error("Signature image processing is unavailable.");context.drawImage(image,0,0,target.width,target.height);const pixels=context.getImageData(0,0,target.width,target.height);for(let index=0;index<pixels.data.length;index+=4){const r=pixels.data[index],g=pixels.data[index+1],b=pixels.data[index+2];const luminance=.299*r+.587*g+.114*b;if(luminance>238&&Math.max(r,g,b)-Math.min(r,g,b)<30)pixels.data[index+3]=0;}context.putImageData(pixels,0,0);setSignatureImage(target.toDataURL("image/png"));setText("");setNotice("Signature image imported and its near-white background was removed locally.");}finally{URL.revokeObjectURL(url);if(signatureInput.current)signatureInput.current.value="";}
  }
  function targetIds(){const ids=scope==="all"?plan.map(item=>item.id):[...selected];if(!ids.length)throw new Error("Select at least one page or switch the action scope to all pages.");return ids;}
  function addAction(){
    try{
      const targets=targetIds(); const id=crypto.randomUUID();
      let action:StudioAction;
      if(tool==="watermark"){if(!text.trim())throw new Error("Enter watermark text.");action={id,type:tool,targetIds:targets,text:text.trim()};}
      else if(tool==="page-numbers")action={id,type:tool,targetIds:targets,position};
      else if(tool==="header-footer"){if(!text.trim()&&!secondary.trim())throw new Error("Enter a header or footer.");action={id,type:tool,targetIds:targets,text:text.trim(),secondaryText:secondary.trim()};}
      else if(tool==="signature"){if(!text.trim()&&!signatureImage)throw new Error("Type, draw, or import a signature.");action={id,type:tool,targetIds:targets,text:text.trim(),image:signatureImage||undefined,position:signaturePosition,x:signatureX,top:signatureTop,width:signatureWidth,rotation:signatureRotation,opacity:signatureOpacity};}
      else if(tool==="annotation"){if(!text.trim()&&!highlight)throw new Error("Enter a note or enable the highlight.");action={id,type:tool,targetIds:targets,text:text.trim(),x:annotationX,top:annotationTop,highlight};}
      else if(tool==="crop")action={id,type:tool,targetIds:targets,margin};
      else action={id,type:tool,targetIds:targets};
      setActions(current=>[...current,action]);setError("");setNotice(`${actionName[tool]} added to the workflow. Continue editing or export when ready.`);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not add that action.");}
  }
  async function exportPdf(){setBusy(true);setError("");try{await exportStudioPdf(files,plan,actions);setNotice("Your multi-action PDF is ready and the download has started.");}catch(cause){setError(cause instanceof Error?cause.message:"Studio export failed.");}finally{setBusy(false);}}
  const actionForActive=actions.filter(action=>activeItem&&action.targetIds.includes(activeItem.id));

  return <main className="pdf-studio page-container">
    <div className="section-rule"><span>— FLAGSHIP WORKSPACE / PDF STUDIO</span><Link href="/#tools"><ArrowLeft/> ALL TOOLS</Link></div>
    <header className="studio-heading"><div><p className="eyebrow">ONE PDF SESSION. MULTIPLE ACTIONS.</p><h1>PDF <em>Studio.</em></h1><p>Open one or more PDFs, inspect the whole document, organize pages, stack edits, sign, and export once.</p></div><span><ShieldCheck/> WORKING LOCALLY</span></header>
    <input ref={input} className="sr-only" type="file" accept=".pdf,application/pdf" multiple onChange={event=>event.target.files&&void addFiles(event.target.files)}/>
    <input ref={signatureInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>event.target.files?.[0]&&void importSignature(event.target.files[0])}/>
    {!files.length?<section className="studio-empty" onClick={()=>input.current?.click()} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(event.dataTransfer.files)void addFiles(event.dataTransfer.files)}} role="button" tabIndex={0} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")input.current?.click()}}><Upload/><h2>Drop one or more PDFs here</h2><p>Build a whole-document workspace, then decide what to change.</p><span>PDF FILES · PROCESSED IN YOUR BROWSER</span></section>:
    <section className="studio-shell">
      <aside className="studio-pages"><div className="studio-pane-title"><div><strong>PAGES</strong><span>{plan.length} TOTAL</span></div><button onClick={()=>input.current?.click()}><Plus/> ADD PDF</button></div><div className="studio-select"><button onClick={()=>setSelected(new Set(plan.map(item=>item.id)))}>ALL</button><button onClick={()=>setSelected(new Set())}>NONE</button><span>{selected.size} selected</span></div><div className="studio-thumb-list">{plan.map((item,index)=>{const info=thumbs[pageKey(item)];return <article key={item.id} className={`${item.id===active?"active":""} ${selected.has(item.id)?"selected":""}`} draggable onDragStart={()=>setDrag(item.id)} onDragOver={event=>event.preventDefault()} onDrop={()=>{const from=plan.findIndex(page=>page.id===drag);move(from,index);setDrag("")}}><div className="thumb-top"><label><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggle(item.id)}/><span>{index+1}</span></label><GripVertical/></div><button className="studio-thumb" onClick={()=>setActive(item.id)}><span style={{transform:`rotate(${item.rotation}deg)`}}>{info?<img src={info.thumbnail} alt={`Page ${index+1}`}/>:previewBusy?<LoaderCircle className="spin"/>:"PREVIEW"}</span></button><small>{files[item.fileIndex]?.name} · p.{item.pageIndex+1}</small></article>})}</div></aside>
      <section className="studio-canvas"><div className="canvas-toolbar"><button onClick={()=>{const i=plan.findIndex(item=>item.id===active);move(i,i-1)}} disabled={!activeItem||plan.indexOf(activeItem)===0}><ArrowUp/> EARLIER</button><button onClick={()=>{const i=plan.findIndex(item=>item.id===active);move(i,i+1)}} disabled={!activeItem||plan.indexOf(activeItem)===plan.length-1}><ArrowDown/> LATER</button><button onClick={()=>active&&rotate(active,-90)}><RotateCcw/> LEFT</button><button onClick={()=>active&&rotate(active,90)}><RotateCw/> RIGHT</button><button onClick={()=>active&&duplicate(active)}><Copy/> DUPLICATE</button><button onClick={()=>active&&remove(active)}><Trash2/> REMOVE</button></div><div className="canvas-stage">{activeItem&&fullPreview?<div className="live-page" style={{transform:`rotate(${activeItem.rotation}deg)`}}><img src={fullPreview} alt="Large preview of the active PDF page"/>{actionForActive.map(action=><span key={action.id} className={`live-action ${action.type}`} style={action.type==="signature"?{left:`${action.x??62}%`,top:`${action.top??72}%`,width:`${action.width??26}%`,right:"auto",bottom:"auto",transform:`rotate(${action.rotation??0}deg)`,opacity:action.opacity??1}:undefined}>{action.type==="watermark"?action.text:action.type==="signature"?(action.image?<img src={action.image} alt="Queued signature"/>:action.text):action.type==="annotation"?(action.text||"HIGHLIGHT"):action.type==="page-numbers"?`${plan.indexOf(activeItem)+1} / ${plan.length}`:action.type==="header-footer"?(action.text||action.secondaryText):action.type==="crop"?"CROP PREVIEW":"METADATA CLEAN"}</span>)}</div>:<LoaderCircle className="spin"/>}</div><div className="canvas-status"><span>ACTIVE PAGE {Math.max(1,plan.findIndex(item=>item.id===active)+1)} / {plan.length}</span><span>{actionForActive.length} QUEUED ACTION{actionForActive.length===1?"":"S"} ON THIS PAGE</span></div></section>
      <aside className="studio-inspector"><div className="studio-pane-title"><div><strong>ACTIONS</strong><span>STACK EDITS</span></div></div><div className="studio-tool-grid">{([["watermark",Stamp],["page-numbers",Type],["header-footer",FilePlus2],["signature",Type],["annotation",Highlighter],["crop",Crop],["remove-metadata",ShieldCheck]] as const).map(([type,Icon])=><button key={type} className={tool===type?"active":""} onClick={()=>{setTool(type);if(type==="signature"&&text==="DRAFT")setText("")}}><Icon/>{actionName[type]}</button>)}</div><div className="inspector-fields"><label>ACTION SCOPE<select value={scope} onChange={event=>setScope(event.target.value as typeof scope)}><option value="selected">Selected pages ({selected.size})</option><option value="all">All pages ({plan.length})</option></select></label>
        {tool==="watermark"&&<label>WATERMARK TEXT<input value={text} onChange={event=>setText(event.target.value)} placeholder="DRAFT"/></label>}
        {tool==="page-numbers"&&<label>POSITION<select value={position} onChange={event=>setPosition(event.target.value as typeof position)}><option value="bottom">Bottom centre</option><option value="top">Top centre</option></select></label>}
        {tool==="header-footer"&&<><label>HEADER<input value={text} onChange={event=>setText(event.target.value)} placeholder="Document title"/></label><label>FOOTER<input value={secondary} onChange={event=>setSecondary(event.target.value)} placeholder="Confidential"/></label></>}
        {tool==="signature"&&<><label>TYPED SIGNATURE<input value={text} onChange={event=>setText(event.target.value)} placeholder="Your name"/></label><canvas ref={canvas} width={480} height={150} onPointerDown={beginDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerCancel={endDraw} aria-label="Draw a signature"/><div className="studio-signature-actions"><button onClick={()=>signatureInput.current?.click()}><ImagePlus/> IMPORT IMAGE</button><button onClick={()=>{canvas.current?.getContext("2d")?.clearRect(0,0,480,150);setSignatureImage("")}}>CLEAR</button></div>{signatureImage&&<div className="studio-signature-preview"><img src={signatureImage} alt="Prepared signature"/></div>}<div className="coordinate-row"><label>LEFT %<input type="number" min="0" max="90" value={signatureX} onChange={event=>setSignatureX(Number(event.target.value))}/></label><label>TOP %<input type="number" min="0" max="90" value={signatureTop} onChange={event=>setSignatureTop(Number(event.target.value))}/></label></div><label>WIDTH %<input type="range" min="5" max="80" value={signatureWidth} onChange={event=>setSignatureWidth(Number(event.target.value))}/></label><div className="coordinate-row"><label>ROTATE °<input type="number" min="-180" max="180" value={signatureRotation} onChange={event=>setSignatureRotation(Number(event.target.value))}/></label><label>OPACITY %<input type="number" min="25" max="100" value={Math.round(signatureOpacity*100)} onChange={event=>setSignatureOpacity(Number(event.target.value)/100)}/></label></div><Link className="precision-sign-link" href="/tools/sign">OPEN PRECISION SIGNER FOR DRAG + RESIZE</Link><small>Visible signature only. Certificate/DSC signing is a separate cryptographic workflow.</small></>}
        {tool==="annotation"&&<><label>NOTE TEXT<input value={text} onChange={event=>setText(event.target.value)} placeholder="Optional note"/></label><label className="check-row"><input type="checkbox" checked={highlight} onChange={event=>setHighlight(event.target.checked)}/> TRANSLUCENT HIGHLIGHT</label><div className="coordinate-row"><label>LEFT %<input type="number" min="0" max="75" value={annotationX} onChange={event=>setAnnotationX(Number(event.target.value))}/></label><label>TOP %<input type="number" min="5" max="90" value={annotationTop} onChange={event=>setAnnotationTop(Number(event.target.value))}/></label></div></>}
        {tool==="crop"&&<label>CROP MARGIN (PT)<input type="number" min="0" max="200" value={margin} onChange={event=>setMargin(Number(event.target.value))}/></label>}
        {tool==="remove-metadata"&&<p>Clears common title, author, subject, keyword, creator, and producer fields from the final document.</p>}
        <button className="queue-button" onClick={addAction}><Plus/> ADD TO WORKFLOW</button></div>
        <div className="workflow-list"><div><strong>WORKFLOW</strong><span>{actions.length} ACTIONS</span></div>{actions.length===0?<p>No edits queued yet. Page organization and rotation are already live.</p>:actions.map((action,index)=><article key={action.id}><b>{String(index+1).padStart(2,"0")}</b><span><strong>{actionName[action.type]}</strong><small>{action.targetIds.length} page{action.targetIds.length===1?"":"s"}</small></span><button onClick={()=>setActions(current=>current.filter(item=>item.id!==action.id))} aria-label={`Remove ${actionName[action.type]}`}><X/></button></article>)}</div>
      </aside>
      <div className="studio-export">{error&&<div className="feedback error"><X/>{error}</div>}{notice&&<div className="feedback success"><Check/>{notice}</div>}<button onClick={()=>void exportPdf()} disabled={busy||!plan.length}>{busy?<LoaderCircle className="spin"/>:<Download/>} {busy?"BUILDING YOUR PDF…":`EXPORT PDF · ${plan.length} PAGES · ${actions.length} ACTIONS`}</button><p><ShieldCheck/> One local session. One final download. Source files remain unchanged.</p></div>
    </section>}
  </main>
}
