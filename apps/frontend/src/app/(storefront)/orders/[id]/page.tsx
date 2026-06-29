'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import type { Order, ApiResponse } from '@ecommerce/shared-types';
import { OrderStatus } from '@ecommerce/shared-types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:    'bg-yellow-100 text-yellow-800',
  [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [OrderStatus.SHIPPED]:    'bg-indigo-100 text-indigo-800',
  [OrderStatus.DELIVERED]:  'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]:  'bg-red-100 text-red-800',
};

const STATUS_STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === OrderStatus.CANCELLED) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        This order has been cancelled.
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                } ${active ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-[10px] font-medium capitalize ${
                  done ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`mx-1 mb-4 h-0.5 flex-1 transition-colors ${
                  idx < currentIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 rounded-lg border p-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-semibold">Order not found</h2>
        <p className="mb-6 text-muted-foreground">
          This order doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild variant="outline">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/orders">
            <ArrowLeft className="mr-1 h-4 w-4" />
            My Orders
          </Link>
        </Button>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
        >
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </span>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Placed on{' '}
        {new Date(order.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      {/* Status tracker */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order Status
        </h2>
        <StatusTracker status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">
            Items ({order.items.length})
          </h2>
          <div className="rounded-lg border bg-card divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold">
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (10%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}
                </span>
              </div>
            </div>
            <div className="my-3 border-t" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Shipping Address
            </h2>
            <address className="space-y-0.5 text-sm not-italic text-foreground">
              <p className="font-medium">{addr.fullName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p>{addr.country}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
