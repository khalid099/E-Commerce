'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
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
        <Link href="/orders" className="inline-block rounded-full bg-maison-ink px-6 py-3 font-semibold text-maison-cream">
          Back to orders
        </Link>
      </main>
    );
  }

  const addr = order.shippingAddress;
  const currentIdx = STEPS.indexOf(order.status);
  const cancelled = order.status === OrderStatus.CANCELLED;
  // Delivered is terminal: the whole flow is complete, so no node is "in progress" —
  // the final step reads as a tick, not a highlighted step number.
  const complete = order.status === OrderStatus.DELIVERED;

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
      <div className="mb-7 rounded-[20px] border border-maison-line bg-white p-7 shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
        {cancelled ? (
          <div className="rounded-xl bg-[#F6E8E4] px-4 py-3.5 text-sm font-medium text-maison-clay-dark">
            This order has been cancelled.
          </div>
        ) : (
          <div className="flex items-start">
            {STEPS.map((step, idx) => {
              const done = idx <= currentIdx;
              const current = idx === currentIdx && !complete;
              return (
                <div key={step} className="flex flex-1 items-start last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-colors',
                        done ? 'bg-maison-clay text-white' : 'bg-[#EFE7DA] text-maison-faint dark:bg-maison-line',
                        current && 'ring-4 ring-maison-clay/15',
                      )}
                    >
                      {done && !current ? <Check className="h-[18px] w-[18px]" /> : idx + 1}
                    </div>
                    <span className={cn('text-[11px] font-semibold', done ? 'text-maison-clay' : 'text-maison-faint')}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="mx-1.5 mt-[17px] h-[3px] flex-1 overflow-hidden rounded-full bg-[#EFE7DA] dark:bg-maison-line">
                      <div
                        className={cn('h-full rounded-full bg-maison-clay transition-all duration-500', idx < currentIdx ? 'w-full' : 'w-0')}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-[20px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
            <div className="border-b border-maison-line bg-gradient-to-b from-maison-panel to-white dark:to-maison-panel px-6 py-3.5 text-[11px] font-bold uppercase tracking-[1px] text-maison-faint">
              Items · {order.items.length}
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-maison-line/70 px-6 py-4 last:border-b-0">
                <ProductTone
                  name={item.productName}
                  imageUrl={item.productImageUrl}
                  initialClassName="text-[26px]"
                  className="h-16 w-16 flex-shrink-0 rounded-[13px] ring-1 ring-maison-line"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{item.productName}</p>
                  {(item.selectedColor || item.selectedSize) && (
                    <p className="mt-0.5 text-xs font-medium text-maison-clay-dark">
                      {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-maison-subtle">
                    {money(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="text-[15px] font-semibold tabular-nums">{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + address */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[20px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
            <div className="border-b border-maison-line bg-gradient-to-b from-maison-panel to-white dark:to-maison-panel px-5 py-3.5 text-[11px] font-bold uppercase tracking-[1px] text-maison-faint">
              Summary
            </div>
            <div className="p-5">
              <div className="space-y-2.5 text-sm text-maison-muted">
                <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums text-maison-ink">{money(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span className="tabular-nums text-maison-ink">{money(order.tax)}</span></div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={cn('tabular-nums', order.shippingCost === 0 ? 'font-semibold text-maison-clay' : 'text-maison-ink')}>
                    {order.shippingCost === 0 ? 'Free' : money(order.shippingCost)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-maison-line pt-4">
                <span className="font-bold">Total</span>
                <span className="font-serif text-[22px] text-maison-clay tabular-nums">{money(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
            <div className="border-b border-maison-line bg-gradient-to-b from-maison-panel to-white dark:to-maison-panel px-5 py-3.5 text-[11px] font-bold uppercase tracking-[1px] text-maison-faint">
              Shipping Address
            </div>
            <address className="space-y-0.5 p-5 text-sm not-italic leading-relaxed text-maison-ink">
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
