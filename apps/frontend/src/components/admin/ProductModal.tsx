'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductTone } from '@/components/storefront/ProductTone';
import { createProduct, updateProduct, uploadProductImage } from '@/lib/adminProducts';
import { getErrorMessage } from '@/lib/errors';
import type { Category, CreateProductDto, Product, UpdateProductDto } from '@ecommerce/shared-types';

const schema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Enter a valid price'),
  stockQuantity: z.coerce.number().int('Whole numbers only').min(0, 'Cannot be negative'),
  categoryId: z.string().uuid('Select a category'),
  compareAtPrice: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().positive('Must be greater than 0').optional(),
  ),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.input<typeof schema>;

const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-maison-muted';
const FIELD =
  'w-full rounded-[11px] border bg-white px-[15px] py-[13px] text-[14.5px] text-maison-ink outline-none transition-colors focus:border-maison-clay dark:bg-maison-panel';

interface ProductModalProps {
  /** The product being edited; omit to create. */
  product?: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductModal({ product, categories, onClose, onSaved }: ProductModalProps) {
  const isEdit = Boolean(product);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? ('' as unknown as number),
      stockQuantity: product?.stockQuantity ?? ('' as unknown as number),
      categoryId: product?.categoryId ?? '',
      compareAtPrice: product?.compareAtPrice ?? '',
      imageUrl: product?.imageUrl ?? '',
      isActive: product?.isActive ?? true,
    },
  });

  // Close on Escape — dialogs must be keyboard-dismissible.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Build/revoke a local object URL so the preview updates before upload.
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
  const categoryId = watch('categoryId');
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? null;
  const nameValue = watch('name');
  const previewImage = (filePreview ?? (imageUrlValue || product?.imageUrl)) || null;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    if (picked) setValue('imageUrl', ''); // a file wins over a URL
  };

  const onSubmit = handleSubmit(async (raw) => {
    const values = raw as z.infer<typeof schema>;
    try {
      const base: CreateProductDto = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: values.price,
        stockQuantity: values.stockQuantity,
        categoryId: values.categoryId,
        imageUrl: values.imageUrl || undefined,
        compareAtPrice: values.compareAtPrice,
      };

      let saved: Product;
      if (product) {
        const update: UpdateProductDto = { ...base, isActive: values.isActive };
        saved = await updateProduct(product.id, update);
      } else {
        saved = await createProduct(base);
      }

      if (file) {
        await uploadProductImage(saved.id, file);
      }

      toast.success(isEdit ? `${saved.name} updated` : `${saved.name} added`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save product'));
    }
  });

  return (
    <div
      className="fixed inset-0 z-[300] flex animate-fade-in items-center justify-center bg-[rgba(33,28,22,0.42)] p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit product' : 'Add product'}
        className="max-h-[90vh] w-full max-w-[620px] animate-modal-in overflow-y-auto rounded-[22px] bg-white shadow-[0_40px_90px_rgba(33,28,22,0.32)] dark:bg-maison-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 flex items-center justify-between rounded-t-[22px] border-b border-maison-line bg-white px-[30px] py-[26px] dark:bg-maison-panel">
          <div>
            <div className="text-xs font-semibold tracking-[1.2px] text-maison-clay">
              {isEdit ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
            </div>
            <div className="mt-0.5 font-serif text-[28px] leading-none text-maison-ink">
              {isEdit ? 'Edit product' : 'Add product'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F4ECE0] text-maison-muted transition-colors hover:bg-[#E9DECF] dark:bg-maison-line dark:hover:bg-maison-stone"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="px-[30px] py-7">
            {/* image */}
            <div className="mb-[22px] flex gap-[18px]">
              <ProductTone
                name={nameValue || 'M'}
                categoryName={categoryName}
                imageUrl={previewImage}
                initialClassName="text-[44px]"
                className="h-[120px] w-[120px] flex-shrink-0 rounded-[14px] border border-maison-line"
              />
              <div className="flex-1">
                <label className={LABEL} htmlFor="pm-image">
                  Product image
                </label>
                <input
                  id="pm-image"
                  {...register('imageUrl')}
                  placeholder="Paste an image URL…"
                  className={`${FIELD} mb-2.5 border-maison-line-strong px-[14px] py-[11px] text-[13.5px]`}
                />
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-[7px] rounded-[9px] border border-maison-stone bg-white px-4 py-[9px] text-[13px] font-semibold text-maison-ink transition-colors hover:border-maison-clay hover:text-maison-clay dark:bg-maison-panel"
                  >
                    <Upload className="h-[15px] w-[15px]" />
                    Upload file
                  </button>
                  <span className="text-xs text-maison-faint">URL or upload — either works</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={onPickFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* name */}
            <div className="mb-4">
              <label className={LABEL} htmlFor="pm-name">
                Product name
              </label>
              <input
                id="pm-name"
                {...register('name')}
                placeholder="e.g. Aria Leather Tote"
                className={`${FIELD} ${errors.name ? 'border-maison-clay' : 'border-maison-line-strong'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-[#B23B3B]">{errors.name.message}</p>}
            </div>

            {/* category + price */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="pm-category">
                  Category
                </label>
                <select
                  id="pm-category"
                  {...register('categoryId')}
                  className={`${FIELD} cursor-pointer appearance-none ${errors.categoryId ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-xs text-[#B23B3B]">{errors.categoryId.message}</p>
                )}
              </div>
              <div>
                <label className={LABEL} htmlFor="pm-price">
                  Price (USD)
                </label>
                <input
                  id="pm-price"
                  {...register('price')}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${FIELD} ${errors.price ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-[#B23B3B]">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* stock + compare-at */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="pm-stock">
                  Stock quantity
                </label>
                <input
                  id="pm-stock"
                  {...register('stockQuantity')}
                  inputMode="numeric"
                  placeholder="0"
                  className={`${FIELD} ${errors.stockQuantity ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.stockQuantity && (
                  <p className="mt-1 text-xs text-[#B23B3B]">{errors.stockQuantity.message}</p>
                )}
              </div>
              <div>
                <label className={LABEL} htmlFor="pm-compare">
                  Compare-at price <span className="font-normal text-maison-faint">(optional)</span>
                </label>
                <input
                  id="pm-compare"
                  {...register('compareAtPrice')}
                  inputMode="decimal"
                  placeholder="Was-price for sale"
                  className={`${FIELD} ${errors.compareAtPrice ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.compareAtPrice && (
                  <p className="mt-1 text-xs text-[#B23B3B]">{errors.compareAtPrice.message}</p>
                )}
              </div>
            </div>

            {/* description */}
            <div>
              <label className={LABEL} htmlFor="pm-desc">
                Description
              </label>
              <textarea
                id="pm-desc"
                {...register('description')}
                rows={3}
                placeholder="Short product description…"
                className={`${FIELD} resize-y leading-relaxed ${errors.description ? 'border-maison-clay' : 'border-maison-line-strong'}`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[#B23B3B]">{errors.description.message}</p>
              )}
            </div>

            {isEdit && (
              <label className="mt-4 flex items-center gap-2.5 text-[13.5px] font-medium text-maison-ink">
                <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border" />
                Active — visible in the storefront
              </label>
            )}
          </div>

          {/* footer */}
          <div className="flex justify-end gap-3 border-t border-maison-line px-[30px] pb-[26px] pt-[18px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-maison-stone bg-white px-6 py-[13px] text-[14.5px] font-semibold text-maison-ink transition-colors hover:bg-[#F4ECE0] dark:bg-maison-panel dark:hover:bg-maison-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-maison-clay px-7 py-[13px] text-[14.5px] font-semibold text-white shadow-[0_10px_24px_rgba(199,91,57,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
