'use client';

import type { DashboardStats } from '@ecommerce/shared-types';
import { compactMoney } from '@/lib/storefront';

interface RevenueBarsProps {
  data: DashboardStats['revenueByMonth'];
}

/**
 * The Maison revenue chart: one bar per month for the trailing six months,
 * the most recent month highlighted in clay. Pure CSS — no chart library.
 */
export function RevenueBars({ data }: RevenueBarsProps) {
  const max = Math.max(1, ...data.map((m) => m.revenue));
  const lastIndex = data.length - 1;

  return (
    <div className="mt-6 flex h-[200px] items-end gap-[18px] pt-2.5">
      {data.map((m, i) => {
        const isLatest = i === lastIndex;
        const heightPct = Math.max(4, (m.revenue / max) * 100);
        return (
          <div
            key={m.month}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2.5"
          >
            <div className="text-[11.5px] font-bold text-maison-muted tabular-nums">
              {compactMoney(m.revenue)}
            </div>
            <div
              className="w-full max-w-[46px] origin-bottom animate-grow-bar rounded-t-[10px] rounded-b-[4px]"
              style={{
                height: `${heightPct}%`,
                background: isLatest
                  ? 'linear-gradient(180deg,#C75B39,#A8492C)'
                  : 'linear-gradient(180deg,#E3D4C4,#D2BFA9)',
                animationDelay: `${i * 0.08}s`,
              }}
            />
            <div className="text-xs font-medium text-maison-subtle">{m.label}</div>
          </div>
        );
      })}
    </div>
  );
}
