'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/lib/storefront';
import type { ApiResponse, Order } from '@ecommerce/shared-types';

export function OrderConfirmationContent() {
  const orderId = useSearchParams().get('order');
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    api
      .get<ApiResponse<Order>>(`/orders/${orderId}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-[680px] px-5 py-16 sm:px-8">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-10 w-2/3" />
        <Skeleton className="mt-9 h-52 w-full rounded-[20px]" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center sm:px-8">
        <div className="mb-2 font-serif text-[34px]">Order not found</div>
        <p className="mb-6 text-maison-subtle">We couldn&apos;t find that order.</p>
        <Link href="/orders" className="inline-block rounded-full bg-maison-ink px-6 py-3 font-semibold text-white">
          View my orders
        </Link>
      </main>
    );
  }

  const eta = new Date(new Date(order.createdAt).getTime() + 5 * 86400000).toLocaleDateString(
    'en-US',
    { weekday: 'short', month: 'short', day: 'numeric' },
  );

  return (
    <main className="mx-auto max-w-[680px] animate-page-in px-5 py-16 sm:px-8">
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-[88px] w-[88px]">
          <div className="animate-ring-scale absolute inset-0 rounded-full bg-maison-leaf-soft" />
          <svg className="absolute inset-0" width="88" height="88" viewBox="0 0 88 88" fill="none">
            <path
              d="M28 45 L40 57 L62 33"
              stroke="#3F7A52"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-[12.5px] font-semibold tracking-[2px] text-maison-clay">
          ORDER CONFIRMED
        </div>
        <h1 className="mb-3 mt-2.5 font-serif text-[44px]">Thank you, {user?.firstName ?? 'friend'}!</h1>
        <p className="text-base text-maison-muted">
          A confirmation has been sent to {user?.email ?? 'your email'}.
        </p>
      </div>

      <div className="mt-8 rounded-[20px] border border-maison-line bg-white p-7">
        <div className="flex justify-between border-b border-maison-line pb-[18px]">
          <div>
            <div className="text-xs text-maison-subtle">Order number</div>
            <div className="mt-[3px] text-[15px] font-bold">#{order.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-maison-subtle">Estimated delivery</div>
            <div className="mt-[3px] text-[15px] font-bold">{eta}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 border-b border-maison-line py-[18px]">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[14.5px]">
              <span className="text-[#3A342C]">
                {item.productName}
                {(item.selectedColor || item.selectedSize) && (
                  <span className="text-maison-clay-dark">
                    {' '}
                    ({[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')})
                  </span>
                )}{' '}
                <span className="text-maison-subtle">× {item.quantity}</span>
              </span>
              <span className="font-semibold">{money(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-[18px] text-lg">
          <span className="font-bold">Total paid</span>
          <span className="font-bold">{money(order.total)}</span>
        </div>
      </div>

      <div className="mt-[26px] flex gap-3.5">
        <Link
          href="/orders"
          className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-maison-ink text-[15px] font-semibold text-white transition-colors hover:bg-black"
        >
          View my orders
        </Link>
        <Link
          href="/products"
          className="flex h-[52px] flex-1 items-center justify-center rounded-full border border-maison-stone text-[15px] font-semibold transition-colors hover:bg-white"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
