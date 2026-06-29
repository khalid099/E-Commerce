'use client';

import { Check } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

/** Bottom-center confirmation pill. Mounted once in the storefront layout. */
export function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in fixed bottom-8 left-1/2 z-[180] flex items-center gap-2.5 rounded-full bg-maison-ink px-5 py-3.5 text-sm font-medium text-maison-cream shadow-[0_16px_44px_rgba(33,28,22,.32)]"
    >
      <Check className="h-4 w-4 text-maison-clay" strokeWidth={2.5} />
      {toast}
    </div>
  );
}
