import { MessageSquare, Star } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import type { ReviewSummary } from '@ecommerce/shared-types';

/**
 * The eye-catching header for the admin feedback page: the catalogue-wide mean
 * rating alongside a per-star distribution, echoing the storefront review summary.
 */
export function ReviewSummaryHeader({ summary }: { summary: ReviewSummary | null }) {
  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;

  return (
    <div className="relative mb-[22px] overflow-hidden rounded-[20px] border border-maison-line bg-white dark:bg-maison-panel">
      {/* warm wash + watermark, matching the products header band */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(105deg,#FBEFE9 0%,#FBF7F1 46%,transparent 74%)' }}
      />
      <Star
        className="pointer-events-none absolute -bottom-8 right-8 h-40 w-40 fill-[#C75B39] text-[#C75B39] opacity-[0.05]"
        aria-hidden
      />

      <div className="relative grid gap-8 px-[30px] py-[26px] md:grid-cols-[auto,1fr] md:items-center">
        {/* score block */}
        <div className="flex items-center gap-5 md:pr-8 md:border-r md:border-maison-line">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F7E4DB] text-maison-clay">
            <MessageSquare className="h-6 w-6" />
          </span>
          <div>
            <div className="text-[10.5px] font-bold tracking-[1.4px] text-maison-clay">CUSTOMERS</div>
            <div className="flex items-end gap-2">
              <span className="font-serif text-[44px] leading-none text-maison-ink tabular-nums">
                {average.toFixed(1)}
              </span>
              <div className="mb-1.5">
                <StarRating value={average} size={16} />
                <div className="mt-0.5 text-[12.5px] text-maison-subtle">
                  {count} review{count === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* distribution bars, 5★ → 1★ */}
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = summary?.distribution[star] ?? 0;
            const pct = count > 0 ? (n / count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-[12.5px]">
                <span className="flex w-7 items-center gap-0.5 font-semibold text-maison-muted tabular-nums">
                  {star}
                  <Star className="h-3 w-3 fill-maison-clay text-maison-clay" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFE7DA] dark:bg-maison-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-maison-clay to-maison-clay-dark transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-maison-subtle tabular-nums">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
