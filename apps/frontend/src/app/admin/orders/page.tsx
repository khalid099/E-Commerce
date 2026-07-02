'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@/components/admin/Panel';
import { StatusPill } from '@/components/admin/StatusPill';
import { OrderStatsStrip } from '@/components/admin/OrderStatsStrip';
import { OrderDrawer } from '@/components/admin/OrderDrawer';
import { ProductTone } from '@/components/storefront/ProductTone';
import { listAdminOrders, getAdminOrder } from '@/lib/adminOrders';
import { getDashboardStats } from '@/lib/dashboard';
import { formatStatus, STATUS_META } from '@/lib/orderStatus';
import { money } from '@/lib/storefront';
import { shortId } from '@/lib/utils';
import { OrderStatus, type DashboardStats, type Order } from '@ecommerce/shared-types';

const PAGE_SIZE = 10;
const FILTERS: Array<OrderStatus | 'ALL'> = ['ALL', ...Object.values(OrderStatus)];

/** Two-letter initials for the customer avatar. */
function initials(order: Order): string {
  if (!order.customer) return '—';
  return `${order.customer.firstName.charAt(0)}${order.customer.lastName.charAt(0)}`.toUpperCase();
}

function OrdersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get('order');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminOrders({
        status: filter === 'ALL' ? undefined : filter,
        page,
        limit: PAGE_SIZE,
      });
      setOrders(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Dashboard aggregates feed both the KPI strip and the per-status filter counts.
  const loadStats = useCallback(async () => {
    try {
      setStats(await getDashboardStats());
    } catch {
      /* strip + chips simply show no numbers on failure */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Open the drawer for a deep-linked order (?order=<id>).
  useEffect(() => {
    if (!openId) return;
    const inList = orders.find((o) => o.id === openId);
    if (inList) {
      setSelected(inList);
    } else {
      getAdminOrder(openId)
        .then(setSelected)
        .catch(() => toast.error('Order not found'));
    }
  }, [openId, orders]);

  const closeDrawer = () => {
    setSelected(null);
    if (openId) router.replace('/admin/orders');
  };

  const onUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelected(updated);
    loadStats();
    // If filtering by a status the order just left, drop it from the list.
    if (filter !== 'ALL' && updated.status !== filter) load();
  };

  const total = stats?.totalOrders ?? 0;
  const countFor = (f: OrderStatus | 'ALL') =>
    f === 'ALL' ? total : (stats?.ordersByStatus[f] ?? 0);

  return (
    <div>
      {/* KPI summary */}
      <OrderStatsStrip
        totalOrders={total}
        totalRevenue={stats?.totalRevenue ?? 0}
        averageOrderValue={stats?.averageOrderValue ?? 0}
        pending={stats?.ordersByStatus[OrderStatus.PENDING] ?? 0}
      />

      {/* status filter chips */}
      <div className="mb-[22px] flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          const dot = f === 'ALL' ? null : STATUS_META[f].dot;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 rounded-full border px-[15px] py-[9px] text-[13px] font-semibold transition-all ${
                active
                  ? 'border-maison-ink bg-maison-ink text-white shadow-[0_8px_20px_rgba(33,28,22,0.22)]'
                  : 'border-maison-line-strong bg-white text-maison-muted hover:border-maison-clay hover:text-maison-ink dark:bg-maison-panel'
              }`}
            >
              {dot && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: active ? '#fff' : dot }}
                />
              )}
              {f === 'ALL' ? 'All orders' : formatStatus(f)}
              <span
                className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F2EDE4] text-maison-subtle dark:bg-maison-line'
                }`}
              >
                {countFor(f)}
              </span>
            </button>
          );
        })}
      </div>

      {/* table */}
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-maison-line bg-[#FBF7F1] text-[11.5px] font-bold tracking-[0.8px] text-maison-subtle dark:bg-maison-panel">
                <th scope="col" className="px-[26px] py-4 font-bold">ORDER</th>
                <th scope="col" className="px-3 py-4 font-bold">CUSTOMER</th>
                <th scope="col" className="px-3 py-4 font-bold">DATE</th>
                <th scope="col" className="px-3 py-4 font-bold">ITEMS</th>
                <th scope="col" className="px-3 py-4 font-bold">TOTAL</th>
                <th scope="col" className="px-3 py-4 font-bold">STATUS</th>
                <th scope="col" className="px-[26px] py-4" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2EDE4] dark:border-maison-line">
                    <td colSpan={7} className="px-[26px] py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-maison-panel" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-[70px] text-center">
                    <div className="font-serif text-[26px] text-maison-ink">No orders here</div>
                    <p className="mt-1.5 text-maison-subtle">No orders match this filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemCount = o.items.reduce((sum, it) => sum + it.quantity, 0);
                  const preview = o.items.slice(0, 3);
                  const extra = o.items.length - preview.length;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="group cursor-pointer border-b border-[#F2EDE4] transition-colors last:border-0 hover:bg-[#FBF7F1] dark:border-maison-line dark:hover:bg-maison-panel"
                    >
                      <td className="px-[26px] py-4">
                        <span className="inline-flex items-center rounded-md bg-[#F2EDE4] px-2 py-1 font-mono text-[12.5px] font-bold text-maison-ink dark:bg-maison-line">
                          #{shortId(o.id)}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-maison-clay to-maison-clay-dark text-[12.5px] font-bold text-white">
                            {initials(o)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-maison-ink">
                              {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '—'}
                            </div>
                            <div className="truncate text-xs text-maison-faint">{o.customer?.email ?? ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[13.5px] text-maison-muted">
                        {new Date(o.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-2">
                            {preview.map((it) => (
                              <ProductTone
                                key={it.id}
                                name={it.productName}
                                imageUrl={it.productImageUrl}
                                initialClassName="text-[13px]"
                                className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-maison-panel"
                              />
                            ))}
                            {extra > 0 && (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2EDE4] text-[10.5px] font-bold text-maison-subtle ring-2 ring-white dark:bg-maison-line dark:ring-maison-panel">
                                +{extra}
                              </span>
                            )}
                          </div>
                          <span className="text-[13px] text-maison-muted">{itemCount} items</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[14.5px] font-bold text-maison-ink tabular-nums">{money(o.total)}</td>
                      <td className="px-3 py-4">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="px-[26px] py-4 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-maison-faint opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-maison-subtle">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink transition-colors hover:border-maison-clay disabled:opacity-40 dark:bg-maison-panel"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink transition-colors hover:border-maison-clay disabled:opacity-40 dark:bg-maison-panel"
          >
            Next
          </button>
        </div>
      )}

      {selected && <OrderDrawer order={selected} onClose={closeDrawer} onUpdated={onUpdated} />}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersContent />
    </Suspense>
  );
}
