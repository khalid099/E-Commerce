'use client';

import Link from 'next/link';
import { Heart, User, ShoppingCart } from 'lucide-react';
import { MaisonLogo } from './MaisonLogo';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { UserRole } from '@ecommerce/shared-types';

const NAV_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'New Arrivals', href: '/products?sortBy=newest' },
  { label: 'Collections', href: '/products' },
  { label: 'Orders', href: '/orders' },
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const wishCount = useWishlistStore((s) => s.items.length);
  const cartBump = useUiStore((s) => s.cartBump);

  const accountHref = user?.role === UserRole.ADMIN ? '/admin/dashboard' : '/orders';

  return (
    <header className="sticky top-0 z-[120] border-b border-maison-line bg-maison-cream/80 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[74px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Maison home">
          <MaisonLogo />
        </Link>

        <nav className="hidden items-center gap-[34px] text-[14.5px] font-medium md:flex">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={`${link.label}-${i}`}
              href={link.href}
              className="text-maison-muted transition-colors hover:text-maison-clay"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {user ? (
            <Link
              href={accountHref}
              className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-[#F0E9DE]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maison-ink text-[13px] font-semibold text-maison-cream">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-[13.5px] font-medium text-maison-muted sm:block">
                {user.firstName}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-[#F0E9DE]"
            >
              <User className="h-[19px] w-[19px]" />
            </Link>
          )}

          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishCount} item${wishCount === 1 ? '' : 's'}`}
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-[#F0E9DE]"
          >
            <Heart className="h-[19px] w-[19px]" />
            {wishCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maison-clay px-1.5 text-[11px] font-bold text-white">
                {wishCount > 99 ? '99+' : wishCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-[#F0E9DE]"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                key={cartBump}
                className="animate-pop absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maison-clay px-1.5 text-[11px] font-bold text-white"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
