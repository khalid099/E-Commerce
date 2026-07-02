'use client';

import { useState } from 'react';
import { OrderStatus } from '@ecommerce/shared-types';
import { STATUS_META } from '@/lib/orderStatus';

/** Render order of the donut ring + legend (delivered first, cancelled last). */
const DONUT_ORDER: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.SHIPPED,
  OrderStatus.PROCESSING,
  OrderStatus.PENDING,
  OrderStatus.CANCELLED,
];

const RADIUS = 60;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/**
 * Circumference length carved out between segments so the ring reads as
 * separated arcs. Must exceed STROKE — round caps extend STROKE/2 past each
 * arc end, so a smaller gap would let neighbouring caps touch.
 */
const GAP = 20;

/** Lighten a segment colour for the top of its gradient — pure premium sheen. */
function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 32);
  const g = Math.min(255, ((n >> 8) & 255) + 32);
  const b = Math.min(255, (n & 255) + 32);
  return `rgb(${r},${g},${b})`;
}

/** Donut breakdown of orders by status with an interactive centre and legend. */
export function StatusDonut({ counts }: { counts: Record<string, number> }) {
  const [active, setActive] = useState<OrderStatus | null>(null);
  const total = DONUT_ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0) || 1;

  let offset = 0;
  const segments = DONUT_ORDER.flatMap((status) => {
    const count = counts[status] ?? 0;
    if (count === 0) return [];
    const length = (count / total) * CIRCUMFERENCE;
    const dash = Math.max(0.5, length - GAP);
    const seg = {
      status,
      color: STATUS_META[status].dot,
      count,
      dash: `${dash.toFixed(2)} ${(CIRCUMFERENCE - dash).toFixed(2)}`,
      // centre the visible arc within its slot so the gap is even on both sides
      offset: (-(offset + GAP / 2)).toFixed(2),
    };
    offset += length;
    return [seg];
  });

  const deliveredPct = Math.round(((counts[OrderStatus.DELIVERED] ?? 0) / total) * 100);
  const activePct = active ? Math.round(((counts[active] ?? 0) / total) * 100) : deliveredPct;
  const centreLabel = active ? STATUS_META[active].label.toLowerCase() : 'delivered';

  return (
    <div className="mt-3.5 flex items-center gap-[22px]">
      <div className="relative h-[160px] w-[160px] flex-shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <defs>
            {segments.map((s) => (
              <linearGradient
                key={s.status}
                id={`donut-${s.status}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={lighten(s.color)} />
                <stop offset="100%" stopColor={s.color} />
              </linearGradient>
            ))}
            <filter id="donut-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* track */}
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            className="stroke-maison-line"
            strokeWidth={STROKE}
          />

          {/* segments */}
          <g filter="url(#donut-shadow)">
            {segments.map((s) => {
              const isActive = active === s.status;
              const dimmed = active !== null && !isActive;
              return (
                <circle
                  key={s.status}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke={`url(#donut-${s.status})`}
                  strokeWidth={isActive ? STROKE + 3 : STROKE}
                  strokeLinecap="round"
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                  className="cursor-pointer transition-all duration-200"
                  style={{ opacity: dimmed ? 0.35 : 1 }}
                  onMouseEnter={() => setActive(s.status)}
                  onMouseLeave={() => setActive(null)}
                />
              );
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[28px] font-extrabold leading-none tabular-nums text-maison-ink">
            {activePct}%
          </div>
          <div className="mt-0.5 text-[11px] capitalize text-maison-subtle">{centreLabel}</div>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-[9px]">
        {DONUT_ORDER.map((status) => {
          const isActive = active === status;
          return (
            <li
              key={status}
              onMouseEnter={() => setActive(status)}
              onMouseLeave={() => setActive(null)}
              className={`flex cursor-default items-center gap-2.5 rounded-lg px-2 py-1 text-[13px] transition-colors ${
                isActive ? 'bg-maison-cream dark:bg-maison-ink/40' : ''
              }`}
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px] transition-transform"
                style={{
                  background: STATUS_META[status].dot,
                  transform: isActive ? 'scale(1.3)' : undefined,
                }}
              />
              <span className="flex-1 text-maison-muted">{STATUS_META[status].label}</span>
              <span className="font-bold tabular-nums text-maison-ink">{counts[status] ?? 0}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
