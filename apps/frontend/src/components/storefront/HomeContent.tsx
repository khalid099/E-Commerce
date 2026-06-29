'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/productsApi';
import { ProductCard } from './ProductCard';
import { ProductTone } from './ProductTone';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryTone } from '@/lib/storefront';
import type { Category } from '@ecommerce/shared-types';

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
        <div className="grid grid-cols-1 gap-5 rounded-[18px] border border-maison-line bg-white px-8 py-5 sm:grid-cols-3">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-center justify-center gap-3.5">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#F4ECE0] text-maison-clay">
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
            className="rounded-full border border-maison-stone px-5 py-3 text-sm font-semibold transition-colors hover:border-maison-ink hover:bg-white"
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

function CollectionCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="group relative block h-[300px] overflow-hidden rounded-[22px] shadow-[0_10px_30px_rgba(120,90,60,.1)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_50px_rgba(120,90,60,.2)]"
      style={{ background: categoryTone(category.name) }}
    >
      {category.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url("${category.imageUrl}")` }}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_30%_15%,rgba(255,255,255,.5),transparent_60%)]" />
          <span className="absolute bottom-1.5 right-[18px] font-serif text-[170px] leading-none text-[rgba(33,28,22,.07)]">
            {category.name.charAt(0)}
          </span>
        </>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,28,22,.05)_30%,rgba(33,28,22,.6))]" />
      <div className="absolute inset-0 z-[2] flex flex-col justify-end p-7 text-white">
        <div className="text-xs font-bold tracking-[1.4px] text-white/85">COLLECTION</div>
        <div className="mt-1 font-serif text-[30px]">{category.name}</div>
        <div className="mt-3.5 inline-flex items-center gap-2 text-[13.5px] font-semibold">
          Explore <span className="text-base">&rarr;</span>
        </div>
      </div>
    </Link>
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

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="mx-auto max-w-[1280px] px-5 sm:px-8"
    >
      <div className="relative mt-7 flex min-h-[480px] items-center overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#F3ECE1_0%,#EADFCF_55%,#E7D3BE_100%)] lg:min-h-[520px]">
        <div
          className="absolute -left-[60px] -top-20 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(199,91,57,.16),transparent_68%)] transition-transform duration-300 ease-out"
          style={{ transform: `translate(${parallax.x * 28}px, ${parallax.y * 28}px)` }}
        />
        {/* Floating seeded product imagery — the design's hero motif. */}
        {images[0] && (
          <div
            className="animate-floaty absolute right-[6%] top-1/2 hidden h-[360px] w-[300px] -translate-y-1/2 overflow-hidden rounded-3xl bg-cover bg-center shadow-[0_40px_80px_rgba(120,90,60,.28)] md:block"
            style={{
              backgroundImage: `url("${images[0]}")`,
              transform: `translateY(-50%) translate(${parallax.x * 18}px, ${parallax.y * 18}px)`,
            }}
          />
        )}
        {images[1] && (
          <div
            className="absolute bottom-[8%] right-[26%] hidden h-[160px] w-[160px] overflow-hidden rounded-[20px] bg-cover bg-center shadow-[0_24px_50px_rgba(90,100,70,.26)] transition-transform duration-300 ease-out lg:block"
            style={{
              backgroundImage: `url("${images[1]}")`,
              transform: `translate(${parallax.x * -40}px, ${parallax.y * -40}px)`,
            }}
          />
        )}

        <div className="relative z-[2] max-w-[560px] p-10 sm:p-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(199,91,57,.25)] bg-white/60 px-3.5 py-[7px] text-[12.5px] font-semibold tracking-[.4px] text-maison-clay-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-maison-clay" />
            SUMMER EDIT · 2026
          </div>
          <h1 className="mb-4 font-serif text-[52px] leading-[.98] tracking-[-1px] sm:text-[74px]">
            Style that <span className="italic text-maison-clay">inspires</span> living.
          </h1>
          <p className="mb-8 max-w-[420px] text-[18px] leading-[1.55] text-maison-muted">
            A curated marketplace of objects worth keeping — apparel, home, and the small luxuries
            in between.
          </p>
          <div className="flex items-center gap-3.5">
            <Link
              href="/products"
              className="rounded-full bg-maison-clay px-8 py-4 text-[15.5px] font-semibold text-white shadow-[0_14px_30px_rgba(199,91,57,.34)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(199,91,57,.42)]"
            >
              Shop the collection
            </Link>
            <Link
              href="/products?sortBy=newest"
              className="group flex items-center gap-2 px-2 py-4 text-[15.5px] font-semibold text-maison-ink"
            >
              New arrivals
              <span className="text-lg transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
