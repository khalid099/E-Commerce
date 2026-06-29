'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductForm, type ProductFormSubmit } from '@/components/admin/ProductForm';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminProduct, updateProduct, uploadProductImage } from '@/lib/adminProducts';
import { getErrorMessage } from '@/lib/errors';
import type { Product } from '@ecommerce/shared-types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getAdminProduct(id)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async ({ values, file }: ProductFormSubmit) => {
    try {
      await updateProduct(id, {
        name: values.name,
        description: values.description,
        price: values.price,
        stockQuantity: values.stockQuantity,
        categoryId: values.categoryId,
        isActive: values.isActive,
        // When a file is selected it's uploaded separately and wins, so don't
        // overwrite imageUrl here.
        imageUrl: file ? undefined : values.imageUrl || undefined,
      });

      if (file) {
        await uploadProductImage(id, file);
      }

      toast.success('Product updated');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update product'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Product</h1>

      <div className="rounded-lg border bg-background p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        ) : notFound || !product ? (
          <p className="py-8 text-center text-muted-foreground">Product not found.</p>
        ) : (
          <ProductForm product={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
        )}
      </div>
    </div>
  );
}
