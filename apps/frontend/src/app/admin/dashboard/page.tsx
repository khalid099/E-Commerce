'use client';

import { useEffect, useState } from 'react';
import {
  PoundSterling,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { formatStatus } from '@/components/admin/OrderStatusBadge';
import { formatPrice } from '@/lib/utils';
import { getDashboardStats } from '@/lib/dashboard';
import { OrderStatus } from '@ecommerce/shared-types';
import type { DashboardStats } from '@ecommerce/shared-types';

const STATUS_BAR_COLOR: Record<string, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-400',
  [OrderStatus.PROCESSING]: 'bg-blue-500',
  [OrderStatus.SHIPPED]: 'bg-indigo-500',
  [OrderStatus.DELIVERED]: 'bg-green-500',
  [OrderStatus.CANCELLED]: 'bg-red-500',
};

const STATUS_ORDER = Object.values(OrderStatus);

interface StatCard {
  label: string;
  value: string;
  icon: typeof PoundSterling;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getDashboardStats();
        if (active) setStats(data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cards: StatCard[] = stats
    ? [
        { label: 'Total sales', value: formatPrice(stats.totalRevenue), icon: PoundSterling },
        { label: 'Orders', value: String(stats.totalOrders), icon: ShoppingBag },
        { label: 'Products', value: String(stats.totalProducts), icon: Package },
        { label: 'Customers', value: String(stats.totalCustomers), icon: Users },
      ]
    : [];

  const maxStatusCount = stats
    ? Math.max(1, ...Object.values(stats.ordersByStatus))
    : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Sales and catalog overview</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-background p-4">
                <Skeleton className="mb-3 h-4 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border bg-background p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
              </div>
            ))}
      </div>

      {/* Revenue trend chart */}
      <div className="mb-6 rounded-lg border bg-background p-4">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Revenue — last 14 days</h2>
        </div>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : stats ? (
          <RevenueChart data={stats.revenueByDay} />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by status */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-4 text-sm font-semibold">Orders by status</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {STATUS_ORDER.map((status) => {
                const count = stats.ordersByStatus[status] ?? 0;
                return (
                  <div key={status} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">
                      {formatStatus(status)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${STATUS_BAR_COLOR[status]}`}
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-medium tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Top-selling products */}
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Top-selling products</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : stats && stats.topProducts.length > 0 ? (
            <ol className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate" title={p.productName}>
                    {p.productName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{p.unitsSold} sold</span>
                  <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                    {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
