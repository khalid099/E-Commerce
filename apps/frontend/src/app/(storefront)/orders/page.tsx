'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductTone } from '@/components/storefront/ProductTone';
import { StatusBadge } from '@/components/storefront/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import type { Order, PaginatedResponse, ApiResponse } from '@ecommerce/shared-types';

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params: { page: 1, limit: 20 } })
      .then((res) => setOrders(res.data.data.data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-[880px] animate-page-in px-5 pb-12 pt-11 sm:px-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[46px]">Your Orders</h1>
          {user && <p className="mt-1.5 text-maison-subtle">Signed in as {user.email}</p>}
        </div>
        <button
          onClick={() => logout()}
          className="rounded-full border border-maison-stone px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:border-maison-clay hover:bg-white hover:text-maison-clay dark:hover:bg-maison-panel"
        >
          Sign out
        </button>
      </div>

      {isLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-[22px] border border-maison-line bg-white px-5 py-20 text-center dark:bg-maison-panel">
          <div className="mb-2 font-serif text-[30px]">No orders yet</div>
          <p className="mb-[22px] text-maison-subtle">When you place an order, it will appear here.</p>
          <Link
            href="/products"
            className="inline-block rounded-full bg-maison-clay px-7 py-3.5 font-semibold text-white"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="group block overflow-hidden rounded-[20px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-maison-clay/40 hover:shadow-[0_18px_40px_rgba(120,90,60,.12)] dark:bg-maison-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-maison-line bg-gradient-to-b from-maison-panel to-white dark:to-maison-panel px-6 py-[18px]">
        <div className="flex flex-wrap items-center gap-x-9 gap-y-3">
          <Meta label="ORDER" value={`#${order.id.slice(0, 8).toUpperCase()}`} mono />
          <Meta
            label="PLACED"
            value={new Date(order.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
          <Meta label="TOTAL" value={money(order.total)} accent />
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex flex-col divide-y divide-maison-line/70 px-6">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-3.5">
            <ProductTone
              name={item.productName}
              imageUrl={item.productImageUrl}
              initialClassName="text-[24px]"
              className="h-14 w-14 flex-shrink-0 rounded-[12px] ring-1 ring-maison-line"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-semibold">{item.productName}</div>
              <div className="mt-0.5 text-[12.5px] text-maison-subtle">
                Qty {item.quantity}
                {[item.selectedColor, item.selectedSize].filter(Boolean).length > 0 && (
                  <span> · {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}</span>
                )}
              </div>
            </div>
            <div className="text-sm font-semibold tabular-nums">{money(item.lineTotal)}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-maison-line bg-maison-panel/40 px-6 py-3.5">
        <span className="text-[12.5px] text-maison-subtle">
          {order.items.length} item{order.items.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-maison-clay transition-transform duration-300 group-hover:translate-x-0.5">
          View details
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function Meta({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[.9px] text-maison-subtle">
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-bold',
          mono && 'font-mono tracking-tight',
          accent && 'text-maison-clay',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-[18px]">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel">
          <div className="border-b border-maison-line bg-maison-panel px-6 py-5">
            <Skeleton className="h-10 w-2/3" />
          </div>
          <div className="space-y-3 px-6 py-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
