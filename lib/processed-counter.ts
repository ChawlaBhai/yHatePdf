"use client";

const KEY = "yhatepdf_processed_v1";
const EVENT = "yhatepdf:processed";
const TEN_MINUTES = 10 * 60 * 1000;
const LAUNCH_BASE = 9842;
const LAUNCH_AT = Date.UTC(2026, 8, 22, 0, 0, 0);

type CounterState = { value: number; at: number };

function read(): CounterState {
  const now = Date.now();
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") as CounterState | null;
    if (parsed && Number.isFinite(parsed.value) && Number.isFinite(parsed.at)) return parsed;
  } catch { /* storage is optional */ }
  return { value: LAUNCH_BASE + Math.max(0, Math.floor((now - LAUNCH_AT) / TEN_MINUTES)), at: now };
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
  const value = processedCount() + Math.max(1, amount);
  try { localStorage.setItem(KEY, JSON.stringify({ value, at: Date.now() })); } catch { /* optional */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return value;
}

export const processedEvent = EVENT;
