'use client';

import { useRouter } from 'next/navigation';
import { useGetCategoriesQuery } from '@/store/productsApi';
import { CollectionCard } from './CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';

export function CollectionsContent() {
  const router = useRouter();
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();

  return (
    <main className="mx-auto max-w-[1280px] animate-page-in px-5 pb-16 pt-11 sm:px-8">
      {/* Header */}
      <div>
        <div className="text-[12.5px] font-semibold tracking-[2px] text-maison-clay">
          BROWSE BY CATEGORY
        </div>
        <h1 className="mt-2 font-serif text-[44px] sm:text-[52px]">Collections</h1>
        <p className="mt-3 max-w-[560px] text-[15px] text-maison-subtle">
          Explore the full range, one category at a time — from apparel and bags to eyewear,
          watches and fragrance.
        </p>
      </div>

      {/* Grid */}
      <div className="mt-10">
        {isError ? (
          <div className="rounded-[18px] border border-maison-line bg-white px-5 py-20 text-center dark:bg-maison-panel">
            <div className="mb-2 font-serif text-[30px]">Couldn&apos;t load collections</div>
            <p className="mb-5 text-maison-subtle">
              Make sure the backend is running on port 3001, then try again.
            </p>
            <button
              onClick={() => router.refresh()}
              className="rounded-full bg-maison-ink px-6 py-3 font-semibold text-maison-cream transition-colors hover:bg-maison-ink/90"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-[22px]" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-[18px] border border-maison-line bg-white px-5 py-20 text-center dark:bg-maison-panel">
            <div className="mb-2 font-serif text-[30px]">No collections yet</div>
            <p className="text-maison-subtle">Categories will appear here once they&apos;re added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <CollectionCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
