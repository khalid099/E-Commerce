'use client';

import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useWishlistStore } from '@/store/wishlistStore';

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const loaded = useWishlistStore((s) => s.loaded);

  return (
    <main className="mx-auto max-w-[1180px] animate-page-in px-5 pb-12 pt-11 sm:px-8">
      <div className="mb-1.5 text-[12.5px] font-semibold tracking-[1.4px] text-maison-clay">YOUR EDIT</div>
      <h1 className="mb-[30px] font-serif text-[46px]">Wishlist</h1>

      {!loaded ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full rounded-[18px]" />
              <Skeleton className="mt-3.5 h-3 w-1/3" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={{ href: '/products', label: 'Explore the shop' }}
        />
      ) : (
        <>
          <div className="mb-6 text-sm text-maison-subtle">
            {items.length} saved item{items.length === 1 ? '' : 's'}
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} showRating />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
