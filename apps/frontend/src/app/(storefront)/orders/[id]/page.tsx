'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductTone } from '@/components/storefront/ProductTone';
import { StatusBadge } from '@/components/storefront/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import type { Order, ApiResponse } from '@ecommerce/shared-types';
import { OrderStatus } from '@ecommerce/shared-types';

const STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse<Order>>(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[880px] px-5 py-11 sm:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-24 w-full rounded-[18px]" />
        <Skeleton className="mt-6 h-64 w-full rounded-[18px]" />
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center sm:px-8">
        <div className="mb-2 font-serif text-[34px]">Order not found</div>
        <p className="mb-6 text-maison-subtle">
          This order doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/orders" className="inline-block rounded-full bg-maison-ink px-6 py-3 font-semibold text-white">
          Back to orders
        </Link>
      </main>
    );
  }

  const addr = order.shippingAddress;
  const currentIdx = STEPS.indexOf(order.status);
  const cancelled = order.status === OrderStatus.CANCELLED;

  return (
    <main className="mx-auto max-w-[880px] animate-page-in px-5 pb-12 pt-11 sm:px-8">
      <Link href="/orders" className="mb-6 inline-flex items-center gap-1.5 text-sm text-maison-subtle hover:text-maison-clay">
        <ArrowLeft className="h-4 w-4" />
        My orders
      </Link>

      <div className="mb-1.5 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[40px]">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mb-8 text-sm text-maison-subtle">
        Placed on{' '}
        {new Date(order.createdAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      {/* Status tracker */}
      <div className="mb-7 rounded-[18px] border border-maison-line bg-white p-6">
        {cancelled ? (
          <div className="rounded-lg bg-[#F6E8E4] px-4 py-3 text-sm font-medium text-maison-clay-dark">
            This order has been cancelled.
          </div>
        ) : (
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const done = idx <= currentIdx;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        done ? 'bg-maison-clay text-white' : 'bg-[#EFE7DA] text-maison-faint',
                      )}
                    >
                      {idx + 1}
                    </div>
                    <span className={cn('text-[10.5px] font-semibold', done ? 'text-maison-clay' : 'text-maison-faint')}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('mx-1 mb-4 h-0.5 flex-1', idx < currentIdx ? 'bg-maison-clay' : 'bg-[#EFE7DA]')} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-[18px] border border-maison-line bg-white">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3.5 border-b border-maison-line p-4 last:border-b-0">
                <ProductTone name={item.productName} initialClassName="text-[24px]" className="h-12 w-12 flex-shrink-0 rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.productName}</p>
                  <p className="text-xs text-maison-subtle">
                    {money(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold">{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + address */}
        <div className="space-y-5">
          <div className="rounded-[18px] border border-maison-line bg-white p-5">
            <div className="mb-3.5 text-xs font-bold tracking-[1px] text-maison-faint">SUMMARY</div>
            <div className="space-y-2 text-sm text-maison-muted">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{money(order.tax)}</span></div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : money(order.shippingCost)}</span>
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-maison-line pt-3 font-bold">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>

          <div className="rounded-[18px] border border-maison-line bg-white p-5">
            <div className="mb-3 text-xs font-bold tracking-[1px] text-maison-faint">SHIPPING ADDRESS</div>
            <address className="space-y-0.5 text-sm not-italic text-maison-ink">
              <p className="font-semibold">{addr.fullName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
              <p>{addr.country}</p>
            </address>
          </div>
        </div>
      </div>
    </main>
  );
}
