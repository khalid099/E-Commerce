'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { ProductTone } from '@/components/storefront/ProductTone';
import { StatusBadge } from '@/components/storefront/StatusBadge';
import { ReviewModal } from '@/components/storefront/ReviewModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import type { Order, PaginatedResponse, ApiResponse } from '@ecommerce/shared-types';
import { OrderStatus } from '@ecommerce/shared-types';

interface ReviewTarget {
  productId: string;
  productName: string;
}

const PAGE_SIZE = 5;

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsLoading(true);
    api
      .get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params: { page, limit: PAGE_SIZE },
      })
      .then((res) => {
        setOrders(res.data.data.data);
        setTotalPages(res.data.data.meta.totalPages);
      })
      .catch(() => {
        setOrders([]);
        setTotalPages(1);
      })
      .finally(() => setIsLoading(false));
  }, [page]);

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
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={{ href: '/products', label: 'Browse products' }}
          className="py-20"
        />
      ) : (
        <>
          <div className="flex flex-col gap-[18px]">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                reviewed={reviewed}
                onReview={setReviewTarget}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onGo={setPage} />
        </>
      )}

      {reviewTarget && (
        <ReviewModal
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          open
          onOpenChange={(next) => !next && setReviewTarget(null)}
          onSaved={() =>
            setReviewed((prev) => new Set(prev).add(reviewTarget.productId))
          }
        />
      )}
    </main>
  );
}

function OrderCard({
  order,
  reviewed,
  onReview,
}: {
  order: Order;
  reviewed: Set<string>;
  onReview: (target: ReviewTarget) => void;
}) {
  const delivered = order.status === OrderStatus.DELIVERED;
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-maison-clay/40 hover:shadow-[0_18px_40px_rgba(120,90,60,.12)] dark:bg-maison-panel">
      {/* Whole-card navigation sits behind the content; interactive controls
          (review buttons) opt above it with a higher z-index. */}
      <Link
        href={`/orders/${order.id}`}
        aria-label={`View order #${order.id.slice(0, 8).toUpperCase()}`}
        className="absolute inset-0 z-10"
      />

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
              {delivered && (
                <button
                  type="button"
                  onClick={() =>
                    onReview({ productId: item.productId, productName: item.productName })
                  }
                  className="relative z-20 mt-2 inline-flex items-center gap-1.5 rounded-full border border-maison-line-strong px-3 py-1 text-[12px] font-semibold text-maison-clay-dark transition-colors hover:border-maison-clay hover:text-maison-clay"
                >
                  <Star className="h-3 w-3" />
                  {reviewed.has(item.productId) ? 'Edit review' : 'Write a review'}
                </button>
              )}
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
    </div>
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
