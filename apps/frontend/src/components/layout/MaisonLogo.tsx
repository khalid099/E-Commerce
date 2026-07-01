import { cn } from '@/lib/utils';

interface MaisonLogoProps {
  /** Tailwind text-size class for the wordmark, e.g. "text-3xl". */
  className?: string;
  /** Color of the wordmark; the accent dot is always clay. */
  tone?: 'ink' | 'cream';
}

/** The "KD Store ·" wordmark used in the header, footer and auth panels. */
export function MaisonLogo({ className, tone = 'ink' }: MaisonLogoProps) {
  return (
    <span className="flex items-baseline gap-[9px]">
      <span
        className={cn(
          'font-serif leading-none tracking-[0.5px]',
          // `cream` = light wordmark for dark surfaces (footer, auth panel), which
          // stay dark in both themes — so keep it light under .dark too (maison-ink
          // flips to a light tone in dark mode).
          tone === 'cream' ? 'text-maison-cream dark:text-maison-ink' : 'text-maison-ink',
          className ?? 'text-[30px]',
        )}
      >
        KD Store
      </span>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-maison-clay" />
    </span>
  );
}
