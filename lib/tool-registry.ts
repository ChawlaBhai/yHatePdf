import type { LucideIcon } from "lucide-react";
import { Combine, FileDown, FileText, ImageDown, KeyRound, LockKeyhole, Scissors, ShieldAlert, RotateCw, Type, Stamp, ScanText, Grid2X2 } from "lucide-react";

export type ToolStatus = "ready" | "planned";
export type ToolCategory = "organize" | "convert" | "security" | "edit" | "create";
export type Tool = { id: string; name: string; description: string; category: ToolCategory; keywords: string[]; icon: LucideIcon; accept: string; status: ToolStatus; output: string };

export const categories: Record<ToolCategory, { label: string; color: string }> = {
  organize: { label: "Organize", color: "amber" }, convert: { label: "Convert", color: "blue" }, security: { label: "Security", color: "violet" }, edit: { label: "Edit", color: "pink" }, create: { label: "Create", color: "green" },
};

export const tools: Tool[] = [
  { id: "merge", name: "Merge PDF", description: "Combine PDF files in your chosen order.", category: "organize", keywords: ["combine", "join", "append"], icon: Combine, accept: ".pdf,application/pdf", status: "ready", output: "PDF" },
  { id: "split", name: "Split PDF", description: "Extract a range or save every page separately.", category: "organize", keywords: ["extract", "pages", "separate"], icon: Scissors, accept: ".pdf,application/pdf", status: "ready", output: "PDF or ZIP" },
  { id: "rotate", name: "Rotate PDF", description: "Turn every page 90°, 180°, or 270°.", category: "organize", keywords: ["turn", "orientation", "landscape"], icon: RotateCw, accept: ".pdf,application/pdf", status: "ready", output: "PDF" },
  { id: "extract-text", name: "PDF to text", description: "Pull selectable text out locally.", category: "convert", keywords: ["txt", "copy", "words", "content"], icon: Type, accept: ".pdf,application/pdf", status: "ready", output: "TXT" },
  { id: "images-to-pdf", name: "Images to PDF", description: "Make one clean PDF from local images.", category: "create", keywords: ["jpg", "png", "photos", "scan"], icon: ImageDown, accept: "image/png,image/jpeg", status: "ready", output: "PDF" },
  { id: "compress", name: "Compress PDF", description: "Reduce a file while keeping it usable.", category: "convert", keywords: ["smaller", "reduce", "size", "mb"], icon: FileDown, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "organize", name: "Organize pages", description: "Reorder and remove pages with a visual page plan.", category: "organize", keywords: ["rearrange", "delete", "order"], icon: Grid2X2, accept: ".pdf,application/pdf", status: "ready", output: "PDF" },
  { id: "watermark", name: "Watermark PDF", description: "Add a text or image watermark.", category: "edit", keywords: ["stamp", "brand", "mark"], icon: Stamp, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "protect", name: "Protect PDF", description: "Encrypt a PDF with a password.", category: "security", keywords: ["password", "encrypt", "lock"], icon: LockKeyhole, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "redact", name: "Redact PDF", description: "Permanently remove sensitive content.", category: "security", keywords: ["hide text", "private", "remove"], icon: ShieldAlert, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "ocr", name: "Searchable PDF", description: "Recognize text in scanned pages locally.", category: "convert", keywords: ["ocr", "scan", "recognize"], icon: ScanText, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "studio", name: "PDF Studio", description: "Annotate, sign, draw, and review PDFs.", category: "edit", keywords: ["sign", "draw", "edit", "viewer"], icon: FileText, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
  { id: "unlock", name: "Unlock PDF", description: "Open a document you own with its password.", category: "security", keywords: ["remove password", "decrypt"], icon: KeyRound, accept: ".pdf,application/pdf", status: "planned", output: "PDF" },
];
