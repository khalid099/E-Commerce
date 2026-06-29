'use client';

import Link from 'next/link';
import { ProductTone } from './ProductTone';
import { useAddToCart } from '@/hooks/useAddToCart';
import { money, stars } from '@/lib/storefront';
import type { Product } from '@ecommerce/shared-types';

interface ProductCardProps {
  product: Product;
  /** Show the "NEW" badge (catalog/new-arrivals contexts). */
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
  const compareAt = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;
  const onSale = compareAt != null && compareAt > Number(product.price);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await add(product, 1);
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

        {onSale ? (
          <div className="absolute left-3 top-3 rounded-full bg-maison-clay px-2.5 py-[5px] text-[11px] font-bold uppercase tracking-[.8px] text-white">
            Sale
          </div>
        ) : (
          isNew && (
            <div className="absolute left-3 top-3 rounded-full bg-maison-ink px-2.5 py-[5px] text-[11px] font-semibold tracking-[.5px] text-maison-cream">
              NEW
            </div>
          )
        )}

        {!inStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-maison-cream/70 text-[13px] font-bold tracking-[1px] text-maison-subtle">
            SOLD OUT
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[22px] font-light text-maison-ink shadow-[0_4px_14px_rgba(0,0,0,.12)] backdrop-blur-[6px] transition-all duration-200 hover:scale-110 hover:bg-maison-clay hover:text-white disabled:opacity-60"
          >
            +
          </button>
        )}
      </div>

      <div className="mt-3.5 text-[11.5px] font-semibold tracking-[.8px] text-maison-clay-dark">
        {product.category?.name?.toUpperCase()}
      </div>
      <div className="mt-1 text-base font-semibold leading-[1.3] text-maison-ink">{product.name}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[15px] font-semibold text-[#3A342C]">{money(product.price)}</span>
        {onSale && (
          <span className="text-[13px] text-maison-faint line-through">{money(compareAt)}</span>
        )}
        {showRating && product.rating != null && (
          <span className="ml-auto text-xs text-[#B0A595]">{stars(Number(product.rating))}</span>
        )}
      </div>
    </Link>
  );
}
