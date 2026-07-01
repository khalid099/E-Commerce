'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, RotateCcw, Heart } from 'lucide-react';
import { useGetProductQuery, useGetProductsQuery } from '@/store/productsApi';
import { ProductTone } from './ProductTone';
import { ProductCard } from './ProductCard';
import { ProductReviews } from './ProductReviews';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useWishlist } from '@/hooks/useWishlist';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';

export function ProductDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useGetProductQuery(id);
  const { add, isAdding } = useAddToCart();
  const { wishlisted, toggle: toggleWish, isToggling } = useWishlist(id);
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<string | null>(null);

  // Pre-select the first colour swatch once the product loads, so a product
  // with colours always has a valid default selection.
  useEffect(() => {
    if (product?.colors?.length) {
      setActiveColor((current) => current ?? product.colors![0].name);
    }
  }, [product]);

  // Related: other products in the same category.
  const { data: relatedPage } = useGetProductsQuery(
    product ? { categoryId: product.categoryId, limit: '5' } : { limit: '5' },
    { skip: !product },
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center">
        <div className="mb-2 font-serif text-[34px]">Product not found</div>
        <p className="mb-6 text-maison-subtle">This product doesn&apos;t exist or is unavailable.</p>
        <Link
          href="/products"
          className="inline-block rounded-full bg-maison-ink px-6 py-3 font-semibold text-maison-cream"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  const inStock = product.stockQuantity > 0;
  const rating = product.rating != null ? Number(product.rating) : null;
  const reviews = product.reviewCount ?? 0;
  const compareAt = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;
  const onSale = compareAt != null && compareAt > Number(product.price);
  const savePct = onSale ? Math.round((1 - Number(product.price) / compareAt!) * 100) : 0;
  const related = (relatedPage?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  // Colour and size are optional — whatever is selected is passed through.
  const handleAdd = () => add(product, qty, activeColor, activeSize);
  const handleBuyNow = async () => {
    const ok = await add(product, qty, activeColor, activeSize);
    if (ok) router.push('/checkout');
  };

  return (
    <main className="mx-auto max-w-[1180px] animate-page-in px-5 pb-12 pt-7 sm:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-[13px] text-maison-subtle">
        <Link href="/products" className="hover:text-maison-clay">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-maison-clay">{product.category?.name}</span>
        <span className="mx-2">/</span>
        <span className="text-maison-ink">{product.name}</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-[52px]">
        {/* Gallery */}
        <div>
          <ProductTone
            name={product.name}
            categoryName={product.category?.name}
            imageUrl={product.imageUrl}
            initialClassName="text-[230px]"
            className="aspect-square rounded-3xl shadow-[0_24px_56px_rgba(120,90,60,.18)]"
          />
          <div className="mt-3.5 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveThumb(i)}
                aria-label={`View ${i + 1}`}
                className={cn(
                  'overflow-hidden rounded-xl border-2',
                  activeThumb === i ? 'border-maison-clay' : 'border-transparent',
                )}
              >
                <ProductTone
                  name={product.name}
                  categoryName={product.category?.name}
                  imageUrl={product.imageUrl}
                  initialClassName="text-[36px]"
                  className="aspect-square"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-[12.5px] font-semibold tracking-[1.4px] text-maison-clay-dark">
            {product.category?.name?.toUpperCase()}
          </div>
          <h1 className="mb-3.5 mt-2.5 font-serif text-[42px] leading-[1.08]">{product.name}</h1>

          {rating != null && (
            <div className="mb-5 flex items-center gap-2.5">
              <StarRating value={rating} size={17} />
              <a
                href="#reviews"
                className="text-[13.5px] text-maison-subtle transition-colors hover:text-maison-clay"
              >
                {rating.toFixed(1)} · {reviews} review{reviews === 1 ? '' : 's'}
              </a>
            </div>
          )}

          <div className="mb-[18px] flex items-baseline gap-3">
            <span className="text-[34px] font-bold">{money(product.price)}</span>
            {onSale && (
              <>
                <span className="text-[19px] text-maison-faint line-through">{money(compareAt)}</span>
                <span className="rounded-full bg-[rgba(199,91,57,.12)] px-2.5 py-1 text-xs font-bold text-maison-clay">
                  Save {savePct}%
                </span>
              </>
            )}
          </div>

          <p className="mb-[22px] text-[15.5px] leading-[1.65] text-maison-muted">
            {product.description}
          </p>

          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted">
                Colour
                {activeColor && <span className="ml-1.5 text-maison-ink">— {activeColor}</span>}
              </div>
              <div className="flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveColor(c.name)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={activeColor === c.name}
                    className={cn(
                      'h-[34px] w-[34px] rounded-full ring-2 ring-maison-cream transition-shadow',
                      activeColor === c.name
                        ? 'shadow-[0_0_0_2px_var(--tw-ring-color),0_0_0_4px_#C75B39] dark:shadow-[0_0_0_2px_var(--tw-ring-color),0_0_0_4px_#D97452]'
                        : 'shadow-[0_0_0_1px_#E2D8C7] dark:shadow-[0_0_0_1px_rgba(240,233,222,.18)]',
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-7">
              <div className="mb-3 text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted">Size</div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSize(s)}
                    aria-pressed={activeSize === s}
                    className={cn(
                      'min-w-[50px] rounded-[9px] border px-3.5 py-2.5 text-[13.5px] font-bold transition-colors',
                      activeSize === s
                        ? 'border-maison-ink bg-maison-ink text-maison-cream'
                        : 'border-maison-line-strong bg-white text-maison-ink hover:border-maison-ink dark:bg-maison-panel',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {inStock ? (
            <div className="mb-[26px] inline-flex items-center gap-2 rounded-full bg-maison-leaf-soft px-3.5 py-[7px] text-[13px] font-semibold text-maison-leaf">
              <span className="h-[7px] w-[7px] rounded-full bg-maison-leaf" />
              In stock · {product.stockQuantity} available
            </div>
          ) : (
            <div className="mb-[26px] inline-flex items-center gap-2 rounded-full bg-[#F6E8E4] px-3.5 py-[7px] text-[13px] font-semibold text-maison-clay-dark">
              Currently out of stock
            </div>
          )}

          {inStock && (
            <>
              <div className="mb-[18px] flex items-center gap-3.5">
                <div className="flex items-center overflow-hidden rounded-full border border-maison-line-strong bg-white dark:bg-maison-panel">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="h-[52px] w-12 text-[22px] text-maison-muted transition-colors hover:bg-[#F4ECE0] dark:hover:bg-maison-cream"
                  >
                    &minus;
                  </button>
                  <span className="w-[42px] text-center text-base font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                    aria-label="Increase quantity"
                    className="h-[52px] w-12 text-[22px] text-maison-muted transition-colors hover:bg-[#F4ECE0] dark:hover:bg-maison-cream"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="h-[52px] flex-1 rounded-full bg-maison-clay text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,.32)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(199,91,57,.42)] disabled:opacity-60"
                >
                  Add to cart · {money(product.price * qty)}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={isAdding}
                className="mb-3 h-[52px] w-full rounded-full bg-maison-ink text-[15.5px] font-semibold text-maison-cream transition-colors hover:bg-maison-ink/90 disabled:opacity-60"
              >
                Buy it now
              </button>
            </>
          )}

          <button
            onClick={() => toggleWish(product)}
            disabled={isToggling}
            aria-pressed={wishlisted}
            className={cn(
              'mb-7 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border text-[15.5px] font-semibold transition-colors disabled:opacity-60',
              wishlisted
                ? 'border-maison-clay bg-[rgba(199,91,57,.08)] text-maison-clay'
                : 'border-maison-line-strong text-maison-ink hover:border-maison-ink',
            )}
          >
            <Heart className={cn('h-[18px] w-[18px]', wishlisted && 'fill-maison-clay')} />
            {wishlisted ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>

          <div className="border-t border-maison-line pt-6">
            <div className="mb-3.5 text-[14.5px] font-bold">Product details</div>
            <p className="text-sm leading-relaxed text-maison-muted">{product.description}</p>
            <div className="mt-5 flex flex-wrap gap-6">
              <span className="flex items-center gap-2 text-[13px] text-maison-muted">
                <Truck className="h-[17px] w-[17px] text-maison-clay" />
                Free shipping over $150
              </span>
              <span className="flex items-center gap-2 text-[13px] text-maison-muted">
                <RotateCcw className="h-[17px] w-[17px] text-maison-clay" />
                30-day returns
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="scroll-mt-24">
        <ProductReviews productId={product.id} onAggregateChange={refetch} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-[72px]">
          <h2 className="mb-6 font-serif text-[32px]">You may also like</h2>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function DetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-12 pt-7 sm:px-8">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-[52px]">
        <div>
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="mt-3.5 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[52px] w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
