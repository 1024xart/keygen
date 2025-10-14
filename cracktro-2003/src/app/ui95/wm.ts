'use client';
import { create } from 'zustand';

export type WinId = 'tr01' | 'keygen';

type WMState = {
  order: WinId[];
  open: Record<WinId, boolean>;
  openWin: (id: WinId) => void;
  closeWin: (id: WinId) => void;
  focusWin: (id: WinId) => void;
};

export const useWM = create<WMState>((set) => ({
  order: [],
  open: { tr01: false, keygen: false },

  openWin: (id) =>
    set((s) => {
      const order = [...s.order.filter((w) => w !== id), id];
      return { open: { ...s.open, [id]: true }, order };
    }),

  closeWin: (id) =>
    set((s) => ({
      open: { ...s.open, [id]: false },
      order: s.order.filter((w) => w !== id),
    })),

  focusWin: (id) =>
    set((s) => ({
      order: [...s.order.filter((w) => w !== id), id],
    })),
}));

// (optional dev helper) window.__resetWM()
if (typeof window !== 'undefined') {
  (window as any).__resetWM = () =>
    useWM.setState({ order: [], open: { tr01: false, keygen: false } });
}
