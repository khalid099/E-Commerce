import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onGo: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onGo, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const pill = (active: boolean) =>
    cn(
      'flex h-10 min-w-[40px] items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors',
      active
        ? 'border-maison-ink bg-maison-ink text-maison-cream'
        : 'border-maison-line-strong bg-white text-maison-ink hover:border-maison-ink disabled:opacity-40 disabled:hover:border-maison-line-strong dark:bg-maison-panel',
    );

  return (
    <nav
      className={cn('mt-12 flex items-center justify-center gap-2', className)}
      aria-label="Pagination"
    >
      <button onClick={() => onGo(page - 1)} disabled={page <= 1} className={pill(false)} aria-label="Previous page">
        &larr;
      </button>
      {pages.map((p) => (
        <button key={p} onClick={() => onGo(p)} className={pill(p === page)} aria-current={p === page ? 'page' : undefined}>
          {p}
        </button>
      ))}
      <button onClick={() => onGo(page + 1)} disabled={page >= totalPages} className={pill(false)} aria-label="Next page">
        &rarr;
      </button>
    </nav>
  );
}
