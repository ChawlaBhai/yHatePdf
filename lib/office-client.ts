"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { downloadBlob, htmlToPdf, outputName, readTextPages, readTextRows, renderPageImages } from "@/lib/pdf-client";

/** Office exports intentionally choose either editable text/data or visual fidelity and state that trade-off in the UI. */
export async function pdfToWord(file: File, indices: number[]) {
  if (!indices.length) throw new Error("Select at least one page.");
  const { Document, HeadingLevel, Packer, Paragraph } = await import("docx");
  const pages = await readTextPages(file, indices);
  const children = pages.flatMap((text, index) => [
    new Paragraph({ text: `Source page ${indices[index] + 1}`, heading: HeadingLevel.HEADING_1, pageBreakBefore: index > 0 }),
    ...text.split(/\n\s*\n/).map(value => new Paragraph({ text: value || " " })),
  ]);
  const document = new Document({ sections: [{ children }] });
  downloadBlob(await Packer.toBlob(document), outputName("editable-text", [file], `${pages.length}-pages`, "docx"));
  return pages.length;
}

export async function wordToPdf(file: File) {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  if (!result.value.trim()) throw new Error("No supported text was found in this Word document.");
  return htmlToPdf(result.value, [file]);
}

async function powerPointSlides(file:File){const JSZip=(await import("jszip")).default;const zip=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a,b)=>Number(a.match(/\d+/)?.[0])-Number(b.match(/\d+/)?.[0]));const parser=new DOMParser();const slides:string[][]=[];for(const name of names){const xml=await zip.file(name)!.async("string");const document=parser.parseFromString(xml,"application/xml");slides.push(Array.from(document.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main","t")).map(node=>node.textContent?.trim()||"").filter(Boolean));}return slides;}

export async function previewOfficeFile(file: File, kind: "word" | "excel" | "powerpoint") {
  if (kind === "word") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.slice(0, 5000) || "No readable paragraphs found.";
  }
  if(kind==="powerpoint"){const slides=await powerPointSlides(file);return slides.slice(0,12).map((lines,index)=>`SLIDE ${index+1}\n${lines.join(" · ")||"No selectable text"}`).join("\n\n").slice(0,5000)||"No readable slides found.";}
  const ExcelJS = (await import("exceljs")).default; const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer() as never);
  return workbook.worksheets.map(sheet => {
    const rows: string[] = [];
    sheet.eachRow({ includeEmpty: false }, row => { if (rows.length < 12) rows.push(Array.from({ length: Math.min(sheet.columnCount, 8) }, (_, i) => printable(row.getCell(i + 1).value)).join("  |  ")); });
    return `${sheet.name} (${sheet.rowCount} rows)\n${rows.join("\n")}`;
  }).join("\n\n").slice(0, 5000) || "No populated sheets found.";
}

export async function powerPointToPdf(file:File){const slides=await powerPointSlides(file);if(!slides.length)throw new Error("No supported PPTX slides were found.");const pdf=await PDFDocument.create();const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);for(const [index,lines] of slides.entries()){const page=pdf.addPage([960,540]);page.drawRectangle({x:0,y:0,width:960,height:540,color:rgb(1,1,1)});page.drawText(`SLIDE ${index+1}`,{x:46,y:490,size:11,font:bold,color:rgb(.35,.35,.38)});let y=438;for(const [lineIndex,raw] of lines.entries()){let text=raw.replace(/[^\x20-\x7E]/g,"?").replace(/\s+/g," ").slice(0,260);const size=lineIndex===0?28:17;const font=lineIndex===0?bold:regular;const chunks:string[]=[];while(text){let take=text.length;while(take>1&&font.widthOfTextAtSize(text.slice(0,take),size)>860)take--;chunks.push(text.slice(0,take));text=text.slice(take).trim();}for(const chunk of chunks){if(y<45)break;page.drawText(chunk,{x:50,y,size,font,color:rgb(.08,.08,.1)});y-=size*1.5;}if(y<45)break;}}const saved=await pdf.save();const bytes=new Uint8Array(saved.length);bytes.set(saved);downloadBlob(new Blob([bytes],{type:"application/pdf"}),outputName("slides",[file],`${slides.length}-slides__text-layout`));return slides.length;}

export async function pdfToPowerPoint(file: File, indices: number[]) {
  if (!indices.length) throw new Error("Select at least one page.");
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PDF_PAGE", width: 8.5, height: 11 }); pptx.layout = "PDF_PAGE";
  const images = await renderPageImages(file, indices, 1.25);
  for (const image of images) {
    const slide = pptx.addSlide(); const scale = Math.min(8.5 / image.width, 11 / image.height);
    const width = image.width * scale, height = image.height * scale;
    slide.addImage({ data: image.data, x: (8.5 - width) / 2, y: (11 - height) / 2, w: width, h: height, altText: `PDF source page ${image.page}` });
  }
  const result = await pptx.write({ outputType: "blob" });
  downloadBlob(result as Blob, outputName("visual-slides", [file], `${images.length}-slides`, "pptx"));
  return images.length;
}

export async function pdfToExcel(file: File, indices: number[]) {
  if (!indices.length) throw new Error("Select at least one page.");
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook(); const pages = await readTextRows(file, indices);
  pages.forEach((rows, index) => {
    const sheet = workbook.addWorksheet(`Page ${indices[index] + 1}`);
    for (const row of rows) sheet.addRow(row);
    sheet.columns.forEach(column => { column.width = Math.min(60, Math.max(16, (column.values || []).reduce<number>((longest, value) => Math.max(longest, String(value ?? "").length), 0) + 2)); });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), outputName("text-grid", [file], `${pages.length}-pages`, "xlsx"));
  return pages.length;
}

function printable(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("result" in value) return printable(value.result);
    if ("text" in value) return printable(value.text);
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part: { text?: string }) => part.text || "").join("");
  }
  return String(value);
}

export async function excelToPdf(file: File) {
  const ExcelJS = (await import("exceljs")).default; const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer() as never);
  const pdf = await PDFDocument.create(); const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let sheetCount = 0;
  workbook.eachSheet(sheet => {
    sheetCount++;
    let page = pdf.addPage([842, 595]), y = 545;
    const title = sheet.name.replace(/[^\x20-\x7E]/g, "?").slice(0, 70);
    page.drawText(title, { x: 34, y, font: bold, size: 17, color: rgb(.1, .1, .1) }); y -= 27;
    sheet.eachRow({ includeEmpty: false }, row => {
      const cells: string[] = [];
      for (let i = 1; i <= Math.min(sheet.columnCount, 12); i++) cells.push(printable(row.getCell(i).value).replace(/[^\x20-\x7E]/g, "?").replace(/\s+/g, " "));
      if (!cells.some(Boolean)) return;
      if (y < 32) { page = pdf.addPage([842, 595]); y = 545; page.drawText(title, { x: 34, y, font: bold, size: 14 }); y -= 25; }
      const width = 774 / Math.max(1, cells.length); const height = 23;
      page.drawRectangle({ x: 34, y: y - 8, width: 774, height, borderColor: rgb(.65,.65,.65), borderWidth: .4, color: row.number % 2 ? rgb(.97,.97,.98) : rgb(1,1,1) });
      cells.forEach((cell, index) => { let text = cell; while (text && regular.widthOfTextAtSize(text, 8) > width - 9) text = text.slice(0, -1); if (text !== cell) text = text.slice(0, -1) + "..."; page.drawText(text, { x: 38 + index * width, y: y + 1, font: regular, size: 8 }); });
      y -= height;
    });
  });
  if (!sheetCount) throw new Error("This Excel workbook has no visible sheets.");
  const saved = await pdf.save(); const bytes = new Uint8Array(saved.length); bytes.set(saved);
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), outputName("spreadsheet", [file], `${sheetCount}-sheets`));
  return sheetCount;
}
