# yHatePDF implementation notes

## Product and design

The landing page introduces the project and lists tools by category. Every registry entry has its own `/tools/<id>` route. The header, utility strip, pixel-heart logo, monochrome borders, typography (Space Grotesk, JetBrains Mono, Playfair Display), editorial hero, and dark mode follow the iLoveMD visual system. The PDF processing architecture is separate.

`lib/tool-registry.ts` is the source of truth for names, routes, categories, input types, and readiness. It contains 51 entries. Only tools with an implemented and testable local path are marked `ready`; the rest have an explicit research page and do not request files. This is not yet a 45-function release.

## Local processing

`components/PdfWorkspace.tsx` holds selected browser `File` objects, page plans, image ordering, and per-tool options. `lib/pdf-client.ts` executes operations locally with pdf-lib, PDF.js, JSZip, Canvas, and the File API. PDF.js uses the version-matched worker at `/pdf.worker.min.mjs`; the preview path surfaces rendering failures instead of silently displaying blank placeholders. Documents are not posted to an API. The app may fetch its web fonts; that request does not contain document data.

The page plan stores `{fileIndex,pageIndex,rotation,id}` for each output page. Merge can append more PDFs without rebuilding or losing an existing plan. Per-page cards have rendered thumbnails, selection, reordering, duplication, rotation, removal, and a larger rendered preview when those edits are relevant. Split supports visual multi-selection, output-position ranges, one combined PDF, and separate-page ZIP. Rotate updates the visible plan before export, including selected-page left/right actions. PDF-to-image and text-based conversions use selected source pages. Image-to-PDF shows image thumbnails and supports adding, reordering, and removing images.

Output names encode the operation, up to two source stems, and a detail such as page count: `yhatepdf_merged__source-a-source-b__8-pages.pdf`. Split ZIP members encode output part and source page to avoid collisions if a page is duplicated. Compression compares candidate byte lengths; it never claims savings when a source cannot be made smaller. Optional image recompression warns that searchable text may be lost.

## Shipping boundary

Ready: merge, split, organize, rotate, delete/extract/reverse/duplicate/odd/even pages, crop, resize, compress, JPG/PNG/ZIP page export, PDF text/Markdown/HTML extraction, images/camera photos/CSV/Markdown/text to PDF, page numbers, watermark, headers/footers, flatten, grayscale, invert, metadata inspection/removal.

In research: faithful Office round-trips, URL/HTML rendering, signing and full annotation/editing, password encryption/decryption, permanent redaction, OCR, embedded-image extraction, visual comparison, damaged-file repair, reliable blank-page detection, and a unified Studio. These must not be presented as functional until independently validated. In particular, permanent redaction and password removal need stronger correctness and safety guarantees than a cosmetic overlay or `ignoreEncryption` flag. Camera capture uses the browser's `capture="environment"` file input where supported; it is not an OCR scanner or automatic perspective correction.

## Browser smoke checks

Generate synthetic, non-sensitive fixtures with `node scripts/smoke-fixtures.mjs /private/tmp`. The checked flows include a five-page merge from two PDFs, appending another PDF, visible thumbnails, split range selection and ZIP export, selected-page rotation with a full-size preview, CSV and Markdown PDF exports, image ordering before PDF export, and compression (74% smaller on the image-heavy fixture; no false claim of savings on a tiny text PDF). Run `./node_modules/.bin/tsc --noEmit` and `npm run build` before publication.
