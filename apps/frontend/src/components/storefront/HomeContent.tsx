'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/productsApi';
import { ProductCard } from './ProductCard';
import { ProductTone } from './ProductTone';
import { CollectionCard } from './CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';

const PERKS = [
  { icon: Truck, title: 'Free shipping', sub: 'On orders over $150' },
  { icon: RotateCcw, title: '30-day returns', sub: 'No questions asked' },
  { icon: ShieldCheck, title: 'Secure checkout', sub: 'Encrypted & protected' },
];

export function HomeContent() {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: newArrivals, isLoading } = useGetProductsQuery({ sortBy: 'newest', limit: '8' });

  const featured = categories.slice(0, 3);
  const heroImages = (newArrivals?.data ?? [])
    .map((p) => p.imageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 2);

  return (
    <div className="animate-page-in">
      <Hero images={heroImages} />

      {/* Perks bar */}
      <section className="mx-auto max-w-[1280px] px-5 pt-7 sm:px-8">
        <div className="grid grid-cols-1 gap-5 rounded-[18px] border border-maison-line bg-white px-8 py-5 dark:bg-maison-panel sm:grid-cols-3">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-center justify-center gap-3.5">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#F4ECE0] text-maison-clay dark:bg-maison-cream">
                <perk.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold">{perk.title}</div>
                <div className="text-[12.5px] text-maison-subtle">{perk.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured collections */}
      {featured.length > 0 && (
        <>
          <section className="mx-auto max-w-[1280px] px-5 pb-6 pt-[72px] text-center sm:px-8">
            <div className="text-[12.5px] font-semibold tracking-[2px] text-maison-clay">
              CURATED FOR YOU
            </div>
            <h2 className="mt-2.5 font-serif text-[46px]">Featured Collections</h2>
          </section>
          <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
            {featured.map((cat) => (
              <CollectionCard key={cat.id} category={cat} />
            ))}
          </section>
        </>
      )}

      {/* New arrivals */}
      <section className="mx-auto max-w-[1280px] px-5 pb-8 pt-20 sm:px-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="text-[12.5px] font-semibold tracking-[2px] text-maison-clay">
              JUST LANDED
            </div>
            <h2 className="mt-2 font-serif text-[40px]">New Arrivals</h2>
          </div>
          <Link
            href="/products"
            className="rounded-full border border-maison-stone px-5 py-3 text-sm font-semibold transition-colors hover:border-maison-ink hover:bg-white dark:hover:bg-maison-panel"
          >
            View all products
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full rounded-[18px]" />
                  <Skeleton className="mt-3.5 h-3 w-1/3" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              ))
            : newArrivals?.data.map((product) => (
                <ProductCard key={product.id} product={product} isNew />
              ))}
        </div>
      </section>
    </div>
  );
}

function Hero({ images }: { images: string[] }) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x, y });
  };

  const shift = (mult: number) => ({
    transform: `translate(${parallax.x * mult}px, ${parallax.y * mult}px)`,
  });

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="mx-auto max-w-[1280px] px-5 sm:px-8"
    >
      <div className="relative mt-7 overflow-hidden rounded-[32px] bg-[linear-gradient(118deg,#F6EFE5_0%,#ECE0D0_50%,#E6D1BB_100%)] ring-1 ring-black/[.04] dark:bg-[linear-gradient(118deg,#241D16_0%,#332920_50%,#40311F_100%)] dark:ring-white/[.05]">
        {/* Soft light + tonal blobs for depth */}
        <div
          className="pointer-events-none absolute -left-24 -top-28 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(199,91,57,.18),transparent_66%)] transition-transform duration-300 ease-out"
          style={shift(26)}
        />
        <div
          className="pointer-events-none absolute -bottom-36 right-[36%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(107,110,100,.14),transparent_68%)] transition-transform duration-300 ease-out"
          style={shift(-16)}
        />

        <div className="relative z-[2] grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Copy */}
          <div className="p-10 sm:p-14 lg:py-[86px] lg:pl-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(199,91,57,.25)] bg-white/60 px-3.5 py-[7px] text-[12.5px] font-semibold tracking-[.4px] text-maison-clay-dark backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-maison-clay" />
              SUMMER EDIT · 2026
            </div>
            <h1 className="mb-4 font-serif text-[52px] leading-[.98] tracking-[-1px] sm:text-[74px]">
              Style that <span className="italic text-maison-clay">inspires</span> living.
            </h1>
            <p className="mb-8 max-w-[420px] text-[18px] leading-[1.55] text-maison-muted">
              A curated marketplace of objects worth keeping — apparel, home, and the small luxuries
              in between.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/products"
                className="rounded-full bg-maison-clay px-8 py-4 text-[15.5px] font-semibold text-white shadow-[0_14px_30px_rgba(199,91,57,.34)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(199,91,57,.42)]"
              >
                Shop the collection
              </Link>
              <Link
                href="/products?isNew=true"
                className="group flex items-center gap-2 px-2 py-4 text-[15.5px] font-semibold text-maison-ink"
              >
                New arrivals
                <span className="text-lg transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>

            <div className="mt-9 flex items-center gap-4 text-[11.5px] font-semibold uppercase tracking-[1.3px] text-maison-clay-dark/75">
              <span>Curated in-house</span>
              <span className="h-3 w-px bg-maison-clay/25" />
              <span>Shipped worldwide</span>
            </div>
          </div>

          {/* Layered product collage */}
          <div className="relative hidden min-h-[540px] lg:block">
            <div
              className="absolute right-[32%] top-[15%] h-[128px] w-[128px] rounded-full border border-dashed border-maison-clay/25 transition-transform duration-300 ease-out"
              style={shift(-30)}
            />
            {images[0] && (
              <div
                className="absolute right-12 top-1/2 h-[406px] w-[318px] overflow-hidden rounded-[26px] bg-cover bg-center shadow-[0_46px_90px_rgba(120,90,60,.3)] ring-1 ring-black/[.06] transition-transform duration-300 ease-out"
                style={{
                  backgroundImage: `url("${images[0]}")`,
                  transform: `translateY(-50%) translate(${parallax.x * 16}px, ${parallax.y * 16}px)`,
                }}
              >
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(33,28,22,.28))]" />
                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[.6px] text-maison-ink backdrop-blur">
                  Editor&apos;s pick
                </div>
              </div>
            )}
            {images[1] && (
              <div
                className="animate-floaty absolute bottom-[9%] right-[42%] h-[176px] w-[176px] overflow-hidden rounded-[22px] bg-cover bg-center shadow-[0_30px_58px_rgba(90,100,70,.3)] ring-[6px] ring-maison-cream"
                style={{ backgroundImage: `url("${images[1]}")` }}
              >
                <div className="absolute left-3 top-3 rounded-full bg-maison-clay px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.5px] text-white">
                  New
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
