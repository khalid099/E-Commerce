'use client';

import Link from 'next/link';
import { ShoppingBag, ShoppingCart, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { UserRole } from '@ecommerce/shared-types';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/products"
          className="flex items-center gap-2 text-xl font-bold text-primary transition-opacity hover:opacity-80"
        >
          <ShoppingBag className="h-6 w-6" />
          ShopHive
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/products"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Shop
          </Link>

          {user ? (
            <>
              <Link
                href="/cart"
                className="relative text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {user.role === UserRole.ADMIN && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}

              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium text-foreground/70 sm:block">
                  {user.firstName}
                </span>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/cart"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
