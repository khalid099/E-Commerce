'use client';

import { useSearchParams } from 'next/navigation';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/productsApi';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-card">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const buildUrl = (targetPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(targetPage));
    return `/products?${p.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={buildUrl(page - 1)}
        aria-disabled={!hasPreviousPage}
        className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent ${
          !hasPreviousPage ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        ← Previous
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildUrl(page + 1)}
        aria-disabled={!hasNextPage}
        className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent ${
          !hasNextPage ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        Next →
      </Link>
    </nav>
  );
}

export function ProductsContent() {
  const searchParams = useSearchParams();

  const params = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([, v]) => v !== ''),
  );

  const {
    data: productsPage,
    isLoading: productsLoading,
    isFetching,
    isError,
  } = useGetProductsQuery(params);

  const { data: categories = [] } = useGetCategoriesQuery();

  return (
    <>
      <div className="mb-6 rounded-lg border bg-card p-4">
        <ProductFilters categories={categories} />
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-destructive">Could not load products.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Make sure the backend is running on port 3001.
          </p>
        </div>
      ) : productsLoading ? (
        <ProductGridSkeleton />
      ) : productsPage?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium">No products found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {productsPage?.meta.total.toLocaleString()} product
              {productsPage?.meta.total !== 1 ? 's' : ''} found
            </p>
            {isFetching && !productsLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">Updating…</span>
            )}
          </div>

          <div
            className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${
              isFetching ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {productsPage?.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {productsPage && (
            <Pagination
              page={productsPage.meta.page}
              totalPages={productsPage.meta.totalPages}
              hasNextPage={productsPage.meta.hasNextPage}
              hasPreviousPage={productsPage.meta.hasPreviousPage}
            />
          )}
        </>
      )}
    </>
  );
}
