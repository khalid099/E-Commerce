import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@ecommerce/shared-types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const inStock = product.stockQuantity > 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <svg
                className="h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.category?.name}
          </p>
          <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <Badge variant={inStock ? 'success' : 'destructive'}>
              {inStock ? `${product.stockQuantity} in stock` : 'Sold out'}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
