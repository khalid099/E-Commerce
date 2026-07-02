'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Trash2, Heart } from 'lucide-react';
import { ProductTone } from './ProductTone';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { money } from '@/lib/storefront';
import type { Product } from '@ecommerce/shared-types';

interface ProductCardProps {
  product: Product;
  /** Force the "NEW" badge on. By default it follows the product's own isNew flag. */
  isNew?: boolean;
  /** Show the star rating beside the price. Catalog only; not on the API model. */
  showRating?: boolean;
}

/**
 * The storefront product tile used across the catalog, home and related rails.
 * A category-toned backdrop, a hover-revealed quick-add, NEW / SOLD OUT states,
 * and the product meta beneath.
 */
export function ProductCard({ product, isNew = false, showRating = false }: ProductCardProps) {
  const inStock = product.stockQuantity > 0;
  const { add, isAdding } = useAddToCart();
  const cart = useCartStore((s) => s.cart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const bumpCart = useUiStore((s) => s.bumpCart);
  const { wishlisted, toggle: toggleWish, isToggling } = useWishlist(product.id);
  const [busy, setBusy] = useState(false);

  const compareAt = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;
  const onSale = compareAt != null && compareAt > Number(product.price);
  // Sale takes visual priority; a sale item never also reads as NEW.
  const showNew = !onSale && (isNew || product.isNew);

  const handleWish = (e: React.MouseEvent) => {
    stop(e);
    toggleWish(product);
  };

  // The line this card's quick-add owns: the variant-less entry for this product.
  // Variant-specific lines added from the detail page are managed in the cart page.
  const quickLine = cart?.items.find(
    (i) => i.productId === product.id && !i.selectedColor && !i.selectedSize,
  );
  const atStockCap = !!quickLine && quickLine.quantity >= product.stockQuantity;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAdd = async (e: React.MouseEvent) => {
    stop(e);
    await add(product, 1);
  };

  const changeQty = async (e: React.MouseEvent, next: number) => {
    stop(e);
    if (!quickLine || busy) return;
    setBusy(true);
    try {
      if (next < 1) await removeItem(quickLine.id);
      else await updateItem(quickLine.id, next);
      bumpCart();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block transition-transform duration-300 hover:-translate-y-[5px]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] shadow-[0_8px_22px_rgba(120,90,60,.1)]">
        <ProductTone
          name={product.name}
          categoryName={product.category?.name}
          imageUrl={product.imageUrl}
          shade
          className="absolute inset-0"
        />

        <button
          type="button"
          onClick={handleWish}
          disabled={isToggling}
          aria-label={
            wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-[0_4px_12px_rgba(0,0,0,.12)] backdrop-blur-[6px] transition-all duration-200 hover:scale-110 disabled:opacity-60 dark:bg-maison-panel/85 dark:shadow-[0_4px_12px_rgba(0,0,0,.5)] dark:ring-1 dark:ring-white/10"
        >
          <Heart
            className={cn(
              'h-[17px] w-[17px] transition-colors',
              wishlisted ? 'fill-maison-clay text-maison-clay' : 'text-maison-ink',
            )}
          />
        </button>

        {onSale ? (
          <div className="absolute left-3 top-3 rounded-full bg-maison-clay px-2.5 py-[5px] text-[11px] font-bold uppercase tracking-[.8px] text-white">
            Sale
          </div>
        ) : (
          showNew && (
            <div className="absolute left-3 top-3 rounded-full bg-maison-ink px-2.5 py-[5px] text-[11px] font-semibold tracking-[.5px] text-maison-cream dark:bg-maison-panel dark:text-maison-ink">
              NEW
            </div>
          )
        )}

        {!inStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-maison-cream/70 text-[13px] font-bold tracking-[1px] text-maison-subtle">
            SOLD OUT
          </div>
        ) : quickLine ? (
          <div
            onClick={stop}
            className="absolute bottom-3 right-3 flex animate-fade-in items-center gap-0.5 rounded-full bg-maison-clay p-1 text-white shadow-[0_6px_18px_rgba(199,91,57,.45)] backdrop-blur-[6px]"
          >
            <button
              type="button"
              onClick={(e) => changeQty(e, quickLine.quantity - 1)}
              disabled={busy}
              aria-label={
                quickLine.quantity <= 1
                  ? `Remove ${product.name} from cart`
                  : `Decrease ${product.name} quantity`
              }
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              {quickLine.quantity <= 1 ? (
                <Trash2 className="h-[15px] w-[15px]" />
              ) : (
                <Minus className="h-[15px] w-[15px]" />
              )}
            </button>
            <span className="min-w-[18px] text-center text-[13.5px] font-bold tabular-nums">
              {busy ? '·' : quickLine.quantity}
            </span>
            <button
              type="button"
              onClick={(e) => changeQty(e, quickLine.quantity + 1)}
              disabled={busy || atStockCap}
              aria-label={`Increase ${product.name} quantity`}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <Plus className="h-[15px] w-[15px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-maison-ink shadow-[0_4px_14px_rgba(0,0,0,.12)] backdrop-blur-[6px] transition-all duration-200 hover:scale-110 hover:bg-maison-clay hover:text-white disabled:opacity-60 dark:bg-maison-panel/90 dark:shadow-[0_4px_14px_rgba(0,0,0,.5)] dark:ring-1 dark:ring-white/10 dark:hover:bg-maison-clay dark:hover:text-white"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="mt-3.5 text-[11.5px] font-semibold tracking-[.8px] text-maison-clay-dark">
        {product.category?.name?.toUpperCase()}
      </div>
      <div className="mt-1 text-base font-semibold leading-[1.3] text-maison-ink">{product.name}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[15px] font-semibold text-maison-ink">{money(product.price)}</span>
        {onSale && (
          <span className="text-[13px] text-maison-faint line-through">{money(compareAt)}</span>
        )}
        {showRating && product.rating != null && (
          <span className="ml-auto flex items-center gap-1.5">
            <StarRating value={Number(product.rating)} size={13} />
            {product.reviewCount ? (
              <span className="text-[12px] font-medium text-maison-subtle">
                ({product.reviewCount})
              </span>
            ) : null}
          </span>
        )}
      </div>
    </Link>
  );
}
