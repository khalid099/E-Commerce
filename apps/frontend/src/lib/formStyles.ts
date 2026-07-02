import { cn } from '@/lib/utils';

/**
 * Shared Maison text-input styling with an error state. Extra utilities passed
 * via `className` win over the defaults (tailwind-merge), so surfaces that need
 * a tighter field (e.g. profile settings use `py-3 focus:shadow-none`) can tune
 * it without redefining the base.
 */
export function fieldCls(error: boolean, className?: string): string {
  return cn(
    'w-full rounded-xl border bg-[#FCFAF6] px-4 py-3.5 text-[14.5px] text-maison-ink outline-none transition-all duration-200 placeholder:text-maison-faint focus:bg-white focus:shadow-[0_2px_10px_rgba(120,80,50,.06)] focus:ring-4 dark:bg-maison-cream dark:focus:bg-maison-cream',
    error
      ? 'border-maison-clay ring-4 ring-maison-clay/10'
      : 'border-maison-line-strong focus:border-maison-clay focus:ring-maison-clay/[.09]',
    className,
  );
}
