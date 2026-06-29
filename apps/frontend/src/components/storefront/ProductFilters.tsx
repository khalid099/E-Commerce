'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import type { Category } from '@ecommerce/shared-types';

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      let resetPage = false;

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
          resetPage = true;
        }
      });

      if (resetPage && !('page' in updates)) {
        params.delete('page');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateParams({ search: value || undefined });
    }, 400);
  };

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products…"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get('categoryId') ?? ''}
        onChange={(e) => updateParams({ categoryId: e.target.value || undefined })}
        className="w-[180px]"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min £"
          defaultValue={searchParams.get('minPrice') ?? ''}
          min={0}
          className="w-24"
          onChange={(e) => updateParams({ minPrice: e.target.value || undefined })}
          aria-label="Minimum price"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max £"
          defaultValue={searchParams.get('maxPrice') ?? ''}
          min={0}
          className="w-24"
          onChange={(e) => updateParams({ maxPrice: e.target.value || undefined })}
          aria-label="Maximum price"
        />
      </div>

      <Select
        value={searchParams.get('sortBy') ?? 'newest'}
        onChange={(e) => updateParams({ sortBy: e.target.value })}
        className="w-[170px]"
        aria-label="Sort by"
      >
        <option value="newest">Newest First</option>
        <option value="price_asc">Price: Low → High</option>
        <option value="price_desc">Price: High → Low</option>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
