'use client';

import { useEffect, useState } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { listCategories } from '@/lib/adminProducts';
import type { Category } from '@ecommerce/shared-types';

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return <ProductForm categories={categories} />;
}
