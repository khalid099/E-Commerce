'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { getAdminOrder, updateOrderStatus } from '@/lib/adminOrders';
import { OrderStatusBadge, formatStatus } from '@/components/admin/OrderStatusBadge';
import type { Order } from '@ecommerce/shared-types';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '@ecommerce/shared-types';

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-lg lg:col-span-2" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setOrder(await getAdminOrder(id));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
        else toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleStatusChange = async (next: OrderStatus) => {
    if (!order || next === order.status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, next);
      setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev));
      toast.success(`Status updated to ${formatStatus(next)}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center py-24 text-center">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-semibold">Order not found</h2>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  const options = [order.status, ...nextStatuses];

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/admin/orders">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Orders
        </Link>
      </Button>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
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

      {/* Status update */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Update Status
        </h2>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This order is in a final state and can no longer change.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <Select
              value={order.status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="max-w-[200px]"
              aria-label="Update status"
            >
              {options.map((s) => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </Select>
            {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <p className="text-xs text-muted-foreground">
              Allowed next: {nextStatuses.map(formatStatus).join(', ')}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">Items ({order.items.length})</h2>
          <div className="divide-y rounded-lg border bg-card">
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

        {/* Sidebar */}
        <div className="space-y-4">
          {order.customer && (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </h2>
              <p className="text-sm font-medium">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{order.customer.email}</p>
            </div>
          )}

          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
                <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
              </div>
            </div>
            <div className="my-3 border-t" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
