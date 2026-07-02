'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, XCircle, Loader2, ShoppingBag, MapPin, type LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductTone } from '@/components/storefront/ProductTone';
import { StatusPill } from '@/components/admin/StatusPill';
import { OrderStatusStepper } from '@/components/admin/OrderStatusStepper';
import { updateOrderStatus } from '@/lib/adminOrders';
import { formatStatus, nextStatuses } from '@/lib/orderStatus';
import { getErrorMessage } from '@/lib/errors';
import { money } from '@/lib/storefront';
import { shortId } from '@/lib/utils';
import { OrderStatus, type Order } from '@ecommerce/shared-types';

interface OrderDrawerProps {
  order: Order;
  onClose: () => void;
  onUpdated: (order: Order) => void;
}

export function OrderDrawer({ order, onClose, onUpdated }: OrderDrawerProps) {
  const [busy, setBusy] = useState(false);
  // Portal target: the admin <main> carries a transform (animate-page-in) which
  // would otherwise anchor this `position: fixed` drawer to it instead of the
  // viewport, so we render into document.body.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const allowed = nextStatuses(order.status);
  // The advance target is the next fulfilment step (i.e. anything but cancel).
  const advanceTarget = allowed.find((s) => s !== OrderStatus.CANCELLED) ?? null;
  const canCancel = allowed.includes(OrderStatus.CANCELLED);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
  const customerInitials = order.customer
    ? `${order.customer.firstName.charAt(0)}${order.customer.lastName.charAt(0)}`.toUpperCase()
    : '—';

  const changeStatus = async (next: OrderStatus) => {
    setBusy(true);
    try {
      const updated = await updateOrderStatus(order.id, next);
      onUpdated({ ...order, status: updated.status });
      toast.success(`Order #${shortId(order.id)} → ${formatStatus(next)}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update status'));
    } finally {
      setBusy(false);
    }
  };

  const placedAt = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const addr = order.shippingAddress;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[310] flex animate-fade-in justify-end bg-[rgba(33,28,22,0.42)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${shortId(order.id)}`}
        className="flex h-screen w-full max-w-[480px] animate-drawer-in flex-col bg-maison-cream shadow-[-30px_0_80px_rgba(33,28,22,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header — a warm gradient band with the customer avatar */}
        <div className="relative flex items-start justify-between overflow-hidden border-b border-maison-line bg-gradient-to-br from-[#FBF3E9] to-white px-7 py-6 dark:from-maison-panel dark:to-maison-panel">
          <span
            className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-maison-clay opacity-[0.07] blur-2xl"
            aria-hidden
          />
          <div className="relative flex min-w-0 items-center gap-3.5">
            <span className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-maison-clay to-maison-clay-dark text-[19px] font-bold text-white shadow-[0_10px_24px_rgba(199,91,57,0.32)]">
              {customerInitials}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[1.2px] text-maison-clay">
                ORDER #{shortId(order.id)}
              </div>
              <div className="mt-0.5 truncate font-serif text-[24px] leading-tight text-maison-ink">
                {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Customer'}
              </div>
              <div className="mt-0.5 truncate text-[13px] text-maison-subtle">
                {order.customer?.email ? `${order.customer.email} · ` : ''}
                {placedAt}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-[#F4ECE0] text-maison-muted transition-colors hover:bg-[#E9DECF] dark:bg-maison-line dark:hover:bg-maison-stone"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {/* current status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[12.5px] font-bold tracking-[0.8px] text-maison-subtle">CURRENT STATUS</div>
            <StatusPill status={order.status} />
          </div>

          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-[#F6E1E1] px-[18px] py-4">
              <XCircle className="h-[22px] w-[22px] flex-shrink-0 text-[#B23B3B]" />
              <div>
                <div className="text-[14.5px] font-bold text-[#B23B3B]">Order cancelled</div>
                <div className="text-[13px] text-[#8A6060]">This order will not be fulfilled.</div>
              </div>
            </div>
          ) : (
            <OrderStatusStepper status={order.status} />
          )}

          {/* actions */}
          {(advanceTarget || canCancel) && (
            <div className="my-6 flex gap-2.5">
              {advanceTarget && (
                <button
                  type="button"
                  onClick={() => changeStatus(advanceTarget)}
                  disabled={busy}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-maison-clay text-[14.5px] font-semibold text-white shadow-[0_10px_24px_rgba(199,91,57,0.28)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Mark as {formatStatus(advanceTarget)}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => changeStatus(OrderStatus.CANCELLED)}
                  disabled={busy}
                  className="h-12 rounded-xl border border-[#E0BDBD] bg-white px-5 text-sm font-semibold text-[#B23B3B] transition-colors hover:bg-[#F6E1E1] disabled:opacity-60 dark:bg-maison-panel"
                >
                  Cancel order
                </button>
              )}
            </div>
          )}

          {/* items */}
          <SectionLabel icon={ShoppingBag}>
            ITEMS
            <span className="ml-auto rounded-full bg-[#F2EDE4] px-2 py-0.5 text-[11px] font-bold text-maison-subtle dark:bg-maison-line">
              {itemCount}
            </span>
          </SectionLabel>
          <div className="overflow-hidden rounded-[16px] border border-maison-line bg-white dark:bg-maison-panel">
            <div className="px-[18px]">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3.5 border-b border-[#F2EDE4] py-[13px] last:border-0 dark:border-maison-line"
                >
                  <ProductTone
                    name={it.productName}
                    imageUrl={it.productImageUrl}
                    initialClassName="text-[18px]"
                    className="h-[46px] w-[46px] flex-shrink-0 rounded-[10px] ring-1 ring-maison-line"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-maison-ink">{it.productName}</div>
                    {(it.selectedColor || it.selectedSize) && (
                      <div className="text-[12px] text-maison-clay-dark">
                        {[it.selectedColor, it.selectedSize].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="text-[12.5px] text-maison-subtle">
                      {money(it.unitPrice)} × {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-maison-ink tabular-nums">{money(it.lineTotal)}</div>
                </div>
              ))}
            </div>

            {/* totals — a tinted footer that anchors the card */}
            <div className="flex flex-col gap-2.5 border-t border-maison-line bg-[#FBF7F1] px-[18px] py-4 dark:bg-[#221D17]">
              <Row label="Subtotal" value={money(order.subtotal)} />
              <Row label="Tax" value={money(order.tax)} />
              <Row
                label="Shipping"
                value={order.shippingCost === 0 ? 'Free' : money(order.shippingCost)}
              />
              <div className="mt-1 flex items-center justify-between border-t border-maison-line pt-3">
                <span className="text-[15px] font-bold text-maison-ink">Total</span>
                <span className="text-[19px] font-extrabold tabular-nums text-maison-clay">{money(order.total)}</span>
              </div>
            </div>
          </div>

          {/* shipping address */}
          <SectionLabel icon={MapPin}>SHIP TO</SectionLabel>
          <address className="flex gap-3.5 rounded-[16px] border border-maison-line bg-white px-[18px] py-4 not-italic dark:bg-maison-panel">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F4ECE0] text-maison-clay dark:bg-maison-line">
              <MapPin className="h-[17px] w-[17px]" />
            </span>
            <div className="text-[13.5px] leading-relaxed text-maison-muted">
              <div className="font-semibold text-maison-ink">{addr.fullName}</div>
              <div>{addr.line1}</div>
              {addr.line2 && <div>{addr.line2}</div>}
              <div>
                {addr.city}, {addr.state} {addr.postalCode}
              </div>
              <div>{addr.country}</div>
            </div>
          </address>

          <div className="pb-2 pt-4 text-center text-xs text-maison-faint">
            {itemCount} item{itemCount === 1 ? '' : 's'} · placed {placedAt}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Icon-led section heading, shared by the drawer's ITEMS and SHIP TO groups. */
function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-2 text-[12.5px] font-bold tracking-[0.8px] text-maison-subtle">
      <Icon className="h-4 w-4 text-maison-clay" />
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px] text-maison-muted">
      <span>{label}</span>
      <span className="font-semibold text-maison-ink">{value}</span>
    </div>
  );
}
