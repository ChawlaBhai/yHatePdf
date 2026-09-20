# yHatePDF implementation notes

## Product and design

The landing page introduces the project and lists tools by category. Every registry entry has its own `/tools/<id>` route. The header, utility strip, pixel-heart logo, monochrome borders, typography (Space Grotesk, JetBrains Mono, Playfair Display), editorial hero, and dark mode follow the iLoveMD visual system. The PDF processing architecture is separate.

`lib/tool-registry.ts` is the source of truth for names, routes, categories, input types, and readiness. It contains 52 entries: 45 implemented routes and seven explicitly marked research pages. Research pages do not request files. A ready route describes its actual fidelity and limitations; it is not a guarantee of lossless Office round-trips, cryptographic signing, OCR, or redaction.

## Local processing

`components/PdfWorkspace.tsx` holds selected browser `File` objects, page plans, image ordering, and per-tool options. `lib/pdf-client.ts` executes operations locally with pdf-lib, PDF.js, JSZip, Canvas, and the File API. PDF.js uses the version-matched worker at `/pdf.worker.min.mjs`; the preview path surfaces rendering failures instead of silently displaying blank placeholders. Documents are not posted to an API. The app may fetch its web fonts; that request does not contain document data.

The page plan stores `{fileIndex,pageIndex,rotation,id}` for each output page. Merge can append more PDFs without rebuilding or losing an existing plan. Per-page cards have rendered thumbnails, selection, reordering, duplication, rotation, removal, and a larger rendered preview when those edits are relevant. Split supports visual multi-selection, output-position ranges, one combined PDF, and separate-page ZIP. Rotate updates the visible plan before export, including selected-page left/right actions. PDF-to-image and text-based conversions use selected source pages. Image-to-PDF shows image thumbnails and supports adding, reordering, and removing images.

Output names encode the operation, up to two source stems, and a detail such as page count: `yhatepdf_merged__source-a-source-b__8-pages.pdf`. Split ZIP members encode output part and source page to avoid collisions if a page is duplicated. Compression compares candidate byte lengths; it never claims savings when a source cannot be made smaller. Optional image recompression warns that searchable text may be lost.

## Shipping boundary

Ready: merge, split, organize, rotate, delete/extract/reverse/duplicate/odd/even pages, crop, resize, compress, JPG/PNG/WebP/ZIP page export, PDF text/Markdown/HTML extraction, images/camera photos/CSV/Markdown/text/semantic HTML to PDF, page numbers, watermark, headers/footers, flatten, grayscale, invert, metadata inspection/removal, typed/drawn *visual* signatures, text/highlight annotations, sampled PDF comparison, reviewable white blank-page detection, embedded raster image extraction, and a multi-action Studio. The Office routes export editable PDF text to DOCX, reflow DOCX text/tables into PDF, export PDF text rows to XLSX, render XLSX cell data into PDF tables, and export PDF pages as image-backed PPTX slides. They do not preserve every source style or support all content classes; each route names its fidelity limit.

In research: PowerPoint-to-PDF rendering, editing existing PDF text/content, password encryption/decryption, permanent redaction, OCR, and damaged-file repair. These must not be presented as functional until independently validated. Permanent redaction and password removal need stronger correctness and safety guarantees than a cosmetic overlay or `ignoreEncryption` flag. Camera capture uses the browser's `capture="environment"` file input where supported; it is not an OCR scanner or automatic perspective correction. HTML-to-PDF only renders an allowlisted semantic subset; scripts, CSS, images, and external assets are removed before preview and conversion.

## Browser smoke checks

Generate synthetic, non-sensitive fixtures with `node scripts/smoke-fixtures.mjs /private/tmp`. Browser checks cover merge append and previews, split ZIP, selected-page rotation, CSV/Markdown/HTML conversion, image ordering, compression (74% smaller on the image-heavy fixture; no false savings on tiny text), blank-page detection/removal, two-PDF comparison, typed and drawn signatures, annotation, PDF-to-WebP, embedded image ZIP, Studio split, and the limited DOCX/XLSX/PPTX routes. Run `./node_modules/.bin/tsc --noEmit`, ESLint, and `npm run build` before publication.
