import Link from 'next/link';
import { categoryTone } from '@/lib/storefront';
import type { Category } from '@ecommerce/shared-types';

export function CollectionCard({ category }: { category: Category }) {
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
