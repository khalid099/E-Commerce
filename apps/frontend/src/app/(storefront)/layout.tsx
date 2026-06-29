import { Navbar } from '@/components/layout/Navbar';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2025 ShopHive. All rights reserved.
      </footer>
    </div>
  );
}
