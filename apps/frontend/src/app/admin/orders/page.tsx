'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Panel } from '@/components/admin/Panel';
import { StatusPill } from '@/components/admin/StatusPill';
import { OrderDrawer } from '@/components/admin/OrderDrawer';
import { listAdminOrders, getAdminOrder } from '@/lib/adminOrders';
import { getDashboardStats } from '@/lib/dashboard';
import { formatStatus } from '@/lib/orderStatus';
import { money } from '@/lib/storefront';
import { OrderStatus, type Order } from '@ecommerce/shared-types';

const PAGE_SIZE = 10;
const FILTERS: Array<OrderStatus | 'ALL'> = ['ALL', ...Object.values(OrderStatus)];

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
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

  // Per-status counts (and the total) drive the filter chips.
  const loadCounts = useCallback(async () => {
    try {
      const stats = await getDashboardStats();
      setCounts(stats.ordersByStatus);
      setTotal(stats.totalOrders);
    } catch {
      /* chips simply show no counts on failure */
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

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
    loadCounts();
    // If filtering by a status the order just left, drop it from the list.
    if (filter !== 'ALL' && updated.status !== filter) load();
  };

  const countFor = (f: OrderStatus | 'ALL') => (f === 'ALL' ? total : (counts[f] ?? 0));

  return (
    <div>
      {/* status filter chips */}
      <div className="mb-[22px] flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-[15px] py-[9px] text-[13px] font-semibold transition-colors ${
                active
                  ? 'border-maison-ink bg-maison-ink text-white'
                  : 'border-maison-line-strong bg-white text-maison-muted hover:border-maison-clay dark:bg-maison-panel'
              }`}
            >
              {f === 'ALL' ? 'All' : formatStatus(f)}
              <span className="font-semibold opacity-60">{countFor(f)}</span>
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
                <th scope="col" className="px-[26px] py-4 font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2EDE4] dark:border-maison-line">
                    <td colSpan={6} className="px-[26px] py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-maison-panel" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-[70px] text-center">
                    <div className="font-serif text-[26px] text-maison-ink">No orders here</div>
                    <p className="mt-1.5 text-maison-subtle">No orders match this filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemCount = o.items.reduce((sum, it) => sum + it.quantity, 0);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="cursor-pointer border-b border-[#F2EDE4] transition-colors last:border-0 hover:bg-[#FBF7F1] dark:border-maison-line dark:hover:bg-maison-panel"
                    >
                      <td className="px-[26px] py-4 text-[13.5px] font-bold text-maison-ink">
                        #{shortId(o.id)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-maison-ink">
                            {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '—'}
                          </div>
                          <div className="truncate text-xs text-maison-faint">{o.customer?.email ?? ''}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[13.5px] text-maison-muted">
                        {new Date(o.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-4 text-[13.5px] text-maison-muted">{itemCount} items</td>
                      <td className="px-3 py-4 text-[14.5px] font-bold text-maison-ink">{money(o.total)}</td>
                      <td className="px-[26px] py-4">
                        <StatusPill status={o.status} />
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
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
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
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
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
