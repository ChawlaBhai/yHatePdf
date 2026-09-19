"use client";

import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export type PagePlanItem = { id: string; fileIndex: number; pageIndex: number; rotation: number };
export type PdfPageInfo = { fileIndex: number; pageIndex: number; thumbnail: string; width: number; height: number };
export type ExportOptions = { text?: string; secondaryText?: string; position?: "top" | "bottom"; margin?: number; paper?: "A4" | "Letter" | "A5"; opacity?: number; quality?: number; selectedIds?: string[] };

const stem = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 52) || "document";
export const outputName = (operation: string, files: File[], detail = "", extension = "pdf") => `yhatepdf_${operation}__${files.slice(0, 2).map((file) => stem(file.name)).join("-") || "document"}${detail ? `__${detail}` : ""}.${extension}`;
export function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 5000); }
const downloadPdf = async (pdf: PDFDocument, operation: string, files: File[], detail = "") => { const bytes = await pdf.save(); const buffer = new ArrayBuffer(bytes.length); new Uint8Array(buffer).set(bytes); downloadBlob(new Blob([buffer], { type: "application/pdf" }), outputName(operation, files, detail)); };

async function pdfjs() {
  const library = await import("pdfjs-dist");
  library.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return library;
}

export async function appendPagePlan(files: File[], startIndex = 0): Promise<PagePlanItem[]> {
  const additions: PagePlanItem[] = [];
  for (let fileIndex = startIndex; fileIndex < files.length; fileIndex += 1) {
    const document = await PDFDocument.load(await files[fileIndex].arrayBuffer());
    for (let pageIndex = 0; pageIndex < document.getPageCount(); pageIndex += 1) additions.push({ id: crypto.randomUUID(), fileIndex, pageIndex, rotation: 0 });
  }
  return additions;
}

export async function createThumbnails(files: File[], startIndex: number, onPage: (info: PdfPageInfo) => void) {
  const library = await pdfjs();
  for (let fileIndex = startIndex; fileIndex < files.length; fileIndex += 1) {
    const loading = library.getDocument({ data: new Uint8Array(await files[fileIndex].arrayBuffer()), useSystemFonts: true });
    const document = await loading.promise;
    try {
      for (let pageIndex = 0; pageIndex < document.numPages; pageIndex += 1) {
        const page = await document.getPage(pageIndex + 1);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.2, 184 / natural.width) });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas preview is not available in this browser.");
        await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
        onPage({ fileIndex, pageIndex, thumbnail: canvas.toDataURL("image/jpeg", 0.82), width: natural.width, height: natural.height });
        page.cleanup();
      }
    } finally { await loading.destroy(); }
  }
}

export async function renderFullPreview(file: File, pageIndex: number) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  try { const pdf = await loading.promise; const page = await pdf.getPage(pageIndex + 1); const natural = page.getViewport({ scale: 1 }); const viewport = page.getViewport({ scale: Math.min(2, 760 / natural.width) }); const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Canvas preview is unavailable."); await page.render({canvas,canvasContext:context,viewport,background:"white"}).promise; return canvas.toDataURL("image/png"); } finally { await loading.destroy(); }
}

const sourcesFor = (files: File[]) => Promise.all(files.map(async (file) => PDFDocument.load(await file.arrayBuffer())));
async function assemble(files: File[], plan: PagePlanItem[], flatten = false) {
  if (!plan.length) throw new Error("Select at least one page before exporting.");
  const sources = await sourcesFor(files);
  if (flatten) for (const source of sources) source.getForm().flatten();
  const output = await PDFDocument.create();
  for (const item of plan) {
    const source = sources[item.fileIndex];
    if (!source || item.pageIndex >= source.getPageCount()) throw new Error("A source page is no longer available. Please reload the files.");
    const [page] = await output.copyPages(source, [item.pageIndex]);
    page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
    output.addPage(page);
  }
  return output;
}

export async function exportPagePlan(files: File[], plan: PagePlanItem[], operation: string) { await downloadPdf(await assemble(files, plan), operation, files, `${plan.length}-pages`); }
export async function exportSplit(files: File[], plan: PagePlanItem[], separate: boolean) {
  if (!plan.length) throw new Error("Select at least one page to split.");
  if (!separate) return exportPagePlan(files, plan, "split");
  const sources = await sourcesFor(files); const zip = new JSZip();
  for (const [outputIndex,item] of plan.entries()) { const pdf = await PDFDocument.create(); const [page] = await pdf.copyPages(sources[item.fileIndex], [item.pageIndex]); page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360)); pdf.addPage(page); zip.file(outputName("split", [files[item.fileIndex]], `part-${outputIndex + 1}__source-page-${item.pageIndex + 1}`), await pdf.save()); }
  downloadBlob(await zip.generateAsync({ type: "blob" }), outputName("split", files, `${plan.length}-individual-pages`, "zip"));
}

export async function exportAdjusted(files: File[], plan: PagePlanItem[], operation: string, options: ExportOptions) {
  if (operation === "flatten") { const pdf = await assemble(files, plan, true); return downloadPdf(pdf, "flattened", files); }
  if (operation === "metadata") { const pdf = await PDFDocument.load(await files[0].arrayBuffer()); return ["Title", pdf.getTitle() || "—", "Author", pdf.getAuthor() || "—", "Subject", pdf.getSubject() || "—", "Creator", pdf.getCreator() || "—", "Pages", String(pdf.getPageCount())].reduce<Record<string, string>>((result, entry, index, array) => { if (index % 2 === 0) result[entry] = array[index + 1]; return result; }, {}); }
  const pdf = await assemble(files, plan); const pages = pdf.getPages(); const targets = new Set(options.selectedIds ?? plan.map(item => item.id));
  if (operation === "remove-metadata") { pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject(""); pdf.setKeywords([]); pdf.setCreator(""); pdf.setProducer(""); pdf.setCreationDate(new Date(0)); pdf.setModificationDate(new Date(0)); }
  if (["page-numbers", "watermark", "headers-footers"].includes(operation)) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pages.forEach((page, index) => { if (!targets.has(plan[index].id)) return; const { width, height } = page.getSize(); const text = operation === "page-numbers" ? `${index + 1} / ${pages.length}` : options.text?.trim() || ""; if (!text) return; const size = operation === "watermark" ? 30 : 10; const textWidth = font.widthOfTextAtSize(text, size); const x = (width - textWidth) / 2; const y = operation === "watermark" ? height / 2 : options.position === "top" ? height - 25 : 18; page.drawText(text, { x: Math.max(10, x), y, size, font, color: rgb(0.2, 0.2, 0.2), opacity: operation === "watermark" ? options.opacity ?? 0.32 : 1, rotate: operation === "watermark" ? degrees(35) : undefined }); if (operation === "headers-footers" && options.secondaryText) page.drawText(options.secondaryText, { x: 24, y: 18, size: 9, font, color: rgb(0.3, 0.3, 0.3) }); });
  }
  if (operation === "crop") { const margin = Number(options.margin ?? 18); pages.forEach((page,index) => { if (!targets.has(plan[index].id)) return; const { width, height } = page.getSize(); if (margin * 2 >= Math.min(width, height)) throw new Error("The crop margin is larger than the page."); page.setCropBox(margin, margin, width - margin * 2, height - margin * 2); }); }
  if (operation === "resize") { const dimensions = options.paper === "Letter" ? [612, 792] : options.paper === "A5" ? [420, 595] : [595, 842]; const resized = await PDFDocument.create(); for (const [index,page] of pages.entries()) { if (!targets.has(plan[index].id)) { const [untouched] = await resized.copyPages(pdf,[index]); resized.addPage(untouched); continue; } const embedded = await resized.embedPage(page); const target = resized.addPage(dimensions as [number, number]); const scale = Math.min(dimensions[0] / page.getWidth(), dimensions[1] / page.getHeight()); target.drawPage(embedded, { x: (dimensions[0] - page.getWidth() * scale) / 2, y: (dimensions[1] - page.getHeight() * scale) / 2, width: page.getWidth() * scale, height: page.getHeight() * scale }); } return downloadPdf(resized, "resized", files, options.paper || "A4"); }
  await downloadPdf(pdf, operation, files, `${pages.length}-pages`);
}

async function renderedPages(file: File, indices: number[], scale: number, onImage: (pageNumber: number, canvas: HTMLCanvasElement, size: {width:number;height:number}) => Promise<void>) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true }); const pdf = await loading.promise;
  try { for (const index of indices) { const page = await pdf.getPage(index + 1); const natural=page.getViewport({scale:1}); const viewport = page.getViewport({ scale }); const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Canvas is unavailable."); await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise; await onImage(index + 1, canvas,{width:natural.width,height:natural.height}); page.cleanup(); } } finally { await loading.destroy(); }
}
const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode the rendered page.")), type, quality));

export async function exportImages(file: File, indices: number[], format: "jpeg" | "png", scale = 1.6, forceZip = false) {
  if (!indices.length) throw new Error("Select one or more pages."); const mime = `image/${format}`; const extension = format === "jpeg" ? "jpg" : "png"; const zip = new JSZip(); let single: Blob | null = null;
  let outputIndex = 0; await renderedPages(file, indices, scale, async (page, canvas) => { outputIndex++; const blob = await canvasBlob(canvas, mime, 0.88); if (indices.length === 1 && !forceZip) single = blob; else zip.file(outputName("page", [file], `image-${outputIndex}__source-page-${page}`, extension), await blob.arrayBuffer()); });
  if (single) downloadBlob(single, outputName("page", [file], `${indices[0] + 1}`, extension)); else downloadBlob(await zip.generateAsync({ type: "blob" }), outputName("pages", [file], `${indices.length}-${extension}`, "zip"));
}

async function rasterDocument(file: File, indices: number[], mode: "grayscale" | "invert" | "compress", quality: number) {
  const pdf = await PDFDocument.create(); await renderedPages(file, indices, mode === "compress" ? 1.15 : 1.5, async (_page, canvas, size) => { const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable."); if (mode !== "compress") { const data = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < data.data.length; i += 4) { const value = mode === "grayscale" ? Math.round(data.data[i] * .299 + data.data[i + 1] * .587 + data.data[i + 2] * .114) : 255 - data.data[i]; data.data[i] = value; data.data[i + 1] = mode === "grayscale" ? value : 255 - data.data[i + 1]; data.data[i + 2] = mode === "grayscale" ? value : 255 - data.data[i + 2]; } context.putImageData(data, 0, 0); } const image = await pdf.embedJpg(await (await canvasBlob(canvas, "image/jpeg", quality)).arrayBuffer()); const outputPage = pdf.addPage([size.width, size.height]); outputPage.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height }); }); return pdf;
}
export async function exportRasterPdf(file: File, indices: number[], mode: "grayscale" | "invert", quality = 0.7) { await downloadPdf(await rasterDocument(file,indices,mode,quality),mode,[file],`${indices.length}-pages`); }
export async function compressPdf(file: File, allowRaster: boolean, quality: number) { const original = new Uint8Array(await file.arrayBuffer()); const source=await PDFDocument.load(original); let best:Uint8Array<ArrayBufferLike>=original; let method="original"; const optimized=await source.save({useObjectStreams:true}); if(optimized.length<best.length){best=optimized;method="lossless rewrite";} if(allowRaster){const pages=Array.from({length:source.getPageCount()},(_,index)=>index); const raster=await rasterDocument(file,pages,"compress",quality);const candidate=await raster.save({useObjectStreams:true});if(candidate.length<best.length){best=candidate;method="image recompression";}} const buffer=new ArrayBuffer(best.length);new Uint8Array(buffer).set(best); const savings=Math.max(0,Math.round((1-best.length/original.length)*100));downloadBlob(new Blob([buffer],{type:"application/pdf"}),outputName(savings?"compressed":"optimized",[file],savings?`${savings}-percent-smaller`:"no-size-gain"));return {savings,method}; }

async function readTextPages(file: File, indices?: number[]) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true }); const pdf = await loading.promise; const pages: string[] = [];
  try { for (const number of indices ?? Array.from({length:pdf.numPages},(_,index)=>index)) { const page = await pdf.getPage(number+1); const content = await page.getTextContent(); const text = content.items.map((item) => "str" in item ? item.str : "").join(" ").trim(); pages.push(text); } } finally { await loading.destroy(); }
  return pages;
}
export async function extractText(file: File, markdown = false, indices?: number[]) { const pages = await readTextPages(file,indices); const content = markdown ? pages.map((page,index)=>`## Page ${(indices?.[index]??index)+1}\n\n${page}`).join("\n\n---\n\n") : pages.join("\n\n\f\n\n"); const extension = markdown ? "md" : "txt"; downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), outputName(markdown ? "markdown" : "text", [file], `${pages.length}-pages`, extension)); return pages.length; }
export async function exportHtml(file: File, indices?: number[]) { const pages=await readTextPages(file,indices); const escape=(value:string)=>value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]!); const sections=pages.map((page,index)=>`<section class="page" aria-label="Page ${(indices?.[index]??index)+1}"><h2>Page ${(indices?.[index]??index)+1}</h2><p>${escape(page)}</p></section>`).join("\n"); const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(file.name)}</title><style>body{font:17px/1.7 system-ui,sans-serif;max-width:760px;margin:3rem auto;padding:0 1rem;color:#111}.page{border-bottom:1px solid #ddd;padding:1rem 0 2rem}.page p{white-space:pre-wrap}</style></head><body><h1>${escape(file.name)}</h1>${sections}</body></html>`; downloadBlob(new Blob([html],{type:"text/html;charset=utf-8"}),outputName("html",[file],`${pages.length}-pages`,"html")); return pages.length; }

async function imageBytes(file: File) { if (file.type === "image/jpeg" || file.type === "image/png") return { bytes: await file.arrayBuffer(), type: file.type }; const image = await createImageBitmap(file); const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; canvas.getContext("2d")?.drawImage(image, 0, 0); image.close(); return { bytes: await canvasBlob(canvas, "image/png"), type: "image/png" }; }
export async function imagesToPdf(files: File[], operation = "images") { if (!files.length) throw new Error("Choose at least one image."); const pdf = await PDFDocument.create(); for (const file of files) { const source = await imageBytes(file); const bytes = source.bytes instanceof Blob ? await source.bytes.arrayBuffer() : source.bytes; const image = source.type === "image/jpeg" ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes); const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height }); } await downloadPdf(pdf, operation, files, `${files.length}-images`); }
export async function createPdf(text: string) { if (!text.trim()) throw new Error("Write some text first."); const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); let page = pdf.addPage([595, 842]); let y = 790; for (const paragraph of text.split("\n")) { const words = paragraph.split(/\s+/); let line = ""; const lines: string[] = []; for (const word of words) { const next = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(next, 12) > 500 && line) { lines.push(line); line = word; } else line = next; } lines.push(line); for (const value of lines) { if (y < 55) { page = pdf.addPage([595, 842]); y = 790; } page.drawText(value, { x: 48, y, size: 12, font, color: rgb(0.08, 0.08, 0.09) }); y -= 20; } y -= 9; } await downloadPdf(pdf, "created", [], `${pdf.getPageCount()}-pages`); }

function parseCsv(value: string) { const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false; for (let i=0;i<value.length;i++) { const char=value[i]; if (char==='"') { if (quoted&&value[i+1]==='"') { field+='"'; i++; } else quoted=!quoted; } else if (char===","&&!quoted) { row.push(field); field=""; } else if ((char==="\n"||char==="\r")&&!quoted) { if(char==="\r"&&value[i+1]==="\n")i++; row.push(field); if(row.some(cell=>cell.trim()))rows.push(row); row=[]; field=""; } else field+=char; } row.push(field); if(row.some(cell=>cell.trim()))rows.push(row); return rows; }
export async function csvToPdf(value: string, files: File[]) { const rows=parseCsv(value); if(!rows.length)throw new Error("This CSV has no rows to export."); const columns=Math.min(10,Math.max(...rows.map(row=>row.length))); const pdf=await PDFDocument.create(); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); let page=pdf.addPage([595,842]); let y=790; const width=500/columns; for(const [index,row] of rows.entries()) { if(y<65) { page=pdf.addPage([595,842]);y=790; } page.drawRectangle({x:45,y:y-11,width:500,height:25,color:index===0?rgb(.88,.9,.95):index%2===0?rgb(.97,.97,.98):rgb(1,1,1),borderColor:rgb(.6,.6,.65),borderWidth:.4}); for(let column=0;column<columns;column++) { const font=index===0?bold:regular; let cell=(row[column]??"").replace(/\s+/g," ").trim(); while(cell&&font.widthOfTextAtSize(cell,9)>width-10)cell=cell.slice(0,-1); if(cell!==(row[column]??"").replace(/\s+/g," ").trim())cell=cell.slice(0,-1)+"…"; page.drawText(cell,{x:49+column*width,y:y-3,size:9,font,color:rgb(.08,.08,.1)}); if(column>0)page.drawLine({start:{x:45+column*width,y:y-11},end:{x:45+column*width,y:y+14},thickness:.4,color:rgb(.6,.6,.65)}); } y-=25; } await downloadPdf(pdf,"csv",files,`${rows.length}-rows`); }
export async function markdownToPdf(value: string, files: File[]) { if(!value.trim())throw new Error("The Markdown file is empty."); const pdf=await PDFDocument.create(); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); let page=pdf.addPage([595,842]); let y=790; for(const raw of value.split(/\r?\n/)) { const heading=/^(#{1,3})\s+(.+)$/.exec(raw); const bullet=/^\s*[-*]\s+(.+)$/.exec(raw); const line=heading?heading[2]:bullet?`- ${bullet[1]}`:raw.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\[(.*?)\]\(.*?\)/g,"$1"); const font=heading?bold:regular; const size=heading?[22,18,15][heading[1].length-1]:11; if(!line.trim()) {y-=10;continue;} let current=""; const wrapped:string[]=[]; for(const word of line.split(/\s+/)) {const next=current?`${current} ${word}`:word;if(current&&font.widthOfTextAtSize(next,size)>500){wrapped.push(current);current=word;}else current=next;}if(current)wrapped.push(current); for(const part of wrapped){if(y<55){page=pdf.addPage([595,842]);y=790;}page.drawText(part,{x:48,y,size,font,color:rgb(.08,.08,.1)});y-=size+7;} if(heading)y-=9; } await downloadPdf(pdf,"markdown",files,`${pdf.getPageCount()}-pages`); }
