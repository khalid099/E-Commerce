import { Suspense } from 'react';
import { ProductsContent } from '@/components/storefront/ProductsContent';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingFallback() {
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

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">All Products</h1>
        <p className="text-muted-foreground">Browse our full collection</p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}
