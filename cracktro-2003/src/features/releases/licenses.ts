"use client";

import { useSyncExternalStore } from "react";
import { releases, type ReleaseId } from "./catalog";
import { makeSerial } from "../keygen/serial";

type License = {
  appId: ReleaseId;
  key: string;
  name: string;
  issuedAt: number;
  patched: boolean;
};
type Licenses = Partial<Record<ReleaseId, License>>;
const STORAGE_KEY = "seq_patches_v3";
const empty: Licenses = {};
let state: Licenses = empty;
let loaded = false;
const listeners = new Set<() => void>();

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const next: Licenses = {};
    for (const { id } of releases) {
      const license = parsed?.byApp?.[id];
      if (
        license &&
        license.appId === id &&
        typeof license.key === "string" &&
        typeof license.issuedAt === "number" &&
        Number.isFinite(license.issuedAt) &&
        typeof license.name === "string" &&
        typeof license.patched === "boolean" &&
        license.key === makeSerial(id, license.name)
      ) {
        next[id] = {
          appId: id,
          key: license.key,
          name: license.name,
          issuedAt: license.issuedAt,
          patched: license.patched,
        };
      }
    }
    state = next;
  } catch {
    /* Keep session unlocks available when browser storage is unavailable. */
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) {
    read();
    emit();
  }
}
function subscribe(listener: () => void) {
  if (!loaded) {
    read();
    loaded = true;
  }
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

const generated = new Map<string, { appId: ReleaseId; name: string }>();
export function rememberKey(appId: ReleaseId, key: string, name: string) {
  const record = { appId, name: name.trim() || "anonymous" };
  generated.set(key, record);
  try {
    localStorage.setItem("sequence:key:" + key, JSON.stringify(record));
  } catch {}
}
function save() {
  let persisted = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ byApp: state }));
  } catch {
    persisted = false;
  }
  emit();
  return { ok: true, persisted };
}
export function registerRelease(appId: ReleaseId, value: string) {
  const key = value.trim().toUpperCase();
  let record = generated.get(key);
  try {
    record ||= JSON.parse(
      localStorage.getItem("sequence:key:" + key) || "null",
    );
  } catch {}
  if (
    !record ||
    record.appId !== appId ||
    key !== makeSerial(appId, record.name)
  )
    return false;
  state = {
    ...state,
    [appId]: {
      appId,
      key,
      name: record.name,
      issuedAt: Date.now(),
      patched: false,
    },
  };
  save();
  return true;
}
export function patchRelease(appId: ReleaseId, key: string, name: string) {
  const license = state[appId];
  if (
    !license ||
    license.key !== key.trim().toUpperCase() ||
    license.key !== makeSerial(appId, name.trim() || "anonymous")
  )
    return { ok: false, persisted: false };
  state = { ...state, [appId]: { ...license, patched: true } };
  return save();
}

export function useLicenses() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );
}

export function canPatch(appId: ReleaseId, key: string, name: string) {
  const license = state[appId];
  return (
    !!license &&
    license.key === key.trim().toUpperCase() &&
    license.key === makeSerial(appId, name.trim() || "anonymous")
  );
}
