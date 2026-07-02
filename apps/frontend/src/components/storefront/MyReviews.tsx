'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MessageSquare } from 'lucide-react';
import { ProductTone } from '@/components/storefront/ProductTone';
import { Skeleton } from '@/components/ui/skeleton';
import { listMyReviews } from '@/lib/reviews';
import { cn } from '@/lib/utils';
import type { MyReview } from '@ecommerce/shared-types';

export function MyReviews() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    listMyReviews(1, 10)
      .then((res) => active && setReviews(res.data))
      .catch(() => active && setIsError(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-maison-clay" />
        <h2 className="font-serif text-[26px] leading-none">Your reviews</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[104px] rounded-[18px]" />
          <Skeleton className="h-[104px] rounded-[18px]" />
        </div>
      ) : isError ? (
        <div className="rounded-[18px] border border-maison-line bg-white px-6 py-10 text-center text-maison-subtle dark:bg-maison-panel">
          We couldn&apos;t load your reviews. Please try again later.
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-[18px] border border-maison-line bg-white px-6 py-12 text-center dark:bg-maison-panel">
          <p className="text-maison-subtle">
            You haven&apos;t written any reviews yet. Reviews you leave on delivered orders will
            appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: MyReview }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="rounded-[18px] border border-maison-line bg-white p-5 shadow-[0_1px_2px_rgba(120,90,60,.04)] dark:bg-maison-panel">
      <div className="flex gap-4">
        <Link
          href={`/products/${review.productSlug}`}
          className="flex-shrink-0"
          aria-label={`View ${review.productName}`}
        >
          <ProductTone
            name={review.productName}
            imageUrl={review.productImageUrl}
            initialClassName="text-[22px]"
            className="h-16 w-16 rounded-[12px] ring-1 ring-maison-line"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Link
              href={`/products/${review.productSlug}`}
              className="truncate text-[14.5px] font-semibold text-maison-ink transition-colors hover:text-maison-clay"
            >
              {review.productName}
            </Link>
            <span className="text-[11.5px] text-maison-subtle">{date}</span>
          </div>

          <div className="mt-1 flex items-center gap-1" aria-label={`Rated ${review.rating} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  'h-3.5 w-3.5',
                  n <= review.rating
                    ? 'fill-maison-clay text-maison-clay'
                    : 'fill-maison-line text-maison-line',
                )}
              />
            ))}
          </div>

          {review.title && (
            <p className="mt-2 text-[14px] font-semibold text-maison-ink">{review.title}</p>
          )}
          {review.comment && (
            <p className="mt-1 text-[13.5px] leading-relaxed text-maison-muted">{review.comment}</p>
          )}

          {review.reply && (
            <div className="mt-3 rounded-[12px] border border-maison-line bg-maison-panel/60 px-4 py-3 dark:bg-maison-cream">
              <div className="text-[11px] font-bold uppercase tracking-[.6px] text-maison-clay-dark">
                Store response
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-maison-muted">{review.reply}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
