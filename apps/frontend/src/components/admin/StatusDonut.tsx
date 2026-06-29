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

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut breakdown of orders by status with a delivered-share centre and legend. */
export function StatusDonut({ counts }: { counts: Record<string, number> }) {
  const total = DONUT_ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0) || 1;

  let offset = 0;
  const segments = DONUT_ORDER.flatMap((status) => {
    const count = counts[status] ?? 0;
    if (count === 0) return [];
    const length = (count / total) * CIRCUMFERENCE;
    const seg = {
      status,
      color: STATUS_META[status].dot,
      dash: `${length.toFixed(2)} ${(CIRCUMFERENCE - length).toFixed(2)}`,
      offset: (-offset).toFixed(2),
    };
    offset += length;
    return [seg];
  });

  const deliveredPct = Math.round(((counts[OrderStatus.DELIVERED] ?? 0) / total) * 100);

  return (
    <div className="mt-3.5 flex items-center gap-[22px]">
      <div className="relative h-[150px] w-[150px] flex-shrink-0">
        <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
          <circle cx="75" cy="75" r={RADIUS} fill="none" stroke="#F0E9DE" strokeWidth="18" />
          {segments.map((s) => (
            <circle
              key={s.status}
              cx="75"
              cy="75"
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[26px] font-extrabold leading-none text-maison-ink">{deliveredPct}%</div>
          <div className="text-[11px] text-maison-subtle">delivered</div>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-[11px]">
        {DONUT_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: STATUS_META[status].dot }}
            />
            <span className="flex-1 text-maison-muted">{STATUS_META[status].label}</span>
            <span className="font-bold tabular-nums text-maison-ink">{counts[status] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
