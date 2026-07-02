'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Calendar,
  ShieldCheck,
  Package,
  Heart,
  ChevronRight,
  LogOut,
  MapPin,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CtaLink } from '@/components/ui/CtaLink';
import { ProfileSettings } from '@/components/storefront/ProfileSettings';
import { MyReviews } from '@/components/storefront/MyReviews';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/lib/storefront';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { UserRole } from '@ecommerce/shared-types';
import type { Order, PaginatedResponse, ApiResponse, ShippingAddress } from '@ecommerce/shared-types';

interface OrderStats {
  count: number;
  totalSpent: number;
  lastOrderDate: string | null;
  latestAddress: ShippingAddress | null;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user?.role === UserRole.ADMIN;

  const [stats, setStats] = useState<OrderStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(!isAdmin);

  // The persisted store gives an instant name for the header; refresh against
  // /auth/me so the details reflect the server, not a stale cached profile.
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  // Shopping stats + the default (most recent) shipping address are both derived
  // from the customer's own order history in a single fetch. Admins have no
  // customer orders, so skip it for them.
  useEffect(() => {
    if (isAdmin) return;
    api
      .get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params: { page: 1, limit: 50 } })
      .then((res) => {
        const orders = res.data.data.data;
        const sorted = [...orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setStats({
          count: res.data.data.meta.total,
          totalSpent: orders.reduce((sum, o) => sum + Number(o.total), 0),
          lastOrderDate: sorted[0]?.createdAt ?? null,
          latestAddress: sorted[0]?.shippingAddress ?? null,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [isAdmin]);

  if (!user) {
    return isLoading ? (
      <ProfileSkeleton />
    ) : (
      <main className="mx-auto max-w-[720px] animate-page-in px-5 pb-16 pt-11 text-center sm:px-8">
        <h1 className="font-serif text-[38px]">Not signed in</h1>
        <p className="mt-2 text-maison-subtle">Sign in to view your profile.</p>
        <CtaLink href="/login" className="mt-6">
          Sign in
        </CtaLink>
      </main>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="mx-auto max-w-[820px] animate-page-in px-5 pb-16 pt-11 sm:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-[46px] leading-none">Your Profile</h1>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-full border border-maison-stone px-5 py-2.5 text-[13.5px] font-semibold text-maison-clay-dark transition-colors hover:border-maison-clay hover:bg-white hover:text-maison-clay dark:hover:bg-maison-panel"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {/* Identity card — avatar, name, and role at a glance. */}
      <section className="relative overflow-hidden rounded-[24px] border border-maison-line bg-white shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,#F4ECDF,transparent)] dark:bg-[linear-gradient(180deg,rgba(217,116,82,.1),transparent)]" />
        <div className="relative flex flex-col items-center gap-4 px-6 py-9 text-center sm:flex-row sm:text-left">
          <span className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full bg-maison-ink text-[26px] font-semibold text-maison-cream ring-4 ring-white dark:ring-maison-panel">
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-[30px] leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <div className="mt-1.5 flex items-center justify-center gap-2 sm:justify-start">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-[.6px]',
                  isAdmin
                    ? 'bg-maison-ink text-maison-cream'
                    : 'bg-maison-leaf-soft text-maison-leaf',
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isAdmin ? 'Administrator' : 'Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Account details */}
        <dl className="grid grid-cols-1 gap-px border-t border-maison-line bg-maison-line sm:grid-cols-2">
          <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          <Detail
            icon={<Calendar className="h-4 w-4" />}
            label="Member since"
            value={memberSince}
          />
        </dl>
      </section>

      {/* Shopping stats — customer activity at a glance. */}
      {!isAdmin && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-[104px] rounded-[18px]" />
              <Skeleton className="h-[104px] rounded-[18px]" />
              <Skeleton className="h-[104px] rounded-[18px]" />
            </>
          ) : (
            <>
              <Stat
                icon={<ShoppingBag className="h-5 w-5" />}
                label="Orders"
                value={String(stats?.count ?? 0)}
              />
              <Stat
                icon={<Wallet className="h-5 w-5" />}
                label="Total spent"
                value={money(stats?.totalSpent ?? 0)}
              />
              <Stat
                icon={<Calendar className="h-5 w-5" />}
                label="Last order"
                value={
                  stats?.lastOrderDate
                    ? new Date(stats.lastOrderDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'
                }
              />
            </>
          )}
        </div>
      )}

      {/* Default shipping address — pulled from the most recent order. */}
      {!isAdmin && !statsLoading && stats?.latestAddress && (
        <section className="mt-6 rounded-[20px] border border-maison-line bg-white p-6 shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-maison-clay" />
            <h3 className="text-[13px] font-bold uppercase tracking-[.7px] text-maison-ink">
              Default shipping address
            </h3>
          </div>
          <address className="text-[14px] not-italic leading-relaxed text-maison-muted">
            <span className="font-semibold text-maison-ink">{stats.latestAddress.fullName}</span>
            <br />
            {stats.latestAddress.line1}
            {stats.latestAddress.line2 && (
              <>
                <br />
                {stats.latestAddress.line2}
              </>
            )}
            <br />
            {stats.latestAddress.city}, {stats.latestAddress.state} {stats.latestAddress.postalCode}
            <br />
            {stats.latestAddress.country}
          </address>
          <p className="mt-3 text-[12px] text-maison-subtle">
            From your most recent order — set at checkout.
          </p>
        </section>
      )}

      {/* Account settings — edit name and change password (all roles). */}
      <ProfileSettings user={user} />

      {/* Quick links to the surfaces tied to this account. */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isAdmin ? (
          <QuickLink
            href="/admin/dashboard"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Admin dashboard"
            sub="Manage products, orders and stats"
          />
        ) : (
          <>
            <QuickLink
              href="/orders"
              icon={<Package className="h-5 w-5" />}
              title="Your orders"
              sub="Track and review past purchases"
            />
            <QuickLink
              href="/wishlist"
              icon={<Heart className="h-5 w-5" />}
              title="Wishlist"
              sub="Pieces you've saved for later"
            />
          </>
        )}
      </div>

      {/* Reviews the customer has written across all products. */}
      {!isAdmin && <MyReviews />}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-maison-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maison-panel text-maison-clay ring-1 ring-maison-line dark:bg-maison-cream">
        {icon}
      </span>
      <div className="mt-3 font-serif text-[26px] leading-none text-maison-ink">{value}</div>
      <div className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[.7px] text-maison-subtle">
        {label}
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 bg-white px-6 py-5 dark:bg-maison-panel">
      <span className="mt-0.5 text-maison-clay">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[.8px] text-maison-subtle">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-[14.5px] font-medium text-maison-ink">{value}</dd>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[18px] border border-maison-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(120,90,60,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-maison-clay/40 hover:shadow-[0_18px_40px_rgba(120,90,60,.12)] dark:bg-maison-panel"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-maison-panel text-maison-clay ring-1 ring-maison-line dark:bg-maison-cream">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-maison-ink">{title}</div>
        <div className="mt-0.5 truncate text-[12.5px] text-maison-subtle">{sub}</div>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-maison-faint transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto max-w-[820px] animate-page-in px-5 pb-16 pt-11 sm:px-8">
      <Skeleton className="mb-8 h-12 w-64" />
      <div className="rounded-[24px] border border-maison-line bg-white p-9 dark:bg-maison-panel">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[76px] w-[76px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </main>
  );
}
