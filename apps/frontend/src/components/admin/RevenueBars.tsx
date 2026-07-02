'use client';

import { useState } from 'react';
import type { DashboardStats } from '@ecommerce/shared-types';
import { compactMoney, money } from '@/lib/storefront';

interface RevenueBarsProps {
  data: DashboardStats['revenueByMonth'];
}

/** Four evenly-spaced gridlines (100/75/50/25%) behind the bars. */
const GRID_LINES = [1, 0.75, 0.5, 0.25];

/**
 * The Maison revenue chart: one bar per month for the trailing six months,
 * the most recent month highlighted in clay. Pure CSS/SVG — no chart library.
 * Layered gridlines, an average reference line, and per-bar hover tooltips give
 * it a premium, dashboard-grade feel.
 */
export function RevenueBars({ data }: RevenueBarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((m) => m.revenue));
  const avg = data.length ? data.reduce((s, m) => s + m.revenue, 0) / data.length : 0;
  const avgPct = (avg / max) * 100;
  const lastIndex = data.length - 1;

  return (
    <div className="mt-6">
      <div className="relative h-[210px] pt-2.5">
        {/* horizontal gridlines + axis value hints */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-2.5">
          {GRID_LINES.map((g) => (
            <div
              key={g}
              className="absolute inset-x-0 flex items-center"
              style={{ bottom: `${g * 100}%` }}
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-maison-line to-transparent opacity-70" />
              <span className="absolute right-0 -translate-y-full pb-0.5 text-[10px] font-semibold tabular-nums text-maison-faint">
                {compactMoney(max * g)}
              </span>
            </div>
          ))}
        </div>

        {/* average reference line */}
        {avg > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
            style={{ bottom: `${avgPct}%` }}
          >
            <div className="h-px w-full border-t border-dashed border-maison-clay/45" />
            <span className="absolute left-0 -translate-y-full rounded-full bg-maison-clay/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-maison-clay-dark">
              avg {compactMoney(avg)}
            </span>
          </div>
        )}

        {/* bars */}
        <div className="relative flex h-full items-end gap-[18px]">
          {data.map((m, i) => {
            const isLatest = i === lastIndex;
            const isHover = hover === i;
            const heightPct = Math.max(4, (m.revenue / max) * 100);
            return (
              <div
                key={m.month}
                className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* tooltip */}
                <div
                  className={`pointer-events-none absolute bottom-full z-20 mb-2 whitespace-nowrap rounded-[10px] border border-maison-line bg-white px-2.5 py-1.5 text-center shadow-lg transition-all duration-150 dark:bg-maison-ink ${
                    isHover ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                  }`}
                >
                  <div className="text-[13px] font-extrabold tabular-nums text-maison-ink dark:text-maison-cream">
                    {money(m.revenue)}
                  </div>
                  <div className="text-[10.5px] font-medium text-maison-subtle">{m.label}</div>
                </div>

                {/* bar column */}
                <div className="relative flex w-full max-w-[46px] flex-1 items-end">
                  <div
                    className="relative w-full origin-bottom animate-grow-bar overflow-hidden rounded-t-[10px] rounded-b-[4px] transition-[filter,transform] duration-200 group-hover:-translate-y-0.5"
                    style={{
                      height: `${heightPct}%`,
                      background: isLatest
                        ? 'linear-gradient(180deg,#D6653F 0%,#C75B39 45%,#A8492C 100%)'
                        : 'linear-gradient(180deg,#EADCCB 0%,#E0CDB6 50%,#D2BFA9 100%)',
                      boxShadow: isLatest
                        ? '0 6px 18px -6px rgba(167,73,44,.55), inset 0 1px 0 rgba(255,255,255,.35)'
                        : 'inset 0 1px 0 rgba(255,255,255,.5)',
                      filter: isHover ? 'brightness(1.06) saturate(1.05)' : undefined,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    {/* glossy highlight */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                    {/* hover sheen */}
                    {isHover && (
                      <div className="absolute inset-0 -skew-x-12 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* month labels */}
      <div className="mt-3 flex gap-[18px]">
        {data.map((m, i) => (
          <div
            key={m.month}
            className={`flex-1 text-center text-xs font-medium transition-colors ${
              i === lastIndex ? 'text-maison-clay-dark' : 'text-maison-subtle'
            }`}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}
