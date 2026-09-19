"use client";

import JSZip from "jszip";
import { PDFDocument, degrees as toDegrees } from "pdf-lib";

export type PagePlanItem = { id: string; fileIndex: number; pageIndex: number; rotation: number };
export type PdfPageInfo = { fileIndex: number; pageIndex: number; thumbnail: string };

const safePart = (value: string) => value.toLowerCase().replace(/\.pdf$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "document";
const localName = (operation: string, files: File[], detail?: string, extension = "pdf") => `yhatepdf_${operation}__${files.slice(0, 2).map((file) => safePart(file.name)).join("-") || "document"}${detail ? `__${detail}` : ""}.${extension}`;
const download = (blob: Blob, filename: string) => { const href = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = href; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(href), 1500); };
const loadPdfJs = () => import("pdfjs-dist/legacy/build/pdf.mjs");

export async function buildPagePlan(files: File[]) {
  const plan: PagePlanItem[] = [];
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const pdf = await PDFDocument.load(await files[fileIndex].arrayBuffer());
    for (let pageIndex = 0; pageIndex < pdf.getPageCount(); pageIndex += 1) plan.push({ id: `${fileIndex}-${pageIndex}-${crypto.randomUUID()}`, fileIndex, pageIndex, rotation: 0 });
  }
  return plan;
}

export async function createThumbnails(files: File[], onPage: (page: PdfPageInfo) => void) {
  const pdfjs = await loadPdfJs();
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const task = pdfjs.getDocument({ data: new Uint8Array(await files[fileIndex].arrayBuffer()), disableWorker: true });
    const pdf = await task.promise;
    for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex + 1); const viewport = page.getViewport({ scale: 0.3 }); const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d"); if (!context) continue;
      await page.render({ canvasContext: context, viewport }).promise; onPage({ fileIndex, pageIndex, thumbnail: canvas.toDataURL("image/jpeg", 0.72) });
    }
    await task.destroy();
  }
}

async function sourcePdfs(files: File[]) { return Promise.all(files.map(async (file) => PDFDocument.load(await file.arrayBuffer()))); }
export async function exportPagePlan(files: File[], plan: PagePlanItem[], operation = "merged") {
  if (!plan.length) throw new Error("Keep at least one page in the output."); const sources = await sourcePdfs(files); const output = await PDFDocument.create();
  for (const item of plan) { const [page] = await output.copyPages(sources[item.fileIndex], [item.pageIndex]); if (item.rotation) page.setRotation(toDegrees(item.rotation)); output.addPage(page); }
  download(new Blob([await output.save()], { type: "application/pdf" }), localName(operation, files, `${plan.length}-pages`));
}
export async function exportSplit(files: File[], selected: PagePlanItem[], separatePages: boolean) {
  if (!selected.length) throw new Error("Select one or more pages to split."); if (!separatePages) return exportPagePlan(files, selected, "split"); const sources = await sourcePdfs(files); const archive = new JSZip();
  for (let index = 0; index < selected.length; index += 1) { const item = selected[index]; const output = await PDFDocument.create(); const [page] = await output.copyPages(sources[item.fileIndex], [item.pageIndex]); if (item.rotation) page.setRotation(toDegrees(item.rotation)); output.addPage(page); archive.file(localName("split", [files[item.fileIndex]], `page-${item.pageIndex + 1}`), await output.save()); }
  download(await archive.generateAsync({ type: "blob" }), localName("split", files, `${selected.length}-pages`, "zip"));
}
export async function imagesToPdf(files: File[]) { const pdf = await PDFDocument.create(); for (const file of files) { const bytes = await file.arrayBuffer(); const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes); const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height }); } download(new Blob([await pdf.save()], { type: "application/pdf" }), localName("images", files, `${files.length}-images`)); }
export async function extractText(file: File) { const pdfjs = await loadPdfJs(); const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableWorker: true }); const document = await task.promise; const pages: string[] = []; for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) { const page = await document.getPage(pageNumber); const text = await page.getTextContent(); pages.push(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")); } await task.destroy(); download(new Blob([pages.join("\n\n\f\n\n")], { type: "text/plain;charset=utf-8" }), localName("text", [file], undefined, "txt")); return document.numPages; }
