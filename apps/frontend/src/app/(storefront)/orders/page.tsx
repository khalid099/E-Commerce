'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductTone } from '@/components/storefront/ProductTone';
import { StatusBadge } from '@/components/storefront/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/lib/storefront';
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
          className="rounded-full border border-maison-stone px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:border-maison-clay hover:bg-white hover:text-maison-clay"
        >
          Sign out
        </button>
      </div>

      {isLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-[22px] border border-maison-line bg-white px-5 py-20 text-center">
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
      className="block overflow-hidden rounded-[18px] border border-maison-line bg-white transition-colors hover:border-maison-clay/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-maison-line bg-maison-panel px-6 py-5">
        <div className="flex flex-wrap gap-9">
          <Meta label="ORDER" value={`#${order.id.slice(0, 8).toUpperCase()}`} />
          <Meta
            label="PLACED"
            value={new Date(order.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
          <Meta label="TOTAL" value={money(order.total)} />
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex flex-col gap-3.5 px-6 py-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3.5">
            <ProductTone
              name={item.productName}
              initialClassName="text-[24px]"
              className="h-12 w-12 flex-shrink-0 rounded-[10px]"
            />
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold">{item.productName}</div>
              <div className="text-[12.5px] text-maison-subtle">Qty {item.quantity}</div>
            </div>
            <div className="text-sm font-semibold">{money(item.lineTotal)}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-[.6px] text-maison-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-[18px]">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-[18px] border border-maison-line bg-white">
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
