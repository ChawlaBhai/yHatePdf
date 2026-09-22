"use client";

const EVENT = "yhatepdf:processed";
const BASELINE_COUNT = 0;
const BASELINE_EPOCH = Date.UTC(2026, 8, 22, 0, 0, 0);
const TEN_MINUTES = 10 * 60 * 1000;
const LOCAL_EXPORTS_KEY = "yhatepdf_local_exports";

function timedBaseline() {
  return BASELINE_COUNT + Math.floor(Math.max(0, Date.now() - BASELINE_EPOCH) / TEN_MINUTES);
}

export function processedCount() {
  if (typeof window === "undefined") return timedBaseline();
  try {
    const localExports = Number.parseInt(localStorage.getItem(LOCAL_EXPORTS_KEY) || "0", 10);
    return timedBaseline() + (Number.isFinite(localExports) ? localExports : 0);
  } catch { return timedBaseline(); }
}

export function recordProcessedDocument(amount = 1) {
  const sourceDocuments = Math.max(1, Math.floor(amount));
  try {
    const localExports = Number.parseInt(localStorage.getItem(LOCAL_EXPORTS_KEY) || "0", 10);
    localStorage.setItem(LOCAL_EXPORTS_KEY, String((Number.isFinite(localExports) ? localExports : 0) + sourceDocuments));
  } catch { /* Browser storage is optional; the shared time baseline still works. */ }
  const count = processedCount();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { count } }));
  return count;
}

export const processedEvent = EVENT;
