'use client';

import { useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/productsApi';
import { ProductCard } from './ProductCard';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';

const PER_PAGE = 9;
const PRICE_MAX = 500;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Sort: Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = searchParams.get('search') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'featured';
  const isNew = searchParams.get('isNew') === 'true';
  const maxPrice = Number(searchParams.get('maxPrice') ?? PRICE_MAX);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));

  const setParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      if (resetPage && !('page' in updates)) params.delete('page');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: productsPage, isLoading, isFetching, isError } = useGetProductsQuery({
    search: search || undefined,
    categoryId: categoryId || undefined,
    maxPrice: maxPrice < PRICE_MAX ? String(maxPrice) : undefined,
    sortBy: sortBy === 'featured' ? undefined : sortBy,
    isNew: isNew ? 'true' : undefined,
    page: String(page),
    limit: String(PER_PAGE),
  });

  const onSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setParams({ search: value || undefined }), 400);
  };

  const clearFilters = () => router.push(pathname, { scroll: false });

  const total = productsPage?.meta.total ?? 0;
  const totalPages = productsPage?.meta.totalPages ?? 1;
  const products = productsPage?.data ?? [];

  return (
    <main className="mx-auto max-w-[1280px] animate-page-in px-5 pb-10 pt-11 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[12.5px] font-semibold tracking-[2px] text-maison-clay">
            {isNew ? 'JUST IN' : 'THE SHOP'}
          </div>
          <h1 className="mt-2 font-serif text-[44px] sm:text-[52px]">
            {isNew ? 'New Arrivals' : 'All Products'}
          </h1>
        </div>
        <div className="relative min-w-[280px] flex-1 sm:max-w-[320px] sm:flex-none">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-maison-faint" />
          <input
            type="search"
            defaultValue={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-maison-line-strong bg-white py-3.5 pl-11 pr-4 text-[14.5px] outline-none transition-colors focus:border-maison-clay dark:bg-maison-panel"
          />
        </div>
      </div>

      <div className="mt-9 grid items-start gap-9 lg:grid-cols-[248px_1fr]">
        {/* Sidebar filters */}
        <aside className="rounded-[18px] border border-maison-line bg-white p-6 dark:bg-maison-panel lg:sticky lg:top-24">
          <div className="mb-[18px] flex items-center justify-between">
            <span className="text-[15px] font-bold">Filters</span>
            <button
              onClick={clearFilters}
              className="text-[12.5px] font-semibold text-maison-clay"
            >
              Clear all
            </button>
          </div>

          <div className="mb-3 text-xs font-bold tracking-[1px] text-maison-faint">CATEGORY</div>
          <div className="mb-6 flex flex-col gap-1">
            <CategoryRow
              label="All"
              active={!categoryId}
              onClick={() => setParams({ categoryId: undefined })}
            />
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                label={cat.name}
                active={categoryId === cat.id}
                onClick={() => setParams({ categoryId: cat.id })}
              />
            ))}
          </div>

          <div className="mb-3 text-xs font-bold tracking-[1px] text-maison-faint">AVAILABILITY</div>
          <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-maison-muted transition-colors hover:bg-[#FBF7F1] dark:hover:bg-maison-cream">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setParams({ isNew: e.target.checked ? 'true' : undefined })}
              className="h-4 w-4 cursor-pointer accent-maison-clay"
            />
            New arrivals only
          </label>

          <div className="mb-2.5 text-xs font-bold tracking-[1px] text-maison-faint">MAX PRICE</div>
          <input
            type="range"
            min={40}
            max={PRICE_MAX}
            step={10}
            value={maxPrice}
            onChange={(e) => setParams({ maxPrice: e.target.value })}
            aria-label="Maximum price"
            className="w-full cursor-pointer accent-maison-clay"
          />
          <div className="mt-2 flex justify-between text-[13px] font-semibold text-maison-muted">
            <span>$40</span>
            <span className="text-maison-clay">Up to {money(maxPrice)}</span>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-[22px] flex items-center justify-between">
            <span className="text-sm text-maison-subtle">
              {isLoading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setParams({ sortBy: e.target.value })}
                aria-label="Sort products"
                className="cursor-pointer appearance-none rounded-full border border-maison-line-strong bg-white py-2.5 pl-4 pr-9 text-[13.5px] font-semibold outline-none dark:bg-maison-panel"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-maison-subtle" />
            </div>
          </div>

          {isError ? (
            <EmptyState
              title="Couldn't load products"
              body="Make sure the backend is running on port 3001, then try again."
              actionLabel="Retry"
              onAction={() => router.refresh()}
            />
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full rounded-[18px]" />
                  <Skeleton className="mt-3.5 h-3 w-1/3" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              body="No products match your filters."
              actionLabel="Reset filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div
                className={cn(
                  'grid grid-cols-2 gap-6 transition-opacity lg:grid-cols-3',
                  isFetching && 'opacity-60',
                )}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} showRating />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onGo={(p) => setParams({ page: String(p) }, false)}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function CategoryRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors',
        active
          ? 'bg-[#FBEFE9] font-bold text-maison-clay dark:bg-maison-cream'
          : 'font-medium text-maison-muted hover:bg-[#FBF7F1] dark:hover:bg-maison-cream',
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-maison-line bg-white px-5 py-20 text-center dark:bg-maison-panel">
      <div className="mb-2 font-serif text-[30px]">{title}</div>
      <p className="mb-5 text-maison-subtle">{body}</p>
      <button
        onClick={onAction}
        className="rounded-full bg-maison-ink px-6 py-3 font-semibold text-maison-cream transition-colors hover:bg-maison-ink/90"
      >
        {actionLabel}
      </button>
    </div>
  );
}
