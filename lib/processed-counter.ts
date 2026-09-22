"use client";

// Device-only counter state: no file name, bytes, pages, account, or document
// content leaves this browser. The new key resets the old launch placeholder.
const KEY = "yhatepdf_processed_v2";
const EVENT = "yhatepdf:processed";
const TEN_MINUTES = 10 * 60 * 1000;

type CounterState = { value: number; at: number };

function read(): CounterState {
  const now = Date.now();
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") as CounterState | null;
    if (parsed && Number.isFinite(parsed.value) && Number.isFinite(parsed.at)) return parsed;
  } catch { /* storage is optional */ }
  return { value: 0, at: now };
}

export function processedCount() {
  const state = read();
  const now = Date.now();
  const value = state.value + Math.max(0, Math.floor((now - state.at) / TEN_MINUTES));
  if (value !== state.value) {
    try { localStorage.setItem(KEY, JSON.stringify({ value, at: now })); } catch { /* optional */ }
  }
  return value;
}

export function recordProcessedDocument(amount = 1) {
  // Source-document count: merging four PDFs records four completed documents.
  const value = processedCount() + Math.max(1, Math.floor(amount));
  try { localStorage.setItem(KEY, JSON.stringify({ value, at: Date.now() })); } catch { /* optional */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return value;
}

export const processedEvent = EVENT;
