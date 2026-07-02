'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Heart, User, ShoppingCart, Menu, X, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import { MaisonLogo } from './MaisonLogo';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { useThemeStore } from '@/store/themeStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UserRole } from '@ecommerce/shared-types';

const BASE_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'New Arrivals', href: '/products?isNew=true' },
  { label: 'Collections', href: '/collections' },
];

const ANNOUNCEMENTS = [
  'Complimentary shipping on orders over $150',
  'Signature gift wrapping on every order',
  'Members enjoy early access to new arrivals',
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const wishCount = useWishlistStore((s) => s.items.length);
  const cartBump = useUiStore((s) => s.cartBump);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  // "Orders" is a protected customer route — only surface it once signed in,
  // otherwise a guest tapping it just bounces off the middleware to /login.
  const navLinks =
    user && user.role !== UserRole.ADMIN
      ? [...BASE_LINKS, { label: 'Orders', href: '/orders' }]
      : BASE_LINKS;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNewActive = searchParams.get('isNew') === 'true';

  // Subtle depth cue: the header stays flat while resting over the hero, then
  // lifts onto a hairline shadow once the page scrolls beneath it.
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // The theme is resolved from the DOM on the client; gate the sun/moon icon
  // on mount so the server-rendered markup and first client render agree.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParams]);

  // Shop and New Arrivals share the /products path — distinguish them by the
  // isNew query param so exactly one tab reads as active.
  const isActiveLink = (href: string): boolean => {
    const [path, query] = href.split('?');
    if (path === '/products') {
      if (pathname !== '/products') return false;
      return (query?.includes('isNew=true') ?? false) === isNewActive;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="sticky top-0 z-[120]">
      {/* Announcement rail — the first cue that this is a considered store.
          Pinned dark in both themes (dark:bg-maison-panel) so it doesn't
          invert to a light strip when the ink token flips. */}
      <div className="overflow-hidden bg-maison-ink text-maison-cream dark:bg-maison-panel dark:text-maison-muted">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-center gap-3 px-5 sm:px-8">
          {ANNOUNCEMENTS.map((message, i) => (
            <span
              key={message}
              className={cn(
                'items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-maison-cream/85 dark:text-maison-muted',
                i === 0 ? 'flex' : 'hidden lg:flex',
              )}
            >
              {i > 0 && (
                <span className="h-1 w-1 rounded-full bg-maison-clay/80" aria-hidden />
              )}
              {message}
            </span>
          ))}
        </div>
      </div>

      <header
        className={cn(
          'border-b bg-maison-cream/80 backdrop-blur-[14px] transition-[box-shadow,background-color,border-color] duration-300',
          scrolled
            ? 'border-maison-line bg-maison-cream/92 shadow-[0_10px_30px_-24px_rgba(33,28,22,0.55)]'
            : 'border-transparent',
        )}
      >
        <div className="relative mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          {/* Mobile menu toggle — the desktop nav collapses below md, so
              without this the primary navigation is unreachable on phones. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="-ml-2 flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-ink transition-colors hover:bg-maison-line md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" aria-label="KD Store home" className="md:mr-2">
            <MaisonLogo />
          </Link>

          {/* Segmented pill nav — optically centered, independent of the logo
              and action-cluster widths. The active item is a solid ink pill. */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-maison-line bg-maison-panel/60 p-1 shadow-[0_1px_2px_rgba(33,28,22,0.04)] backdrop-blur-sm md:flex">
            {navLinks.map((link, i) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={`${link.label}-${i}`}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-[18px] py-[9px] text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-all duration-300',
                    active
                      ? 'bg-maison-ink text-maison-cream shadow-[0_6px_16px_-8px_rgba(33,28,22,0.7)]'
                      : 'text-maison-muted hover:bg-maison-line hover:text-maison-ink',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {/* Light / dark theme toggle. The icon is gated on `mounted` so the
                SSR markup matches the first client render (no hydration warning). */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-maison-line hover:text-maison-ink"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* Real-time notification bell — only meaningful once signed in. */}
            {user && <NotificationBell />}

            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishCount} item${wishCount === 1 ? '' : 's'}`}
              className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-maison-line hover:text-maison-ink"
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
              className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-maison-line hover:text-maison-ink"
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

            {/* Hairline separating utilities from the account. */}
            <span className="mx-2 hidden h-5 w-px bg-maison-line md:block" aria-hidden />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-maison-line focus:outline-none focus-visible:ring-2 focus-visible:ring-maison-clay/40 sm:pr-2.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maison-ink text-[13px] font-semibold text-maison-cream ring-1 ring-inset ring-white/10">
                      {user.firstName.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden text-[13px] font-medium text-maison-muted sm:block">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      className="hidden h-4 w-4 text-maison-faint transition-transform duration-300 group-data-[state=open]:rotate-180 sm:block"
                      aria-hidden
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <span className="block truncate text-[13.5px] font-semibold normal-case tracking-normal text-maison-ink">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] normal-case tracking-normal text-maison-subtle">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void logout();
                    }}
                    className="text-maison-clay-dark focus:bg-maison-clay/10 focus:text-maison-clay-dark data-[highlighted]:bg-maison-clay/10 data-[highlighted]:text-maison-clay-dark"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-maison-muted transition-colors hover:bg-maison-line hover:text-maison-ink"
              >
                <User className="h-[19px] w-[19px]" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile navigation sheet. */}
        {menuOpen && (
          <nav className="animate-fade-in border-t border-maison-line bg-maison-cream/95 backdrop-blur-[14px] md:hidden">
            <div className="mx-auto flex max-w-[1280px] flex-col px-5 py-2 sm:px-8">
              {navLinks.map((link, i) => {
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={`m-${link.label}-${i}`}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'border-b border-maison-line/70 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors last:border-b-0',
                      active ? 'text-maison-clay' : 'text-maison-muted hover:text-maison-ink',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
