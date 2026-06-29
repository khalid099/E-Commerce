'use client';

import { create } from 'zustand';

interface UiState {
  /** Transient confirmation pill (e.g. "X added to cart"). */
  toast: string | null;
  /** Increments on each cart change to retrigger the badge pop animation. */
  cartBump: number;
  showToast: (message: string) => void;
  bumpCart: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>()((set) => ({
  toast: null,
  cartBump: 0,

  showToast: (message) => {
    set({ toast: message });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },

  bumpCart: () => set((s) => ({ cartBump: s.cartBump + 1 })),
}));
