'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, LogOut, type LucideIcon } from 'lucide-react';
import { MaisonLogo } from '@/components/layout/MaisonLogo';
import { useAuthStore } from '@/store/authStore';
import { listAdminOrders } from '@/lib/adminOrders';
import { OrderStatus } from '@ecommerce/shared-types';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

const PAGE: Record<string, { crumb: string; title: string }> = {
  '/admin/dashboard': { crumb: 'OVERVIEW', title: 'Dashboard' },
  '/admin/products': { crumb: 'CATALOG', title: 'Products' },
  '/admin/orders': { crumb: 'FULFILMENT', title: 'Orders' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const [pendingCount, setPendingCount] = useState(0);
  const [today, setToday] = useState('');

  useEffect(() => {
    if (!user) fetchMe();
  }, [user, fetchMe]);

  // Date is computed after mount to avoid a server/client hydration mismatch.
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }),
    );
  }, []);

  // Live count of orders awaiting action, shown as a sidebar badge.
  useEffect(() => {
    listAdminOrders({ status: OrderStatus.PENDING, limit: 1 })
      .then((res) => setPendingCount(res.meta.total))
      .catch(() => setPendingCount(0));
  }, [pathname]);

  const page = PAGE[pathname] ?? { crumb: 'ADMIN', title: 'ShopHive' };
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const initial = (user?.firstName ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="maison flex min-h-screen font-sans text-maison-ink">
      {/* sidebar — a permanently dark band, so it is pinned with dark:bg-maison-panel
          to stop `maison-ink` inverting to a light surface under `.dark`. */}
      <aside className="sticky top-0 flex h-screen w-[248px] flex-shrink-0 flex-col bg-maison-ink px-[18px] py-[26px] text-[#CFC6B8] dark:bg-maison-panel">
        <div className="px-3 pb-[26px] pt-1.5">
          <MaisonLogo tone="cream" className="text-[28px]" />
        </div>
        <div className="px-3 pb-2.5 text-[11px] font-bold tracking-[1.4px] text-[#7A7062]">MANAGE</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            const badge = label === 'Orders' && pendingCount > 0 ? pendingCount : null;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-[11px] px-3 py-[11px] text-sm transition-colors',
                  active
                    ? 'bg-maison-clay font-semibold text-maison-cream shadow-[0_8px_20px_rgba(199,91,57,0.3)] dark:text-maison-ink'
                    : 'font-medium text-[#B6AC99] hover:bg-[#342D24] hover:text-maison-cream dark:hover:bg-maison-line dark:hover:text-maison-ink',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-maison-clay px-1.5 text-[11px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#342D24] pt-4 dark:border-maison-line">
          <div className="flex items-center gap-[11px] px-3 py-2">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-maison-clay text-[15px] font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-maison-cream dark:text-maison-ink">{fullName}</div>
              <div className="truncate text-[11.5px] text-[#8A8073]">{user?.email ?? ''}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-[11px] text-[13.5px] font-medium text-[#B6AC99] transition-colors hover:bg-[#342D24] hover:text-maison-cream dark:hover:bg-maison-line dark:hover:text-maison-ink"
          >
            <LogOut className="h-[17px] w-[17px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[60] flex h-[74px] items-center justify-between gap-6 border-b border-maison-line bg-[rgba(250,246,240,0.82)] px-10 backdrop-blur-[14px] dark:bg-[rgba(24,20,16,0.82)]">
          <div>
            <div className="text-xs font-semibold tracking-[1.4px] text-maison-clay">{page.crumb}</div>
            <div className="mt-0.5 font-serif text-[25px] leading-none text-maison-ink">{page.title}</div>
          </div>
          <div className="text-[13px] text-maison-subtle">{today}</div>
        </header>

        <main className="animate-page-in px-10 pb-16 pt-[34px]">{children}</main>
      </div>
    </div>
  );
}
