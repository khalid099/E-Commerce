'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Upload,
  Loader2,
  Tag,
  Boxes,
  ImageIcon,
  Eye,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@/components/admin/Panel';
import { StockBadge } from '@/components/admin/StockBadge';
import { ProductTone } from '@/components/storefront/ProductTone';
import { createProduct, updateProduct, uploadProductImage } from '@/lib/adminProducts';
import { money } from '@/lib/storefront';
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
const ERR = 'mt-1 text-xs text-[#B23B3B]';

/** The eyebrow + serif heading that opens each section panel. */
function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  hint,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FBEFE9] text-maison-clay">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <div className="text-[11px] font-bold tracking-[1.2px] text-maison-clay">{eyebrow}</div>
        <div className="text-[17px] font-bold text-maison-ink">{title}</div>
        {hint && <p className="mt-0.5 text-[12.5px] text-maison-subtle">{hint}</p>}
      </div>
    </div>
  );
}

interface ProductFormProps {
  /** The product being edited; omit to create. */
  product?: Product;
  categories: Category[];
}

/**
 * Full-page create/edit product form: a sectioned main column with a sticky
 * live-preview sidebar and a pinned save bar. Shared by the /new and /[id]/edit
 * routes so both surfaces stay identical.
 */
export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
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
  const priceValue = Number(watch('price')) || 0;
  const compareValue = Number(watch('compareAtPrice')) || 0;
  const stockValue = Number(watch('stockQuantity')) || 0;
  const onSale = compareValue > priceValue && priceValue > 0;
  const previewImage = (filePreview ?? (imageUrlValue || product?.imageUrl)) || null;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    if (picked) setValue('imageUrl', ''); // a file wins over a URL
  };

  const clearImage = () => {
    setFile(null);
    setValue('imageUrl', '');
    if (fileRef.current) fileRef.current.value = '';
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
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save product'));
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {/* header */}
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-maison-subtle transition-colors hover:text-maison-clay"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
        <h1 className="mt-2.5 font-serif text-[34px] leading-none text-maison-ink">
          {isEdit ? 'Edit product' : 'New product'}
        </h1>
        <p className="mt-2 text-[14px] text-maison-subtle">
          {isEdit
            ? 'Update the details, pricing and availability of this product.'
            : 'Add a product to the catalogue. It goes live in the storefront once saved.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="space-y-6">
          {/* details */}
          <Panel className="p-[26px]">
            <SectionHead
              icon={Tag}
              eyebrow="DETAILS"
              title="Product details"
              hint="The name and description shown to customers."
            />
            <div className="space-y-4">
              <div>
                <label className={LABEL} htmlFor="pf-name">
                  Product name
                </label>
                <input
                  id="pf-name"
                  {...register('name')}
                  placeholder="e.g. Aria Leather Tote"
                  className={`${FIELD} ${errors.name ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.name && <p className={ERR}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={LABEL} htmlFor="pf-category">
                  Category
                </label>
                <select
                  id="pf-category"
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
                {errors.categoryId && <p className={ERR}>{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className={LABEL} htmlFor="pf-desc">
                  Description
                </label>
                <textarea
                  id="pf-desc"
                  {...register('description')}
                  rows={4}
                  placeholder="Short product description…"
                  className={`${FIELD} resize-y leading-relaxed ${errors.description ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.description && <p className={ERR}>{errors.description.message}</p>}
              </div>
            </div>
          </Panel>

          {/* pricing & inventory */}
          <Panel className="p-[26px]">
            <SectionHead
              icon={Boxes}
              eyebrow="COMMERCE"
              title="Pricing & inventory"
              hint="Set the selling price, an optional was-price, and stock on hand."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="pf-price">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-[14.5px] font-semibold text-maison-faint">
                    $
                  </span>
                  <input
                    id="pf-price"
                    {...register('price')}
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`${FIELD} pl-8 ${errors.price ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                  />
                </div>
                {errors.price && <p className={ERR}>{errors.price.message}</p>}
              </div>
              <div>
                <label className={LABEL} htmlFor="pf-compare">
                  Compare-at price <span className="font-normal text-maison-faint">(optional)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-[14.5px] font-semibold text-maison-faint">
                    $
                  </span>
                  <input
                    id="pf-compare"
                    {...register('compareAtPrice')}
                    inputMode="decimal"
                    placeholder="Was-price for sale"
                    className={`${FIELD} pl-8 ${errors.compareAtPrice ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                  />
                </div>
                {errors.compareAtPrice && <p className={ERR}>{errors.compareAtPrice.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="pf-stock">
                  Stock quantity
                </label>
                <input
                  id="pf-stock"
                  {...register('stockQuantity')}
                  inputMode="numeric"
                  placeholder="0"
                  className={`${FIELD} ${errors.stockQuantity ? 'border-maison-clay' : 'border-maison-line-strong'}`}
                />
                {errors.stockQuantity && <p className={ERR}>{errors.stockQuantity.message}</p>}
              </div>
            </div>
          </Panel>
        </div>

        {/* sidebar — sticky preview + media + visibility */}
        <aside className="space-y-6 lg:sticky lg:top-[90px] lg:self-start">
          {/* live preview */}
          <Panel className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-maison-line px-5 py-3.5 text-[11.5px] font-bold tracking-[1px] text-maison-subtle">
              <Eye className="h-[15px] w-[15px]" />
              LIVE PREVIEW
            </div>
            <div className="p-5">
              <ProductTone
                name={nameValue || 'M'}
                categoryName={categoryName}
                imageUrl={previewImage}
                initialClassName="text-[56px]"
                shade
                className="mb-4 aspect-square w-full rounded-[14px] border border-maison-line"
              />
              <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-maison-faint">
                {categoryName ?? 'Uncategorised'}
              </div>
              <div className="mt-1 truncate font-serif text-[20px] text-maison-ink">
                {nameValue || 'Product name'}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[18px] font-bold text-maison-ink tabular-nums">
                  {money(priceValue)}
                </span>
                {onSale && (
                  <>
                    <span className="text-[13px] text-maison-faint line-through tabular-nums">
                      {money(compareValue)}
                    </span>
                    <span className="rounded-full bg-[#F6E1E1] px-[7px] py-[2px] text-[10px] font-bold tracking-[0.4px] text-[#B23B3B]">
                      SALE
                    </span>
                  </>
                )}
              </div>
              <div className="mt-3">
                <StockBadge quantity={stockValue} />
              </div>
            </div>
          </Panel>

          {/* media */}
          <Panel className="p-[22px]">
            <SectionHead icon={ImageIcon} eyebrow="MEDIA" title="Product image" />
            <input
              id="pf-image"
              {...register('imageUrl')}
              placeholder="Paste an image URL…"
              aria-label="Image URL"
              className={`${FIELD} mb-2.5 border-maison-line-strong px-[14px] py-[11px] text-[13.5px]`}
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-[7px] rounded-[9px] border border-maison-stone bg-white px-4 py-[9px] text-[13px] font-semibold text-maison-ink transition-colors hover:border-maison-clay hover:text-maison-clay dark:bg-maison-panel"
              >
                <Upload className="h-[15px] w-[15px]" />
                Upload file
              </button>
              {previewImage && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="flex items-center gap-[6px] rounded-[9px] px-3 py-[9px] text-[13px] font-semibold text-maison-faint transition-colors hover:text-[#B23B3B]"
                >
                  <X className="h-[15px] w-[15px]" />
                  Remove
                </button>
              )}
            </div>
            {file && <p className="mt-2 truncate text-xs text-maison-subtle">{file.name}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onPickFile}
              className="hidden"
            />
          </Panel>

          {/* visibility — edit only */}
          {isEdit && (
            <Panel className="p-[22px]">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="mt-0.5 h-[18px] w-[18px] rounded border-maison-line-strong text-maison-clay focus:ring-maison-clay"
                />
                <span>
                  <span className="block text-[14px] font-semibold text-maison-ink">Active</span>
                  <span className="mt-0.5 block text-[12.5px] text-maison-subtle">
                    Visible and purchasable in the storefront.
                  </span>
                </span>
              </label>
            </Panel>
          )}
        </aside>
      </div>

      {/* sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-10 mt-6 flex items-center justify-end gap-3 border-t border-maison-line bg-[rgba(250,246,240,0.86)] px-10 py-4 backdrop-blur-[14px] dark:bg-[rgba(24,20,16,0.86)]">
        <Link
          href="/admin/products"
          className="rounded-full border border-maison-stone bg-white px-6 py-[13px] text-[14.5px] font-semibold text-maison-ink transition-colors hover:bg-[#F4ECE0] dark:bg-maison-panel dark:hover:bg-maison-line"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-maison-clay px-8 py-[13px] text-[14.5px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,0.34)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
