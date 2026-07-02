'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, Loader2, Trash, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@/components/admin/Panel';
import { StockBadge } from '@/components/admin/StockBadge';
import { ProductTone } from '@/components/storefront/ProductTone';
import { listAdminProducts, deleteProduct, listCategories } from '@/lib/adminProducts';
import { money } from '@/lib/storefront';
import { getErrorMessage } from '@/lib/errors';
import type { Category, Product } from '@ecommerce/shared-types';

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminProducts({
        search: debounced || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [debounced, categoryId, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to the first page when a filter changes.
  useEffect(() => {
    setPage(1);
  }, [debounced, categoryId]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteProduct(deleting.id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete product'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const chipClass = (active: boolean) =>
    `cursor-pointer rounded-full border px-4 py-[9px] text-[13px] font-semibold transition-colors ${
      active
        ? 'border-maison-ink bg-maison-ink text-white'
        : 'border-maison-line-strong bg-white text-maison-muted hover:border-maison-clay dark:bg-maison-panel'
    }`;

  const hasFilters = Boolean(debounced || categoryId);

  return (
    <div>
      {/* header band */}
      <div className="relative mb-[18px] overflow-hidden rounded-[16px] border border-maison-line bg-white dark:bg-maison-panel">
        {/* warm wash + watermark, echoing the dashboard's stat cards */}
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(105deg,#FBEFE9 0%,#FBF7F1 44%,transparent 72%)' }}
        />
        <Package
          className="pointer-events-none absolute -bottom-5 right-7 h-28 w-28 text-[#C75B39] opacity-[0.06]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4 px-[26px] py-[18px]">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F7E4DB] text-maison-clay">
              <Package className="h-[22px] w-[22px]" />
            </span>
            <div>
              <div className="text-[10.5px] font-bold tracking-[1.4px] text-maison-clay">CATALOGUE</div>
              <h1 className="font-serif text-[26px] leading-tight text-maison-ink">Products</h1>
              <p className="text-[13px] text-maison-subtle">
                <span className="font-semibold text-maison-ink tabular-nums">{total}</span>{' '}
                {total === 1 ? 'product' : 'products'} in the store
                {hasFilters && ' · filtered'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-maison-clay px-5 py-[11px] text-[13.5px] font-semibold text-white shadow-[0_10px_24px_rgba(199,91,57,0.3)] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-[16px] w-[16px]" strokeWidth={2.4} />
            New product
          </Link>
        </div>
      </div>

      {/* toolbar */}
      <div className="mb-[18px] flex flex-wrap items-center gap-3.5">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-maison-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full rounded-full border border-maison-line-strong bg-white py-[13px] pl-11 pr-10 text-[14.5px] outline-none transition-colors focus:border-maison-clay dark:bg-maison-panel"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-maison-faint transition-colors hover:bg-maison-panel hover:text-maison-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* category chips */}
      <div className="mb-[22px] flex flex-wrap gap-2">
        <button type="button" className={chipClass(categoryId === '')} onClick={() => setCategoryId('')}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chipClass(categoryId === c.id)}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* table */}
      <Panel className="overflow-hidden shadow-[0_12px_36px_rgba(120,90,60,0.07)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-maison-line bg-gradient-to-r from-[#FBEFE9] via-[#FBF7F1] to-[#FBF7F1] text-[11.5px] font-bold tracking-[0.8px] text-maison-subtle dark:bg-maison-panel dark:from-maison-panel dark:via-maison-panel dark:to-maison-panel">
                <th scope="col" className="px-[26px] py-[15px] font-bold">PRODUCT</th>
                <th scope="col" className="px-3 py-[15px] font-bold">CATEGORY</th>
                <th scope="col" className="px-3 py-[15px] font-bold">PRICE</th>
                <th scope="col" className="px-3 py-[15px] font-bold">STOCK</th>
                <th scope="col" className="px-3 py-[15px] font-bold">STATUS</th>
                <th scope="col" className="px-[26px] py-[15px] text-right font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2EDE4] dark:border-maison-line">
                    <td colSpan={6} className="px-[26px] py-4">
                      <div className="h-12 animate-pulse rounded-lg bg-maison-panel" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-[76px] text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FBEFE9] text-maison-clay">
                      <Package className="h-7 w-7" />
                    </div>
                    <div className="font-serif text-[26px] text-maison-ink">No products found</div>
                    <p className="mt-1.5 text-maison-subtle">
                      {hasFilters ? 'Try a different search or category.' : 'Add your first product to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const onSale =
                    p.compareAtPrice != null && Number(p.compareAtPrice) > Number(p.price);
                  return (
                    <tr
                      key={p.id}
                      className={`group border-b border-[#F2EDE4] transition-colors last:border-0 hover:bg-[#FBF7F1] dark:border-maison-line dark:hover:bg-maison-line/40 ${p.isActive ? '' : 'opacity-60'}`}
                    >
                      <td className="px-[26px] py-3.5">
                        <div className="flex items-center gap-3.5">
                          <ProductTone
                            name={p.name}
                            categoryName={p.category?.name}
                            imageUrl={p.imageUrl}
                            initialClassName="text-[20px]"
                            className="h-[52px] w-[52px] flex-shrink-0 rounded-[12px] ring-1 ring-inset ring-maison-line transition-transform duration-300 group-hover:scale-[1.06]"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-[14.5px] font-semibold text-maison-ink">{p.name}</div>
                            <div className="mt-0.5 text-[11px] font-medium tracking-[0.4px] text-maison-faint">
                              ID {p.id.slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        {p.category?.name ? (
                          <span className="inline-flex rounded-full bg-maison-panel px-[11px] py-[5px] text-[12.5px] font-medium text-maison-muted dark:bg-maison-line">
                            {p.category.name}
                          </span>
                        ) : (
                          <span className="text-[13.5px] text-maison-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14.5px] font-bold text-maison-ink tabular-nums">
                            {money(p.price)}
                          </span>
                          {onSale && (
                            <>
                              <span className="text-[12.5px] text-maison-faint line-through tabular-nums">
                                {money(p.compareAtPrice as number)}
                              </span>
                              <span className="rounded-full bg-[#F6E1E1] px-[7px] py-[2px] text-[10px] font-bold tracking-[0.4px] text-[#B23B3B]">
                                SALE
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-maison-muted tabular-nums">{p.stockQuantity}</td>
                      <td className="px-3 py-3.5">
                        {p.isActive ? (
                          <StockBadge quantity={p.stockQuantity} />
                        ) : (
                          <span className="inline-flex rounded-full bg-maison-panel px-[11px] py-[5px] text-xs font-bold text-maison-faint dark:bg-maison-line">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-[26px] py-3.5">
                        <div className="flex justify-end gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            aria-label={`Edit ${p.name}`}
                            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-maison-line-strong bg-white text-maison-muted transition-colors hover:border-maison-clay hover:text-maison-clay dark:bg-maison-panel"
                          >
                            <Pencil className="h-[15px] w-[15px]" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
                            aria-label={`Delete ${p.name}`}
                            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-maison-line-strong bg-white text-maison-muted transition-colors hover:border-[#B23B3B] hover:bg-[#F6E1E1] hover:text-[#B23B3B] dark:bg-maison-panel"
                          >
                            <Trash2 className="h-[15px] w-[15px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-maison-subtle">
        <span>{total} products</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {deleting && (
        <div
          className="fixed inset-0 z-[320] flex animate-fade-in items-center justify-center bg-[rgba(33,28,22,0.42)] p-6 backdrop-blur-sm"
          onClick={() => !deleteBusy && setDeleting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete product"
            className="w-full max-w-[420px] animate-modal-in rounded-[22px] bg-white p-[30px] text-center shadow-[0_40px_90px_rgba(33,28,22,0.32)] dark:bg-maison-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full bg-[#F6E1E1] text-[#B23B3B]">
              <Trash className="h-[26px] w-[26px]" />
            </div>
            <div className="mb-1.5 font-serif text-[26px] text-maison-ink">Delete product?</div>
            <p className="mb-6 text-[14.5px] leading-relaxed text-maison-muted">
              {deleting.name} will be hidden from the storefront. Existing orders that reference it are
              preserved.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="flex-1 rounded-full border border-maison-stone bg-white py-[13px] text-[14.5px] font-semibold text-maison-ink transition-colors hover:bg-[#F4ECE0] disabled:opacity-60 dark:bg-maison-panel dark:hover:bg-maison-line"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#B23B3B] py-[13px] text-[14.5px] font-semibold text-white transition-colors hover:bg-[#992F2F] disabled:opacity-60"
              >
                {deleteBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
