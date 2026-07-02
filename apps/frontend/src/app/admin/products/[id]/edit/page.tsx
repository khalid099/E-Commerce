'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import { Panel } from '@/components/admin/Panel';
import { getAdminProduct, listCategories } from '@/lib/adminProducts';
import type { Category, Product } from '@ecommerce/shared-types';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [p, cats] = await Promise.all([getAdminProduct(params.id), listCategories()]);
        if (!active) return;
        setProduct(p);
        setCategories(cats);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="h-[280px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
          <div className="h-[220px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
        </div>
        <div className="h-[360px] animate-pulse rounded-[18px] border border-maison-line bg-white dark:bg-maison-panel" />
      </div>
    );
  }

  if (status === 'error' || !product) {
    return (
      <Panel className="px-6 py-[70px] text-center">
        <div className="font-serif text-[26px] text-maison-ink">Product not found</div>
        <p className="mt-1.5 text-maison-subtle">It may have been removed, or the link is wrong.</p>
        <Link
          href="/admin/products"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-maison-clay px-5 py-[11px] text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </Panel>
    );
  }

  return <ProductForm product={product} categories={categories} />;
}
