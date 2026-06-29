'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductForm, type ProductFormSubmit } from '@/components/admin/ProductForm';
import { createProduct, uploadProductImage } from '@/lib/adminProducts';
import { getErrorMessage } from '@/lib/errors';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async ({ values, file }: ProductFormSubmit) => {
    try {
      const product = await createProduct({
        name: values.name,
        description: values.description,
        price: values.price,
        stockQuantity: values.stockQuantity,
        categoryId: values.categoryId,
        // A selected file wins over the URL field and is uploaded right after.
        imageUrl: file ? undefined : values.imageUrl || undefined,
      });

      if (file) {
        await uploadProductImage(product.id, file);
      }

      toast.success('Product created');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create product'));
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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New Product</h1>
      <div className="rounded-lg border bg-background p-6">
        <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" />
      </div>
    </div>
  );
}
