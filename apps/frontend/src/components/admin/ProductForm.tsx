'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { listCategories } from '@/lib/adminProducts';
import type { Category, Product } from '@ecommerce/shared-types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stockQuantity: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative'),
  categoryId: z.string().uuid('Select a category'),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  isActive: z.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

export interface ProductFormSubmit {
  values: ProductFormValues;
  /** A freshly selected file to upload, if any. */
  file: File | null;
}

interface ProductFormProps {
  /** Existing product when editing; undefined when creating. */
  product?: Product;
  onSubmit: (data: ProductFormSubmit) => Promise<void>;
  submitLabel: string;
}

export function ProductForm({ product, onSubmit, submitLabel }: ProductFormProps) {
  const isEdit = Boolean(product);
  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? undefined,
      stockQuantity: product?.stockQuantity ?? undefined,
      categoryId: product?.categoryId ?? '',
      imageUrl: product?.imageUrl ?? '',
      isActive: product?.isActive ?? true,
    },
  });

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const imageUrlValue = watch('imageUrl');
  const preview = filePreview ?? (imageUrlValue || product?.imageUrl) ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit({ values, file });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Left: text fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <Input {...register('name')} placeholder="Wireless Headphones" />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <Textarea
              {...register('description')}
              rows={5}
              placeholder="Premium noise-cancelling headphones…"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price (£)</label>
              <Input type="number" step="0.01" min="0" {...register('price')} placeholder="79.99" />
              {errors.price && (
                <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Stock</label>
              <Input type="number" step="1" min="0" {...register('stockQuantity')} placeholder="50" />
              {errors.stockQuantity && (
                <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <Select {...register('categoryId')} defaultValue={product?.categoryId ?? ''}>
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border" />
              Active (visible in the storefront)
            </label>
          )}
        </div>

        {/* Right: image */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">Product image</label>
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview accepts arbitrary external URLs; next/image remote patterns are storefront-scoped
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                <ImagePlus className="h-10 w-10" />
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Image URL
            </label>
            <Input
              {...register('imageUrl')}
              placeholder="https://…"
              disabled={Boolean(file)}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">— or —</div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-secondary/80"
            />
            {file && (
              <button
                type="button"
                onClick={clearFile}
                className="mt-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X className="h-3 w-3" />
                Remove selected file ({file.name})
              </button>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG, WebP or GIF, up to 5MB.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
