'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Trophy,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@/components/admin/Panel';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueBars } from '@/components/admin/RevenueBars';
import { StatusDonut } from '@/components/admin/StatusDonut';
import { StatusPill } from '@/components/admin/StatusPill';
import { ProductTone } from '@/components/storefront/ProductTone';
import { getDashboardStats } from '@/lib/dashboard';
import { listAdminOrders } from '@/lib/adminOrders';
import { money, compactMoney } from '@/lib/storefront';
import { shortId } from '@/lib/utils';
import type { DashboardStats, Order } from '@ecommerce/shared-types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, orders] = await Promise.all([
          getDashboardStats(),
          listAdminOrders({ limit: 5 }),
        ]);
        if (!active) return;
        setStats(s);
        setRecent(orders.data);
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

  if (loading || !stats) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
          ))}
        </div>
        <div className="grid grid-cols-[1.55fr_1fr] gap-5">
          <div className="h-[320px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
          <div className="h-[320px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
        </div>
      </div>
    );
  }

  const months = stats.revenueByMonth;
  const sixMoTotal = months.reduce((sum, m) => sum + m.revenue, 0);
  // Month-over-month revenue delta from the last two realised months.
  const revenueTrend =
    months.length >= 2 && months[months.length - 2].revenue > 0
      ? Math.round(
          ((months[months.length - 1].revenue - months[months.length - 2].revenue) /
            months[months.length - 2].revenue) *
            100,
        )
      : null;

  return (
    <div className="space-y-5">
      {/* stat cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard
          label="Total sales"
          value={compactMoney(stats.totalRevenue)}
          icon={DollarSign}
          iconClassName="bg-[#FBEFE9] text-[#C75B39]"
          accent="#C75B39"
          trend={revenueTrend}
          caption="vs last month"
        />
        <StatCard
          label="Total orders"
          value={String(stats.totalOrders)}
          icon={ShoppingBag}
          iconClassName="bg-[#EAF0F6] text-[#1A5A9A]"
          accent="#1A5A9A"
        />
        <StatCard
          label="Avg. order value"
          value={money(stats.averageOrderValue)}
          icon={TrendingUp}
          iconClassName="bg-[#F5EEDD] text-[#9A6B1A]"
          accent="#9A6B1A"
        />
        <StatCard
          label="Customers"
          value={String(stats.totalCustomers)}
          icon={Users}
          iconClassName="bg-[#F2E8EC] text-[#A05A6E]"
          accent="#A05A6E"
        />
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="px-[26px] py-6 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(120,90,60,0.10)]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBEFE9] text-[#C75B39]">
                <BarChart3 className="h-[18px] w-[18px]" />
              </span>
              <div>
                <div className="text-base font-bold text-maison-ink">Revenue</div>
                <div className="mt-0.5 text-[13px] text-maison-subtle">Last 6 months</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-extrabold tracking-[-0.5px] tabular-nums text-maison-ink">
                {compactMoney(sixMoTotal)}
              </div>
              <div className="text-xs font-semibold text-[#3F7A52]">net of cancellations</div>
            </div>
          </div>
          <RevenueBars data={stats.revenueByMonth} />
        </Panel>

        <Panel className="px-[26px] py-6 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(120,90,60,0.10)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2F0E6] text-[#3F7A52]">
              <PieChart className="h-[18px] w-[18px]" />
            </span>
            <div>
              <div className="text-base font-bold text-maison-ink">Orders by status</div>
              <div className="mt-0.5 text-[13px] text-maison-subtle">{stats.totalOrders} orders total</div>
            </div>
          </div>
          <StatusDonut counts={stats.ordersByStatus} />
        </Panel>
      </div>

      {/* top sellers + recent orders */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="px-[26px] py-6 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(120,90,60,0.10)]">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EEDD] text-[#9A6B1A]">
                <Trophy className="h-[18px] w-[18px]" />
              </span>
              <div className="text-base font-bold text-maison-ink">Top-selling products</div>
            </div>
            <div className="text-[12.5px] text-maison-subtle">by units sold</div>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-maison-subtle">No sales yet.</p>
          ) : (
            stats.topProducts.map((p, i) => (
              <div
                key={p.productId}
                className="flex items-center gap-3.5 border-b border-[#F2EDE4] py-[13px] dark:border-maison-line last:border-0"
              >
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-serif text-[15px] font-semibold"
                  style={
                    i === 0
                      ? { background: 'linear-gradient(135deg,#F0D67E,#D9A93C)', color: '#6B4E12' }
                      : i === 1
                        ? { background: 'linear-gradient(135deg,#E4E4E4,#BFC3C7)', color: '#5A5E63' }
                        : i === 2
                          ? { background: 'linear-gradient(135deg,#E7C29A,#C88A5A)', color: '#6B4023' }
                          : { background: 'transparent', color: 'rgb(var(--m-clay))' }
                  }
                >
                  {i + 1}
                </span>
                <ProductTone
                  name={p.productName}
                  categoryName={p.categoryName}
                  imageUrl={p.imageUrl}
                  initialClassName="text-[18px]"
                  className="h-11 w-11 flex-shrink-0 rounded-[11px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-maison-ink">{p.productName}</div>
                  <div className="text-[12.5px] text-maison-subtle">{p.categoryName ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-maison-ink">{p.unitsSold} sold</div>
                  <div className="text-[12.5px] font-semibold text-[#3F7A52]">{compactMoney(p.revenue)}</div>
                </div>
              </div>
            ))
          )}
        </Panel>

        <Panel className="px-[26px] py-6 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(120,90,60,0.10)]">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0F6] text-[#1A5A9A]">
                <Receipt className="h-[18px] w-[18px]" />
              </span>
              <div className="text-base font-bold text-maison-ink">Recent orders</div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin/orders')}
              className="text-[12.5px] font-semibold text-maison-clay hover:underline"
            >
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-maison-subtle">No orders yet.</p>
          ) : (
            recent.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => router.push(`/admin/orders?order=${o.id}`)}
                className="flex w-full items-center gap-3.5 border-b border-[#F2EDE4] py-[13px] dark:border-maison-line text-left transition-opacity last:border-0 hover:opacity-70"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-maison-ink">#{shortId(o.id)}</div>
                  <div className="truncate text-[12.5px] text-maison-subtle">
                    {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '—'}
                  </div>
                </div>
                <div className="whitespace-nowrap text-sm font-bold text-maison-ink">{money(o.total)}</div>
                <StatusPill status={o.status} />
              </button>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
