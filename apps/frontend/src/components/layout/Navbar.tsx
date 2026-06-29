import Link from 'next/link';
import { ShoppingBag, ShoppingCart, User } from 'lucide-react';

export function Navbar() {
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

        <nav className="flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Shop
          </Link>
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
        </nav>
      </div>
    </header>
  );
}
