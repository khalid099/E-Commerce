'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingCart, ShieldCheck, RotateCcw } from 'lucide-react';
import { ProductTone } from '@/components/storefront/ProductTone';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import {
  money,
  cartEstimate,
  SHIPPING_THRESHOLD,
  PROMO_CODE,
} from '@/lib/storefront';
import type { CartItem } from '@ecommerce/shared-types';

export default function CartPage() {
  const { cart, isLoading, fetchCart } = useCartStore();
  const showToast = useUiStore((s) => s.showToast);
  const router = useRouter();

  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === PROMO_CODE) {
      setPromoApplied(true);
      showToast('Promo applied — 10% off');
    } else {
      setPromoApplied(false);
      showToast('Invalid promo code');
    }
  };

  const subtotal = cart?.subtotal ?? 0;
  const itemCount = cart?.itemCount ?? 0;
  const hasItems = !!cart && cart.items.length > 0;
  const { discount, shipping, total } = cartEstimate(subtotal, hasItems, promoApplied);
  const freeShipMsg =
    subtotal >= SHIPPING_THRESHOLD
      ? "You've unlocked free shipping"
      : `Add ${money(SHIPPING_THRESHOLD - subtotal)} more for free shipping`;

  return (
    <main className="mx-auto max-w-[1100px] animate-page-in px-5 pb-12 pt-11 sm:px-8">
      <h1 className="mb-[30px] font-serif text-[46px]">Shopping Cart</h1>

      {isLoading && !cart ? (
        <CartSkeleton />
      ) : !hasItems ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Discover something you'll love."
          action={{ href: '/products', label: 'Start shopping' }}
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            {cart!.items.map((item) => (
              <CartLine key={item.id} item={item} />
            ))}
          </div>

          <aside className="rounded-[20px] border border-maison-line bg-white p-[26px] dark:bg-maison-panel lg:sticky lg:top-24">
            <div className="mb-[18px] text-lg font-bold">Order Summary</div>

            <div className="mb-2 flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Promo code"
                className="flex-1 rounded-[10px] border border-maison-line-strong px-3.5 py-3 text-[13.5px] uppercase outline-none focus:border-maison-clay"
              />
              <button
                onClick={applyPromo}
                className="rounded-[10px] bg-maison-ink px-[18px] text-[13.5px] font-semibold text-maison-cream"
              >
                Apply
              </button>
            </div>
            <div className="mb-[18px] text-xs text-maison-subtle">
              Try{' '}
              <span className="rounded bg-[#F4ECE0] px-[7px] py-0.5 font-bold tracking-[.5px] text-maison-clay-dark dark:bg-maison-cream">
                {PROMO_CODE}
              </span>{' '}
              for 10% off
            </div>

            <div className="flex flex-col gap-3 border-t border-maison-line pt-4">
              <Row label={`Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})`} value={money(subtotal)} />
              {promoApplied && (
                <div className="flex justify-between text-sm text-maison-leaf">
                  <span>Discount ({PROMO_CODE})</span>
                  <span className="font-semibold">&minus;{money(discount)}</span>
                </div>
              )}
              <Row label="Shipping" value={shipping === 0 ? 'Free' : money(shipping)} />
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-maison-line pt-4">
              <span className="text-[17px] font-bold">Total</span>
              <span className="text-2xl font-bold">{money(total)}</span>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="mt-[18px] h-[54px] w-full rounded-full bg-maison-clay text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,.32)] transition-transform hover:-translate-y-0.5"
            >
              Proceed to Checkout
            </button>
            <div className="mt-2.5 text-center text-xs text-maison-subtle">{freeShipMsg}</div>

            <div className="mt-[18px] flex flex-col gap-2.5 border-t border-maison-line pt-4">
              <Trust icon={ShieldCheck}>Secure checkout</Trust>
              <Trust icon={RotateCcw}>Free 30-day returns</Trust>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const [busy, setBusy] = useState(false);

  const change = async (qty: number) => {
    if (qty < 1 || qty > item.product.stockQuantity) return;
    setBusy(true);
    try {
      await updateItem(item.id, qty);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeItem(item.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-[18px] rounded-[18px] border border-maison-line bg-white p-[18px] dark:bg-maison-panel">
      <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
        <ProductTone
          name={item.product.name}
          categoryName={item.product.category?.name}
          imageUrl={item.product.imageUrl}
          initialClassName="text-[54px]"
          className="h-24 w-24 rounded-[14px]"
        />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-[.8px] text-maison-clay-dark">
              {item.product.category?.name?.toUpperCase()}
            </div>
            <Link
              href={`/products/${item.product.id}`}
              className="mt-[3px] block text-[16.5px] font-semibold transition-colors hover:text-maison-clay"
            >
              {item.product.name}
            </Link>
            {(item.selectedColor || item.selectedSize) && (
              <div className="mt-[5px] flex flex-wrap gap-1.5">
                {[item.selectedColor, item.selectedSize].filter(Boolean).map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-[#F4ECE0] px-2.5 py-0.5 text-[11.5px] font-semibold text-maison-clay-dark dark:bg-maison-cream"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-[5px] text-[13px] text-maison-subtle">
              {money(item.product.price)} each
            </div>
          </div>
          <div className="whitespace-nowrap text-lg font-bold">{money(item.lineTotal)}</div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center overflow-hidden rounded-full border border-maison-line-strong">
            <button
              onClick={() => change(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              aria-label="Decrease quantity"
              className="h-9 w-9 text-lg text-maison-muted transition-colors hover:bg-[#F4ECE0] disabled:opacity-40 dark:hover:bg-maison-cream"
            >
              &minus;
            </button>
            <span className="w-[34px] text-center text-[14.5px] font-semibold">
              {busy ? '…' : item.quantity}
            </span>
            <button
              onClick={() => change(item.quantity + 1)}
              disabled={busy || item.quantity >= item.product.stockQuantity}
              aria-label="Increase quantity"
              className="h-9 w-9 text-lg text-maison-muted transition-colors hover:bg-[#F4ECE0] disabled:opacity-40 dark:hover:bg-maison-cream"
            >
              +
            </button>
          </div>
          <button
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1.5 text-[13px] font-medium text-maison-subtle transition-colors hover:text-maison-clay disabled:opacity-50"
          >
            <Trash2 className="h-[15px] w-[15px]" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-maison-muted">
      <span>{label}</span>
      <span className="font-semibold text-maison-ink">{value}</span>
    </div>
  );
}

function Trust({ icon: Icon, children }: { icon: typeof ShieldCheck; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px] text-maison-muted">
      <Icon className="h-[15px] w-[15px] text-maison-clay" />
      {children}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-[18px] rounded-[18px] border border-maison-line bg-white p-[18px] dark:bg-maison-panel">
            <Skeleton className="h-24 w-24 rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-80 rounded-[20px]" />
    </div>
  );
}
