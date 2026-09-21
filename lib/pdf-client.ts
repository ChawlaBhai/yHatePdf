"use client";

import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { PDFDocument, PDFImage, StandardFonts, rgb, degrees } from "pdf-lib";

export type PagePlanItem = { id: string; fileIndex: number; pageIndex: number; rotation: number };
export type PdfPageInfo = { fileIndex: number; pageIndex: number; thumbnail: string; width: number; height: number };
export type PlacedSignature = { id: string; pageId: string; image: string; label: string; x: number; top: number; width: number; rotation: number; opacity: number };
export type ExportOptions = { text?: string; secondaryText?: string; position?: "top" | "bottom"; margin?: number; paper?: "A4" | "Letter" | "A5"; opacity?: number; quality?: number; selectedIds?: string[] };

const stem = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 52) || "document";
const clampNumber = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
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

export async function exportSignature(files: File[], plan: PagePlanItem[], selectedIds: string[], mark: { text: string; image?: string; position: "bottom-left" | "bottom-right" | "top-left" | "top-right" }) {
  if (!selectedIds.length) throw new Error("Select at least one page to sign.");
  if (!mark.image && !mark.text.trim()) throw new Error("Type a signature or draw one before export.");
  const pdf = await assemble(files, plan);
  const font = mark.image ? null : await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const image = mark.image ? await pdf.embedPng(mark.image) : null;
  const targets = new Set(selectedIds);
  for (const [index, page] of pdf.getPages().entries()) {
    if (!targets.has(plan[index].id)) continue;
    const { width, height } = page.getSize();
    const maxWidth = Math.min(180, width - 48);
    if (image) {
      const scale = Math.min(maxWidth / image.width, 70 / image.height);
      const w = image.width * scale, h = image.height * scale;
      page.drawImage(image, { x: mark.position.endsWith("right") ? width - w - 28 : 28, y: mark.position.startsWith("top") ? height - h - 28 : 28, width: w, height: h });
    } else if (font) {
      const signature = mark.text.trim();
      let size = 30;
      while (size > 12 && font.widthOfTextAtSize(signature, size) > maxWidth) size -= 1;
      if (font.widthOfTextAtSize(signature, size) > maxWidth) throw new Error("Signature text is too long for this page. Shorten it or draw it.");
      const textWidth = font.widthOfTextAtSize(signature, size);
      page.drawText(signature, { x: mark.position.endsWith("right") ? width - textWidth - 28 : 28, y: mark.position.startsWith("top") ? height - size - 28 : 28, font, size, color: rgb(.08, .16, .34) });
    }
  }
  await downloadPdf(pdf, "visually-signed", files, `${selectedIds.length}-pages`);
}

export async function exportPlacedSignatures(files: File[], plan: PagePlanItem[], placements: PlacedSignature[]) {
  if (!placements.length) throw new Error("Place at least one signature on a page before exporting.");
  const pdf = await assemble(files, plan);
  const imageCache = new Map<string, PDFImage>();
  for (const placement of placements) {
    const pageIndex = plan.findIndex((item) => item.id === placement.pageId);
    if (pageIndex < 0) continue;
    const page = pdf.getPage(pageIndex);
    let image = imageCache.get(placement.image);
    if (!image) { image = await pdf.embedPng(placement.image); imageCache.set(placement.image, image); }
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const width = Math.max(24, pageWidth * placement.width / 100);
    const height = width * image.height / image.width;
    const x = Math.max(0, Math.min(pageWidth - width, pageWidth * placement.x / 100));
    const y = Math.max(0, Math.min(pageHeight - height, pageHeight - pageHeight * placement.top / 100 - height));
    page.drawImage(image, { x, y, width, height, rotate: degrees(placement.rotation), opacity: placement.opacity });
  }
  await downloadPdf(pdf, "signed", files, `${placements.length}-signatures__${new Set(placements.map((item) => item.pageId)).size}-pages`);
}

export async function exportAnnotation(files: File[], plan: PagePlanItem[], selectedIds: string[], annotation: { text: string; x: number; top: number; highlight: boolean }) {
  if (!selectedIds.length) throw new Error("Select at least one page to annotate.");
  if (!annotation.text.trim() && !annotation.highlight) throw new Error("Enter a note or turn on a highlight.");
  const pdf = await assemble(files, plan); const font = await pdf.embedFont(StandardFonts.Helvetica);
  const targets = new Set(selectedIds);
  for (const [index,page] of pdf.getPages().entries()) {
    if (!targets.has(plan[index].id)) continue;
    const { width, height } = page.getSize();
    const x = Math.max(12, Math.min(width - 172, width * annotation.x / 100));
    const y = Math.max(32, Math.min(height - 38, height * (1 - annotation.top / 100)));
    if (annotation.highlight) page.drawRectangle({ x, y: y - 12, width: Math.min(160,width-x-12), height: 27, color: rgb(1,.83,.1), opacity: .34 });
    if (annotation.text.trim()) {
      const safe = annotation.text.trim().replace(/[\r\n]+/g," ");
      let display = safe; while (display && font.widthOfTextAtSize(display, 10) > Math.min(160,width-x-14)) display = display.slice(0,-1);
      if (display !== safe) display = display.slice(0,-3) + "...";
      page.drawText(display, { x: x + 4, y: y + 6, font, size: 10, color: rgb(.12,.16,.27) });
    }
  }
  await downloadPdf(pdf,"annotated",files,`${selectedIds.length}-pages`);
}

export type StudioAction =
  | { id: string; type: "watermark"; targetIds: string[]; text: string }
  | { id: string; type: "page-numbers"; targetIds: string[]; position: "top" | "bottom" }
  | { id: string; type: "header-footer"; targetIds: string[]; text: string; secondaryText: string }
  | { id: string; type: "signature"; targetIds: string[]; text: string; image?: string; position?: "bottom-left" | "bottom-right" | "top-left" | "top-right"; x?: number; top?: number; width?: number; rotation?: number; opacity?: number }
  | { id: string; type: "annotation"; targetIds: string[]; text: string; x: number; top: number; highlight: boolean }
  | { id: string; type: "crop"; targetIds: string[]; margin: number }
  | { id: string; type: "remove-metadata"; targetIds: string[] };

export async function exportStudioPdf(files: File[], plan: PagePlanItem[], actions: StudioAction[]) {
  if (!plan.length) throw new Error("Keep at least one page on the studio canvas.");
  const pdf = await assemble(files, plan);
  const pages = pdf.getPages();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  for (const action of actions) {
    const targets = new Set(action.targetIds.length ? action.targetIds : plan.map((item) => item.id));
    if (action.type === "remove-metadata") {
      pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject(""); pdf.setKeywords([]); pdf.setCreator(""); pdf.setProducer("");
      continue;
    }
    let signatureImage = action.type === "signature" && action.image ? await pdf.embedPng(action.image) : null;
    for (const [index, page] of pages.entries()) {
      if (!targets.has(plan[index].id)) continue;
      const { width, height } = page.getSize();
      if (action.type === "watermark") {
        const text = action.text.trim();
        if (!text) continue;
        let size = 34;
        while (size > 16 && regular.widthOfTextAtSize(text, size) > width - 70) size -= 1;
        const x = Math.max(24, (width - regular.widthOfTextAtSize(text, size)) / 2);
        page.drawText(text, { x, y: height / 2, size, font: regular, color: rgb(.22,.22,.24), opacity: .28, rotate: degrees(35) });
      }
      if (action.type === "page-numbers") {
        const text = `${index + 1} / ${pages.length}`;
        page.drawText(text, { x: (width - regular.widthOfTextAtSize(text, 10)) / 2, y: action.position === "top" ? height - 25 : 18, size: 10, font: regular, color: rgb(.2,.2,.22) });
      }
      if (action.type === "header-footer") {
        if (action.text.trim()) page.drawText(action.text.trim().slice(0, 100), { x: 24, y: height - 25, size: 9, font: regular, color: rgb(.25,.25,.28) });
        if (action.secondaryText.trim()) page.drawText(action.secondaryText.trim().slice(0, 100), { x: 24, y: 18, size: 9, font: regular, color: rgb(.25,.25,.28) });
      }
      if (action.type === "signature") {
        if (signatureImage) {
          const w = action.width ? width * action.width / 100 : Math.min(180, width - 48);
          const h = w * signatureImage.height / signatureImage.width;
          const x = action.x === undefined ? action.position?.endsWith("right") ? width - w - 28 : 28 : clampNumber(width * action.x / 100, 0, width - w);
          const y = action.top === undefined ? action.position?.startsWith("top") ? height - h - 28 : 28 : clampNumber(height - height * action.top / 100 - h, 0, height - h);
          page.drawImage(signatureImage, { x, y, width: w, height: h, rotate: degrees(action.rotation ?? 0), opacity: action.opacity ?? 1 });
        } else if (action.text.trim()) {
          const text = action.text.trim();
          let size = 30; while (size > 12 && italic.widthOfTextAtSize(text, size) > 180) size -= 1;
          const textWidth = italic.widthOfTextAtSize(text, size);
          const x = action.x === undefined ? action.position?.endsWith("right") ? width - textWidth - 28 : 28 : clampNumber(width * action.x / 100, 0, width - textWidth);
          const y = action.top === undefined ? action.position?.startsWith("top") ? height - size - 28 : 28 : clampNumber(height - height * action.top / 100 - size, 0, height - size);
          page.drawText(text, { x, y, size, font: italic, color: rgb(.08,.16,.34), rotate: degrees(action.rotation ?? 0), opacity: action.opacity ?? 1 });
        }
      }
      if (action.type === "annotation") {
        const x = Math.max(12, Math.min(width - 172, width * action.x / 100));
        const y = Math.max(32, Math.min(height - 38, height * (1 - action.top / 100)));
        if (action.highlight) page.drawRectangle({ x, y: y - 12, width: Math.min(160,width-x-12), height: 27, color: rgb(1,.83,.1), opacity: .34 });
        if (action.text.trim()) page.drawText(action.text.trim().replace(/[\r\n]+/g," ").slice(0,72), { x:x+4, y:y+6, size:10, font:regular, color:rgb(.12,.16,.27) });
      }
      if (action.type === "crop") {
        const margin = Math.max(0, action.margin);
        if (margin * 2 >= Math.min(width, height)) throw new Error("One crop action is larger than the target page.");
        page.setCropBox(margin, margin, width - margin * 2, height - margin * 2);
      }
    }
  }
  await downloadPdf(pdf, "studio", files, `${plan.length}-pages__${actions.length}-actions`);
}

async function renderedPages(file: File, indices: number[], scale: number, onImage: (pageNumber: number, canvas: HTMLCanvasElement, size: {width:number;height:number}) => Promise<void>) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true }); const pdf = await loading.promise;
  try { for (const index of indices) { const page = await pdf.getPage(index + 1); const natural=page.getViewport({scale:1}); const viewport = page.getViewport({ scale }); const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Canvas is unavailable."); await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise; await onImage(index + 1, canvas,{width:natural.width,height:natural.height}); page.cleanup(); } } finally { await loading.destroy(); }
}
const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode the rendered page.")), type, quality));

export async function exportImages(file: File, indices: number[], format: "jpeg" | "png" | "webp", scale = 1.6, forceZip = false) {
  if (!indices.length) throw new Error("Select one or more pages."); const mime = `image/${format}`; const extension = format === "jpeg" ? "jpg" : format; const zip = new JSZip(); let single: Blob | null = null;
  let outputIndex = 0; await renderedPages(file, indices, scale, async (page, canvas) => { outputIndex++; const blob = await canvasBlob(canvas, mime, 0.88); if (blob.type !== mime) throw new Error(`${format.toUpperCase()} export is not supported by this browser.`); if (indices.length === 1 && !forceZip) single = blob; else zip.file(outputName("page", [file], `image-${outputIndex}__source-page-${page}`, extension), await blob.arrayBuffer()); });
  if (single) downloadBlob(single, outputName("page", [file], `${indices[0] + 1}`, extension)); else downloadBlob(await zip.generateAsync({ type: "blob" }), outputName("pages", [file], `${indices.length}-${extension}`, "zip"));
}

async function rasterDocument(file: File, indices: number[], mode: "grayscale" | "invert" | "compress", quality: number) {
  const pdf = await PDFDocument.create(); await renderedPages(file, indices, mode === "compress" ? 1.15 : 1.5, async (_page, canvas, size) => { const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable."); if (mode !== "compress") { const data = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < data.data.length; i += 4) { const value = mode === "grayscale" ? Math.round(data.data[i] * .299 + data.data[i + 1] * .587 + data.data[i + 2] * .114) : 255 - data.data[i]; data.data[i] = value; data.data[i + 1] = mode === "grayscale" ? value : 255 - data.data[i + 1]; data.data[i + 2] = mode === "grayscale" ? value : 255 - data.data[i + 2]; } context.putImageData(data, 0, 0); } const image = await pdf.embedJpg(await (await canvasBlob(canvas, "image/jpeg", quality)).arrayBuffer()); const outputPage = pdf.addPage([size.width, size.height]); outputPage.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height }); }); return pdf;
}
export async function exportRasterPdf(file: File, indices: number[], mode: "grayscale" | "invert", quality = 0.7) { await downloadPdf(await rasterDocument(file,indices,mode,quality),mode,[file],`${indices.length}-pages`); }
export async function compressPdf(file: File, allowRaster: boolean, quality: number) { const original = new Uint8Array(await file.arrayBuffer()); const source=await PDFDocument.load(original); let best:Uint8Array<ArrayBufferLike>=original; let method="original"; const optimized=await source.save({useObjectStreams:true}); if(optimized.length<best.length){best=optimized;method="lossless rewrite";} if(allowRaster){const pages=Array.from({length:source.getPageCount()},(_,index)=>index); const raster=await rasterDocument(file,pages,"compress",quality);const candidate=await raster.save({useObjectStreams:true});if(candidate.length<best.length){best=candidate;method="image recompression";}} const buffer=new ArrayBuffer(best.length);new Uint8Array(buffer).set(best); const savings=Math.max(0,Math.round((1-best.length/original.length)*100));downloadBlob(new Blob([buffer],{type:"application/pdf"}),outputName(savings?"compressed":"optimized",[file],savings?`${savings}-percent-smaller`:"no-size-gain"));return {savings,method}; }

export async function readTextPages(file: File, indices?: number[]) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true }); const pdf = await loading.promise; const pages: string[] = [];
  try { for (const number of indices ?? Array.from({length:pdf.numPages},(_,index)=>index)) { const page = await pdf.getPage(number+1); const content = await page.getTextContent(); const text = content.items.map((item) => "str" in item ? item.str : "").join(" ").trim(); pages.push(text); } } finally { await loading.destroy(); }
  return pages;
}
export async function readTextRows(file: File, indices: number[]) {
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  const pdf = await loading.promise; const pages: string[][][] = [];
  try {
    for (const index of indices) {
      const page = await pdf.getPage(index + 1); const content = await page.getTextContent();
      const cells = content.items.filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item && Boolean(item.str.trim())).map(item => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] })).sort((a,b) => b.y - a.y || a.x - b.x);
      const lines: { y: number; cells: { x: number; text: string }[] }[] = [];
      for (const cell of cells) { let line = lines.find(row => Math.abs(row.y - cell.y) < 3); if (!line) { line = { y: cell.y, cells: [] }; lines.push(line); } line.cells.push(cell); }
      pages.push(lines.map(line => line.cells.sort((a,b) => a.x - b.x).map(cell => cell.text)));
    }
  } finally { await loading.destroy(); }
  return pages;
}
export async function renderPageImages(file: File, indices: number[], scale = 1.25) {
  const images: { page: number; data: string; width: number; height: number }[] = [];
  await renderedPages(file, indices, scale, async (page, canvas, size) => { images.push({ page, data: canvas.toDataURL("image/png"), ...size }); });
  return images;
}

export async function extractEmbeddedImages(file: File, indices: number[]) {
  if (!indices.length) throw new Error("Select at least one page.");
  const library = await pdfjs(); const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  const pdf = await loading.promise; const zip = new JSZip(); const seen = new Set<string>(); let count = 0;
  try {
    for (const index of indices) {
      const page = await pdf.getPage(index + 1); const viewport = page.getViewport({ scale: .1 });
      const scratch = document.createElement("canvas"); scratch.width = Math.ceil(viewport.width); scratch.height = Math.ceil(viewport.height);
      const scratchContext = scratch.getContext("2d"); if (!scratchContext) throw new Error("Canvas is unavailable for image inspection.");
      await page.render({ canvas: scratch, canvasContext: scratchContext, viewport }).promise;
      const operations = await page.getOperatorList();
      for (let i = 0; i < operations.fnArray.length; i++) {
        const opcode = operations.fnArray[i];
        if (opcode !== library.OPS.paintImageXObject && opcode !== library.OPS.paintInlineImageXObject) continue;
        const argument = operations.argsArray[i]?.[0];
        const identity = typeof argument === "string" ? argument : `inline-${index}-${i}`;
        if (seen.has(identity)) continue;
        let asset: unknown;
        if (opcode === library.OPS.paintInlineImageXObject) asset = argument;
        else asset = await new Promise((resolve, reject) => { const timeout = window.setTimeout(() => reject(new Error("An embedded image could not be decoded. Try PDF to PNG for this page.")), 4000); try { page.objs.get(argument as string, (value: unknown) => { window.clearTimeout(timeout); resolve(value); }); } catch (cause) { window.clearTimeout(timeout); reject(cause); } });
        if (!asset || typeof asset !== "object") continue;
        const source = asset as { width?: number; height?: number; data?: Uint8Array | Uint8ClampedArray; bitmap?: ImageBitmap };
        if (!source.width || !source.height || source.width > 10000 || source.height > 10000) continue;
        const canvas = document.createElement("canvas"); canvas.width = source.width; canvas.height = source.height;
        const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas is unavailable for image extraction.");
        if (asset instanceof ImageBitmap) context.drawImage(asset, 0, 0);
        else if (source.bitmap instanceof ImageBitmap) context.drawImage(source.bitmap, 0, 0);
        else if (source.data) {
          const rgba = context.createImageData(source.width, source.height); const raw = source.data;
          if (raw.length === source.width * source.height * 4) rgba.data.set(raw);
          else if (raw.length === source.width * source.height * 3) for (let p = 0, q = 0; p < raw.length; p += 3, q += 4) { rgba.data[q] = raw[p]; rgba.data[q + 1] = raw[p + 1]; rgba.data[q + 2] = raw[p + 2]; rgba.data[q + 3] = 255; }
          else continue;
          context.putImageData(rgba, 0, 0);
        } else continue;
        const blob = await canvasBlob(canvas, "image/png"); count++; seen.add(identity);
        zip.file(outputName("embedded-image", [file], `page-${index + 1}__image-${count}`, "png"), await blob.arrayBuffer());
      }
      page.cleanup();
    }
  } finally { await loading.destroy(); }
  if (!count) throw new Error("No supported embedded raster images were found in the selected pages. Page images are available via PDF to PNG.");
  downloadBlob(await zip.generateAsync({ type: "blob" }), outputName("embedded-images", [file], `${count}-images`, "zip"));
  return count;
}
export async function extractText(file: File, markdown = false, indices?: number[]) { const pages = await readTextPages(file,indices); const content = markdown ? pages.map((page,index)=>`## Page ${(indices?.[index]??index)+1}\n\n${page}`).join("\n\n---\n\n") : pages.join("\n\n\f\n\n"); const extension = markdown ? "md" : "txt"; downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), outputName(markdown ? "markdown" : "text", [file], `${pages.length}-pages`, extension)); return pages.length; }
export async function exportHtml(file: File, indices?: number[]) { const pages=await readTextPages(file,indices); const escape=(value:string)=>value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]!); const sections=pages.map((page,index)=>`<section class="page" aria-label="Page ${(indices?.[index]??index)+1}"><h2>Page ${(indices?.[index]??index)+1}</h2><p>${escape(page)}</p></section>`).join("\n"); const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(file.name)}</title><style>body{font:17px/1.7 system-ui,sans-serif;max-width:760px;margin:3rem auto;padding:0 1rem;color:#111}.page{border-bottom:1px solid #ddd;padding:1rem 0 2rem}.page p{white-space:pre-wrap}</style></head><body><h1>${escape(file.name)}</h1>${sections}</body></html>`; downloadBlob(new Blob([html],{type:"text/html;charset=utf-8"}),outputName("html",[file],`${pages.length}-pages`,"html")); return pages.length; }

/** Find pages with no text and nearly white pixels. The result is a suggestion, not an automatic deletion. */
export async function findBlankPages(file: File) {
  const library = await pdfjs();
  const loading = library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  const pdf = await loading.promise;
  const blank: number[] = [];
  try {
    for (let index = 0; index < pdf.numPages; index++) {
      const page = await pdf.getPage(index + 1);
      const content = await page.getTextContent();
      if (content.items.some(item => "str" in item && item.str.trim())) continue;
      const viewport = page.getViewport({ scale: Math.min(.5, 300 / page.getViewport({ scale: 1 }).width) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { willReadFrequently: true, alpha: false });
      if (!context) throw new Error("Canvas is unavailable for blank-page detection.");
      await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonwhite = 0;
      for (let p = 0; p < pixels.length; p += 16) if (pixels[p] < 235 || pixels[p + 1] < 235 || pixels[p + 2] < 235) nonwhite++;
      if (nonwhite / Math.ceil(pixels.length / 16) < .0005) blank.push(index);
      page.cleanup();
    }
  } finally { await loading.destroy(); }
  return blank;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export async function comparePdfs(files: File[]) {
  if (files.length !== 2) throw new Error("Choose exactly two PDF versions to compare.");
  const library = await pdfjs();
  const loadings = await Promise.all(files.map(async file => library.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })));
  const documents = await Promise.all(loadings.map(loading => loading.promise));
  const results: { number: number; first: string; second: string; visual: string; status: string }[] = [];
  try {
    for (let number = 1; number <= Math.max(...documents.map(pdf => pdf.numPages)); number++) {
      const pages = await Promise.all(documents.map(pdf => number <= pdf.numPages ? pdf.getPage(number) : null));
      const texts = await Promise.all(pages.map(async page => page ? (await page.getTextContent()).items.map(item => "str" in item ? item.str : "").join(" ").trim() : ""));
      const pixels = await Promise.all(pages.map(async page => {
        if (!page) return null;
        const natural = page.getViewport({ scale: 1 }); const viewport = page.getViewport({ scale: Math.min(.65, 400 / natural.width) });
        const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true }); if (!context) throw new Error("Canvas comparison is unavailable.");
        await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
        return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      }));
      let visual = "No matching page"; let visualChanged = true;
      if (pixels[0] && pixels[1]) {
        if (pixels[0].width !== pixels[1].width || pixels[0].height !== pixels[1].height) visual = "Different page dimensions";
        else { let changed = 0; const a = pixels[0].data, b = pixels[1].data; for (let p = 0; p < a.length; p += 16) if (Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2]) > 36) changed++; visual = `${(changed / Math.ceil(a.length / 16) * 100).toFixed(1)}% of sampled pixels changed`; visualChanged = changed > 0; }
      }
      const status = !pages[0] ? "Added" : !pages[1] ? "Removed" : texts[0] === texts[1] && !visualChanged ? "Same" : "Changed";
      results.push({ number, first: texts[0], second: texts[1], visual, status });
      pages.forEach(page => page?.cleanup());
    }
  } finally { await Promise.all(loadings.map(loading => loading.destroy())); }
  const rows = results.map(row => `<article><h2>Page ${row.number} — ${row.status}</h2><p>${row.visual}</p><div><section><h3>Original text</h3><pre>${escapeHtml(row.first) || "(none)"}</pre></section><section><h3>Revised text</h3><pre>${escapeHtml(row.second) || "(none)"}</pre></section></div></article>`).join("");
  const report = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PDF comparison</title><style>body{font:16px/1.5 system-ui;margin:3rem auto;padding:0 1rem;max-width:1100px;color:#161616}header{border-bottom:2px solid;padding-bottom:1rem}article{border-bottom:1px solid #bbb;padding:1rem 0}article div{display:grid;grid-template-columns:1fr 1fr;gap:1rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f4;padding:1rem;min-height:4rem}@media(max-width:650px){article div{grid-template-columns:1fr}}</style></head><body><header><h1>PDF comparison</h1><p>${escapeHtml(files[0].name)} → ${escapeHtml(files[1].name)} · ${results.filter(row => row.status !== "Same").length} changed or unmatched pages</p><p>Visual percentages compare small raster samples; text is extracted from selectable text. Review the original files for critical decisions.</p></header>${rows}</body></html>`;
  downloadBlob(new Blob([report], { type: "text/html;charset=utf-8" }), outputName("comparison", files, `${results.length}-pages`, "html"));
  return { pages: results.length, changed: results.filter(row => row.status !== "Same").length };
}

async function imageBytes(file: File) { if (file.type === "image/jpeg" || file.type === "image/png") return { bytes: await file.arrayBuffer(), type: file.type }; const image = await createImageBitmap(file); const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; canvas.getContext("2d")?.drawImage(image, 0, 0); image.close(); return { bytes: await canvasBlob(canvas, "image/png"), type: "image/png" }; }
export async function imagesToPdf(files: File[], operation = "images") { if (!files.length) throw new Error("Choose at least one image."); const pdf = await PDFDocument.create(); for (const file of files) { const source = await imageBytes(file); const bytes = source.bytes instanceof Blob ? await source.bytes.arrayBuffer() : source.bytes; const image = source.type === "image/jpeg" ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes); const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height }); } await downloadPdf(pdf, operation, files, `${files.length}-images`); }
export async function createPdf(text: string) { if (!text.trim()) throw new Error("Write some text first."); const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); let page = pdf.addPage([595, 842]); let y = 790; for (const paragraph of text.split("\n")) { const words = paragraph.split(/\s+/); let line = ""; const lines: string[] = []; for (const word of words) { const next = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(next, 12) > 500 && line) { lines.push(line); line = word; } else line = next; } lines.push(line); for (const value of lines) { if (y < 55) { page = pdf.addPage([595, 842]); y = 790; } page.drawText(value, { x: 48, y, size: 12, font, color: rgb(0.08, 0.08, 0.09) }); y -= 20; } y -= 9; } await downloadPdf(pdf, "created", [], `${pdf.getPageCount()}-pages`); }

function parseCsv(value: string) { const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false; for (let i=0;i<value.length;i++) { const char=value[i]; if (char==='"') { if (quoted&&value[i+1]==='"') { field+='"'; i++; } else quoted=!quoted; } else if (char===","&&!quoted) { row.push(field); field=""; } else if ((char==="\n"||char==="\r")&&!quoted) { if(char==="\r"&&value[i+1]==="\n")i++; row.push(field); if(row.some(cell=>cell.trim()))rows.push(row); row=[]; field=""; } else field+=char; } row.push(field); if(row.some(cell=>cell.trim()))rows.push(row); return rows; }
export async function csvToPdf(value: string, files: File[]) { const rows=parseCsv(value); if(!rows.length)throw new Error("This CSV has no rows to export."); const columns=Math.min(10,Math.max(...rows.map(row=>row.length))); const pdf=await PDFDocument.create(); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); let page=pdf.addPage([595,842]); let y=790; const width=500/columns; for(const [index,row] of rows.entries()) { if(y<65) { page=pdf.addPage([595,842]);y=790; } page.drawRectangle({x:45,y:y-11,width:500,height:25,color:index===0?rgb(.88,.9,.95):index%2===0?rgb(.97,.97,.98):rgb(1,1,1),borderColor:rgb(.6,.6,.65),borderWidth:.4}); for(let column=0;column<columns;column++) { const font=index===0?bold:regular; let cell=(row[column]??"").replace(/\s+/g," ").trim(); while(cell&&font.widthOfTextAtSize(cell,9)>width-10)cell=cell.slice(0,-1); if(cell!==(row[column]??"").replace(/\s+/g," ").trim())cell=cell.slice(0,-1)+"…"; page.drawText(cell,{x:49+column*width,y:y-3,size:9,font,color:rgb(.08,.08,.1)}); if(column>0)page.drawLine({start:{x:45+column*width,y:y-11},end:{x:45+column*width,y:y+14},thickness:.4,color:rgb(.6,.6,.65)}); } y-=25; } await downloadPdf(pdf,"csv",files,`${rows.length}-rows`); }
export async function markdownToPdf(value: string, files: File[]) { if(!value.trim())throw new Error("The Markdown file is empty."); const pdf=await PDFDocument.create(); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); let page=pdf.addPage([595,842]); let y=790; for(const raw of value.split(/\r?\n/)) { const heading=/^(#{1,3})\s+(.+)$/.exec(raw); const bullet=/^\s*[-*]\s+(.+)$/.exec(raw); const line=heading?heading[2]:bullet?`- ${bullet[1]}`:raw.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\[(.*?)\]\(.*?\)/g,"$1"); const font=heading?bold:regular; const size=heading?[22,18,15][heading[1].length-1]:11; if(!line.trim()) {y-=10;continue;} let current=""; const wrapped:string[]=[]; for(const word of line.split(/\s+/)) {const next=current?`${current} ${word}`:word;if(current&&font.widthOfTextAtSize(next,size)>500){wrapped.push(current);current=word;}else current=next;}if(current)wrapped.push(current); for(const part of wrapped){if(y<55){page=pdf.addPage([595,842]);y=790;}page.drawText(part,{x:48,y,size,font,color:rgb(.08,.08,.1)});y-=size+7;} if(heading)y-=9; } await downloadPdf(pdf,"markdown",files,`${pdf.getPageCount()}-pages`); }

/** Preserve semantic local markup only; never load external URLs or execute source scripts. */
export function safeHtmlMarkup(value: string) {
  if (typeof document === "undefined") return "";
  const source = new DOMParser().parseFromString(value, "text/html");
  const allowed = new Set(["h1","h2","h3","h4","h5","h6","p","div","span","br","hr","strong","b","em","i","u","s","ul","ol","li","blockquote","pre","code","table","thead","tbody","tfoot","tr","td","th"]);
  const blocked = new Set(["script","style","link","iframe","object","embed","form","input","button","svg","math","video","audio","img","template"]);
  const clean = document.createElement("div");
  function copy(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
    if (!(node instanceof Element)) return document.createDocumentFragment();
    const tag = node.tagName.toLowerCase(); const fragment = document.createDocumentFragment();
    if (blocked.has(tag)) return fragment;
    const target = allowed.has(tag) ? document.createElement(tag) : fragment;
    for (const child of Array.from(node.childNodes)) target.appendChild(copy(child));
    return target;
  }
  for (const node of Array.from(source.body.childNodes)) clean.appendChild(copy(node));
  return clean.innerHTML;
}

export async function htmlToPdf(value: string, files: File[]) {
  const markup = safeHtmlMarkup(value);
  const plain = new DOMParser().parseFromString(markup, "text/html").body.textContent?.trim();
  if (!plain) throw new Error("This HTML file has no supported text content. Images, scripts, CSS and external assets are intentionally excluded.");
  const frame = document.createElement("div");
  frame.style.cssText = "position:fixed;left:-200vw;top:0;width:760px;padding:38px;background:#fff;color:#161616;font:16px/1.55 Arial,sans-serif;z-index:-1";
  frame.innerHTML = `<style>h1,h2,h3{line-height:1.2;margin:1em 0 .4em}p,li{margin:.4em 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:6px}pre{white-space:pre-wrap;overflow-wrap:anywhere}blockquote{border-left:3px solid #555;padding-left:12px}</style>${markup}`;
  document.body.appendChild(frame);
  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    await pdf.html(frame, { x: 32, y: 32, width: 530, windowWidth: 836, autoPaging: "text", margin: [32, 32, 32, 32] });
    const count = pdf.getNumberOfPages();
    downloadBlob(pdf.output("blob"), outputName("html", files, `${count}-pages`));
    return count;
  } finally { frame.remove(); }
}
