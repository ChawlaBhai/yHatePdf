import type { LucideIcon } from "lucide-react";
import { Combine, Scissors, RotateCw, Grid2X2, FileDown, FileText, ImageDown, Type, ShieldCheck, LockKeyhole, PenLine, Stamp, ScanText, Layers3, Crop, FileImage, FilePlus2, Search, Settings2 } from "lucide-react";

export type ToolCategory = "organize" | "convert" | "edit" | "security" | "create" | "utility";
export type ToolStatus = "ready" | "research";
export type Tool = { id: string; name: string; description: string; category: ToolCategory; keywords: string[]; icon: LucideIcon; accept: string; output: string; engine: string; status: ToolStatus; route: string; mobile: boolean; offline: boolean };

export const categories: Record<ToolCategory, { label: string; color: string }> = {
  organize: { label: "Organize", color: "amber" },
  convert: { label: "Convert", color: "blue" },
  edit: { label: "Edit", color: "pink" },
  security: { label: "Security", color: "violet" },
  create: { label: "Create", color: "green" },
  utility: { label: "Utilities", color: "slate" },
};

const pdf = ".pdf,application/pdf";
const img = "image/png,image/jpeg,image/webp";
const metadata: Record<ToolCategory, { icon: LucideIcon; accept: string; output: string; engine: string }> = {
  organize: { icon: Grid2X2, accept: pdf, output: "PDF", engine: "pdf-lib + PDF.js" },
  convert: { icon: FileDown, accept: pdf, output: "PDF", engine: "PDF.js + browser APIs" },
  edit: { icon: PenLine, accept: pdf, output: "PDF", engine: "pdf-lib + PDF.js" },
  security: { icon: ShieldCheck, accept: pdf, output: "PDF", engine: "local PDF engine" },
  create: { icon: FilePlus2, accept: pdf, output: "PDF", engine: "pdf-lib" },
  utility: { icon: Settings2, accept: pdf, output: "PDF", engine: "PDF.js" },
};
const ready = new Set(["merge", "split", "rotate", "organize", "delete-pages", "extract-pages", "reverse-pages", "duplicate-pages", "odd-pages", "even-pages", "crop", "resize", "compress", "page-numbers", "watermark", "headers-footers", "metadata", "remove-metadata", "images-to-pdf", "scan-to-pdf", "pdf-to-text", "pdf-to-markdown", "pdf-to-html", "pdf-to-jpg", "pdf-to-png", "pdf-to-zip", "create-pdf", "markdown-to-pdf", "csv-to-pdf", "grayscale", "invert", "flatten"]);
const make = (id: string, name: string, description: string, category: ToolCategory, keywords: string[], icon?: LucideIcon, accept?: string, output?: string): Tool => ({ id, name, description, category, keywords, icon: icon ?? metadata[category].icon, accept: accept ?? metadata[category].accept, output: output ?? metadata[category].output, engine: ["csv-to-pdf","markdown-to-pdf","create-pdf"].includes(id) ? "pdf-lib + browser File API" : ["images-to-pdf","scan-to-pdf"].includes(id) ? "pdf-lib + Canvas" : metadata[category].engine, status: ready.has(id) ? "ready" : "research", route: `/tools/${id}`, mobile: true, offline: true });

export const tools: Tool[] = [
  make("merge", "Merge PDF", "Combine files and reorder individual pages before export.", "organize", ["combine", "join", "append", "mix"], Combine),
  make("split", "Split PDF", "Choose pages visually or by range; export one PDF or a ZIP.", "organize", ["separate", "range", "extract"], Scissors),
  make("organize", "Organize pages", "Reorder, remove, and duplicate pages on a visual board.", "organize", ["rearrange", "sort", "move"], Grid2X2),
  make("rotate", "Rotate PDF", "Rotate the entire document or selected pages with previews.", "organize", ["turn", "orientation"], RotateCw),
  make("delete-pages", "Delete pages", "Remove specific pages and keep the rest.", "organize", ["remove", "discard"], Scissors),
  make("extract-pages", "Extract pages", "Make a new PDF from selected pages.", "organize", ["select", "pull out"], FileDown),
  make("reverse-pages", "Reverse pages", "Flip the page order in one action.", "organize", ["backwards", "order"], RotateCw),
  make("duplicate-pages", "Duplicate pages", "Make copies of selected pages.", "organize", ["copy", "repeat"], Layers3),
  make("odd-pages", "Extract odd pages", "Keep pages 1, 3, 5 and so on.", "organize", ["odd", "extract"], Grid2X2),
  make("even-pages", "Extract even pages", "Keep pages 2, 4, 6 and so on.", "organize", ["even", "extract"], Grid2X2),
  make("crop", "Crop PDF", "Trim selected pages by a precise margin.", "organize", ["trim", "margin"], Crop),
  make("resize", "Resize pages", "Scale selected pages onto A4, Letter, or A5.", "organize", ["paper size", "a4", "letter"], Grid2X2),
  make("compress", "Compress PDF", "Try lossless optimization or optional image recompression, with an honest size comparison.", "convert", ["smaller", "reduce", "mb"], FileDown),
  make("pdf-to-jpg", "PDF to JPG", "Render selected pages to JPG files.", "convert", ["jpeg", "image", "photo"], FileImage, pdf, "JPG / ZIP"),
  make("pdf-to-png", "PDF to PNG", "Render selected pages to PNG files.", "convert", ["image", "transparent"], FileImage, pdf, "PNG / ZIP"),
  make("pdf-to-zip", "PDF pages to ZIP", "Download every selected page as an image archive.", "convert", ["archive", "images"], FileDown, pdf, "ZIP"),
  make("pdf-to-text", "PDF to text", "Extract the selectable text from your PDF.", "convert", ["txt", "extract words", "copy"], Type, pdf, "TXT"),
  make("pdf-to-markdown", "PDF to Markdown", "Extract text into a page-aware Markdown document.", "convert", ["md", "markdown", "notes"], FileText, pdf, "MD"),
  make("pdf-to-html", "PDF to HTML", "Extract selectable text into page-aware HTML.", "convert", ["web", "markup"], FileText, pdf, "HTML"),
  make("pdf-to-word", "PDF to Word", "Convert PDF structure to editable DOCX.", "convert", ["docx", "office"], FileText, pdf, "DOCX"),
  make("word-to-pdf", "Word to PDF", "Turn a DOCX document into a PDF.", "convert", ["docx", "office"], FileText, ".docx", "PDF"),
  make("excel-to-pdf", "Excel to PDF", "Render spreadsheet pages to PDF.", "convert", ["xlsx", "sheets"], FileText, ".xlsx,.csv", "PDF"),
  make("pdf-to-excel", "PDF to Excel", "Extract structured tables to XLSX.", "convert", ["xlsx", "tables"], FileText, pdf, "XLSX"),
  make("powerpoint-to-pdf", "PowerPoint to PDF", "Render PPTX slides as PDF pages.", "convert", ["pptx", "slides"], FileText, ".pptx", "PDF"),
  make("pdf-to-powerpoint", "PDF to PowerPoint", "Convert PDF pages to editable PPTX.", "convert", ["pptx", "slides"], FileText, pdf, "PPTX"),
  make("html-to-pdf", "HTML to PDF", "Render a local HTML file into PDF.", "convert", ["webpage", "website"], FileText, ".html,.htm", "PDF"),
  make("markdown-to-pdf", "Markdown to PDF", "Turn Markdown headings, lists, and text into a PDF.", "convert", ["md", "notes"], FileText, ".md,.markdown,.txt", "PDF"),
  make("csv-to-pdf", "CSV to PDF", "Make a paginated PDF table from CSV.", "convert", ["spreadsheet", "table"], FileText, ".csv", "PDF"),
  make("images-to-pdf", "Images to PDF", "Combine JPG, PNG, and WebP images into one PDF.", "create", ["jpg", "png", "photo", "scan"], ImageDown, img),
  make("create-pdf", "Create PDF", "Write a new document and download it as PDF.", "create", ["blank", "write", "text"], FilePlus2, "", "PDF"),
  make("scan-to-pdf", "Scan to PDF", "Capture pages with your phone camera, reorder, and save one PDF.", "create", ["camera", "phone"], ScanText, img),
  make("page-numbers", "Add page numbers", "Number pages at the top or bottom.", "edit", ["number", "pagination"], Type),
  make("watermark", "Watermark PDF", "Add a text watermark to selected pages.", "edit", ["stamp", "brand", "draft"], Stamp),
  make("headers-footers", "Headers and footers", "Add repeating text to PDF pages.", "edit", ["heading", "footer"], Type),
  make("sign", "Sign PDF", "Add a drawn or typed signature.", "edit", ["signature", "autograph"], PenLine),
  make("annotate", "Annotate PDF", "Add text, highlights, and drawings.", "edit", ["highlight", "draw", "markup"], PenLine),
  make("edit-pdf", "Edit PDF", "Work with existing content and new objects.", "edit", ["change text", "editor"], PenLine),
  make("flatten", "Flatten PDF", "Flatten form fields into the pages.", "edit", ["forms", "lock layout"], Layers3),
  make("grayscale", "Grayscale PDF", "Convert pages to grayscale images.", "edit", ["black and white", "monochrome"], FileImage),
  make("invert", "Invert PDF", "Invert page colours for dark reading.", "edit", ["dark", "night"], FileImage),
  make("protect", "Protect PDF", "Encrypt a PDF with a password.", "security", ["password", "lock", "encrypt"], LockKeyhole),
  make("unlock", "Unlock PDF", "Remove protection with the correct password.", "security", ["password", "decrypt"], LockKeyhole),
  make("redact", "Redact PDF", "Permanently remove sensitive content.", "security", ["hide text", "blackout", "private"], ShieldCheck),
  make("metadata", "Inspect metadata", "See PDF author, title, dates, and page count.", "security", ["privacy", "properties", "inspect"], Search, pdf, "Report"),
  make("remove-metadata", "Remove metadata", "Clear common identifying PDF metadata.", "security", ["privacy", "clean", "author"], ShieldCheck),
  make("ocr", "Searchable PDF", "Recognize text in scanned pages locally.", "utility", ["ocr", "scan", "recognize"], ScanText),
  make("compare", "Compare PDFs", "Compare two document versions.", "utility", ["diff", "changes"], Layers3),
  make("repair", "Repair PDF", "Recover pages from a damaged document.", "utility", ["fix", "broken"], Settings2),
  make("extract-images", "Extract images", "Save embedded images from a PDF.", "utility", ["pictures", "photos"], FileImage),
  make("remove-blank-pages", "Remove blank pages", "Find and drop empty pages.", "utility", ["empty", "clean"], Scissors),
  make("studio", "PDF Studio", "Open a multi-tool PDF editor and viewer.", "utility", ["edit", "viewer", "workspace"], Grid2X2),
];

export const toolById = (id: string) => tools.find((tool) => tool.id === id);
