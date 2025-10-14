// src/system/license.ts
'use client';

import { useMemo, useSyncExternalStore } from 'react';

/** Add your art apps here as you create them. */
export type AppId = 'sequence' | 'TR01' | 'BMR08' | 'BR09';

export type License = {
  key: string;
  name: string;
  appId: AppId;
  issuedAt: number;        // epoch ms
  expiresAt?: number;      // epoch ms (optional = perpetual)
};

type Store = {
  byApp: Record<AppId, License | null>;
};

const STORAGE_KEY = 'seq_licenses_v2';

// ---- internal state --------------------------------------------------------
let state: Store = {
  byApp: {
    sequence: null,
    TR01: null,
    BMR08: null,
    BR09: null,
  },
};

const listeners = new Set<() => void>();

/** Defer emits to a microtask so we never update during another component’s render. */
let emitScheduled = false;
function emitSoon() {
  if (emitScheduled) return;
  emitScheduled = true;
  const schedule =
    typeof queueMicrotask === 'function'
      ? queueMicrotask
      : (fn: () => void) => Promise.resolve().then(fn);

  schedule(() => {
    emitScheduled = false;
    listeners.forEach((l) => l());
  });
}

function save() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function coerceStore(obj: unknown): Store | null {
  if (!obj || typeof obj !== 'object') return null;
  const byApp = (obj as any).byApp ?? {};
  const coerceLic = (x: any): License | null => {
    if (!x || typeof x !== 'object') return null;
    const { key, name, appId, issuedAt, expiresAt } = x as Partial<License>;
    if (!key || !name || !appId || typeof issuedAt !== 'number') return null;
    const lic: License = {
      key: String(key),
      name: String(name),
      appId: appId as AppId,
      issuedAt,
      ...(typeof expiresAt === 'number' ? { expiresAt } : {}),
    };
    return lic;
  };
  const next: Store = {
    byApp: {
      sequence: coerceLic(byApp.sequence) ?? null,
      TR01: coerceLic(byApp.TR01) ?? null,
      BMR08: coerceLic(byApp.BMR08) ?? null,
      BR09: coerceLic(byApp.BR09) ?? null,
    },
  };
  return next;
}

function load() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    const next = coerceStore(parsed);
    if (next) state = next;
  } catch {}
}

if (typeof window !== 'undefined') {
  load();
  // cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      load();
      emitSoon();
    }
  });
}

// ---- helpers ---------------------------------------------------------------
export function isExpired(lic: License | null | undefined): boolean {
  if (!lic) return false;
  return !!(lic.expiresAt && Date.now() > lic.expiresAt);
}

export function isActive(lic: License | null | undefined): boolean {
  return !!lic && !isExpired(lic);
}

// ---- public API ------------------------------------------------------------
export function setLicense(lic: License) {
  state = {
    byApp: { ...state.byApp, [lic.appId]: lic },
  };
  save();
  emitSoon();
}

export function clearLicense(appId: AppId) {
  state = {
    byApp: { ...state.byApp, [appId]: null },
  };
  save();
  emitSoon();
}

export function getLicense(appId: AppId): License | null {
  return state.byApp[appId];
}

/**
 * Reactive hook: returns the license (or null), plus derived flags.
 * Keeps your original return shape for compatibility.
 */
export function useLicense(appId: AppId) {
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const getSnap = () => state;

  const s = useSyncExternalStore(subscribe, getSnap, getSnap);
  const lic = s.byApp[appId];

  const expired = isExpired(lic);

  const remainingMs = lic?.expiresAt
    ? Math.max(0, lic.expiresAt - Date.now())
    : null;

  const progress = useMemo(() => {
    if (!lic?.expiresAt) return 1; // perpetual license looks “complete”
    const total = lic.expiresAt - lic.issuedAt;
    if (total <= 0) return expired ? 0 : 1;
    const elapsed = Math.min(total, Math.max(0, Date.now() - lic.issuedAt));
    return Math.max(0, Math.min(1, elapsed / total));
  }, [lic?.issuedAt, lic?.expiresAt, expired]);

  return { license: lic, expired, remainingMs, progress };
}

/**
 * Convenience hook for apps that only care about “patched?”.
 * Returns `{ patched: boolean, license: License | null }`.
 */
export function usePatched(appId: AppId) {
  const { license } = useLicense(appId);
  return { patched: isActive(license), license: license ?? null };
}
