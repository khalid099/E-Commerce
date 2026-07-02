import type { LucideIcon } from 'lucide-react';
import { CtaLink } from './CtaLink';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Optional badge icon shown in a clay-tinted circle above the title. */
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Optional primary action rendered as a CtaLink. */
  action?: { href: string; label: string };
  /** Merged onto the card container (e.g. to tweak vertical padding). */
  className?: string;
}

/** Centred empty-state card used across storefront surfaces (cart, wishlist, orders). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-[22px] border border-maison-line bg-white px-5 py-24 text-center dark:bg-maison-panel',
        className,
      )}
    >
      {Icon && (
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4ECE0] text-maison-clay dark:bg-maison-cream">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <div className="mb-2 font-serif text-[30px]">{title}</div>
      <p className="mb-[22px] text-maison-subtle">{description}</p>
      {action && <CtaLink href={action.href}>{action.label}</CtaLink>}
    </div>
  );
}
