'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@ecommerce/shared-types';

function CartItemRow({ item }: { item: CartItem }) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1) return;
    setIsUpdating(true);
    try {
      await updateItem(item.id, newQty);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex gap-4 py-5 first:pt-0">
      {/* Product image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.product.category?.name}
            </p>
            <Link
              href={`/products/${item.product.id}`}
              className="mt-0.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              {item.product.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPrice(item.product.price)} each
            </p>
          </div>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-md border">
            <button
              onClick={() => handleQtyChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-l-md transition-colors hover:bg-muted disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex h-8 w-10 items-center justify-center border-x text-sm font-medium">
              {isUpdating ? '…' : item.quantity}
            </span>
            <button
              onClick={() => handleQtyChange(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.product.stockQuantity}
              className="flex h-8 w-8 items-center justify-center rounded-r-md transition-colors hover:bg-muted disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <span className="text-base font-semibold text-foreground">
            {formatPrice(item.lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 py-5">
          <Skeleton className="h-24 w-24 flex-shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/5" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { cart, isLoading, fetchCart, clearCart } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } finally {
      setIsClearing(false);
    }
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your Cart</h1>

      {isLoading && !cart ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CartSkeleton />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-muted-foreground">
            Add some products to get started.
          </p>
          <Button asChild>
            <Link href="/products">
              Browse Products
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card">
              <div className="divide-y px-6">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
              <div className="border-t px-6 py-4">
                <button
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className="text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  {isClearing ? 'Clearing…' : 'Clear cart'}
                </button>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                  </span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="my-4 border-t" />

              <div className="mb-6 flex justify-between font-semibold text-lg">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>

              <Button className="w-full gap-2" asChild>
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" className="mt-3 w-full" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
