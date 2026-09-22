"use client";

const EVENT = "yhatepdf:processed";

export function recordProcessedDocument(amount = 1) {
  // This event carries only an increment amount after a successful local
  // export—never a PDF, filename, page count, account, or browser identifier.
  const sourceDocuments = Math.max(1, Math.floor(amount));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { amount: sourceDocuments } }));
  return sourceDocuments;
}

export const processedEvent = EVENT;
