import { categoryTone, productInitial } from '@/lib/storefront';
import { cn } from '@/lib/utils';

interface ProductToneProps {
  name: string;
  categoryName?: string | null;
  imageUrl?: string | null;
  /** Tailwind classes for the serif initial overlay (sizing). */
  initialClassName?: string;
  /** Apply the subtle bottom darkening used on grid cards. */
  shade?: boolean;
  className?: string;
}

/**
 * The signature Maison product backdrop: a category-keyed gradient with a soft
 * top highlight and the product's serif initial, with the real image (when
 * present) layered on top. Reused by cards, the detail gallery, cart lines and
 * order rows so every product reads the same.
 */
export function ProductTone({
  name,
  categoryName,
  imageUrl,
  initialClassName = 'text-[108px]',
  shade = false,
  className,
}: ProductToneProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: categoryTone(categoryName) }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(125%_85%_at_30%_18%,rgba(255,255,255,.55),transparent_60%)]" />
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-serif text-[rgba(33,28,22,.1)]',
          initialClassName,
        )}
        aria-hidden="true"
      >
        {productInitial(name)}
      </span>
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      )}
      {shade && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(33,28,22,.12))]" />
      )}
    </div>
  );
}
