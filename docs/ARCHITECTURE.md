# yHatePDF — implementation notes

## What transfers from iLoveMD

The family resemblance comes from the monochrome, high-contrast dropzone, concise technical labels, keyboard-first command menu, and a client-only interaction model. The old 50 MB free-tier validation and analytics counter were deliberately not carried over: yHatePDF has no product-imposed file cap and must not send a document or usage event to a server.

## V1 architecture

The app is a static React surface. `lib/tool-registry.ts` is the only inventory of tools, aliases, category colour, accepted input, and implementation state. `components/PdfWorkspace.tsx` owns local UI state. Document bytes are read from the browser File API and processed by `lib/pdf-client.ts`; no action calls an API route. `pdf-lib` is imported only when an operation runs. PDF.js is imported for text extraction; it is intentionally not part of the first route payload.

The current reliable operations are merge, selected-range split / per-page ZIP, rotate, image-to-PDF, and text extraction. Planned tools surface their actual browser constraint instead of claiming readiness.

## Capability and dependency matrix

| Tool family | Local path | Engine | Confidence | Current status |
| --- | --- | --- | --- | --- |
| merge / ranges / rotate | rewrite page plan | pdf-lib (MIT) | high | shipped |
| image to PDF | embed local images | pdf-lib (MIT) | high | shipped |
| extract text | browser PDF parse | PDF.js (Apache-2.0) | high | shipped |
| page organiser / crop | page plan + boxes | pdf-lib | high | next |
| watermark / numbers / metadata | draw & rewrite | pdf-lib | high | next |
| encryption / unlock | PDF encryption APIs | pdf-lib + compatibility probes | medium | research gate |
| compression | image raster/re-encode | Canvas / worker | medium | research gate |
| OCR | local language model / wasm | Tesseract.js evaluation | medium | research gate |
| Office conversion | document-specific rendering | browser-native / WASM evaluation | low-medium | research gate |
| existing-text editing / repair | PDF object rewriting | specialist engine needed | low | deliberately not promised |

`pdf-lib` and jsPDF are MIT; PDF.js is Apache-2.0; JSZip is dual MIT/GPL-3.0. JSZip is used only for locally-created split archives. Before distributing a commercial build, retain each package notice in a generated third-party notices file.

## Risk controls and delivery order

Permanent redaction, faithful Office conversion, repair, and alteration of existing PDF text cannot be represented as ordinary UI toggles. They stay out of the completed set until a local engine proves output fidelity with fixture PDFs. Future heavy operations belong in Workers; the page-plan model keeps inputs immutable and makes that migration direct.

1. Foundation + reliable page primitives (this slice).
2. Page ordering, crop, watermark, page numbers, metadata hygiene.
3. Controlled security and redaction fixtures.
4. Worker extraction/rendering, local recents and PWA.
5. Only then evaluate compression, OCR, and Office capabilities.
