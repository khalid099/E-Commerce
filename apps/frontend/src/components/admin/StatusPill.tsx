import type { OrderStatus } from '@ecommerce/shared-types';
import { STATUS_META } from '@/lib/orderStatus';

/** Color-coded order status pill, shared by the order table, drawer and dashboard. */
export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.4px]"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
