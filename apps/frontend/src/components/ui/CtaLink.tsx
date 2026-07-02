import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type CtaLinkProps = ComponentProps<typeof Link>;

/** Primary storefront call-to-action, styled as the Maison clay pill. */
export function CtaLink({ className, ...props }: CtaLinkProps) {
  return (
    <Link
      className={cn(
        'inline-block rounded-full bg-maison-clay px-7 py-3.5 font-semibold text-white',
        className,
      )}
      {...props}
    />
  );
}
