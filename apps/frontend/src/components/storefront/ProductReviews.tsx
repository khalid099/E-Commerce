'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BadgeCheck, Pencil, Trash2 } from 'lucide-react';
import { StarRating, StarRatingInput } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/errors';
import {
  listProductReviews,
  getProductReviewSummary,
  getMyProductReview,
  createProductReview,
  updateMyProductReview,
  deleteMyProductReview,
} from '@/lib/reviews';
import { cn } from '@/lib/utils';
import type { Review, ReviewSummary } from '@ecommerce/shared-types';

const PAGE_SIZE = 5;

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().max(120, 'Keep the title under 120 characters').optional(),
  comment: z.string().max(2000, 'Keep the review under 2000 characters').optional(),
});
type ReviewValues = z.infer<typeof reviewSchema>;

interface ProductReviewsProps {
  productId: string;
  /** Called after a review is created/edited/removed so the parent can refresh
   *  the product's cached rating (shown at the top of the page). */
  onAggregateChange?: () => void;
}

export function ProductReviews({ productId, onAggregateChange }: ProductReviewsProps) {
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);

  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number } | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadFirstPage = useCallback(async () => {
    const [nextSummary, list] = await Promise.all([
      getProductReviewSummary(productId),
      listProductReviews(productId, 1, PAGE_SIZE),
    ]);
    setSummary(nextSummary);
    setReviews(list.data);
    setMeta({ page: list.meta.page, totalPages: list.meta.totalPages });
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    loadFirstPage()
      .catch(() => setSummary({ average: 0, count: 0, distribution: {} }))
      .finally(() => setLoading(false));
  }, [loadFirstPage]);

  useEffect(() => {
    if (!user) {
      setMyReview(null);
      return;
    }
    getMyProductReview(productId)
      .then(setMyReview)
      .catch(() => setMyReview(null));
  }, [user, productId]);

  const loadMore = async () => {
    if (!meta || meta.page >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const next = await listProductReviews(productId, meta.page + 1, PAGE_SIZE);
      setReviews((prev) => [...prev, ...next.data]);
      setMeta({ page: next.meta.page, totalPages: next.meta.totalPages });
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not load more reviews'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (values: ReviewValues) => {
    const payload = {
      rating: values.rating,
      title: values.title?.trim() || undefined,
      comment: values.comment?.trim() || undefined,
    };
    try {
      if (myReview) {
        const updated = await updateMyProductReview(productId, payload);
        setMyReview(updated);
        showToast('Your review was updated');
      } else {
        const created = await createProductReview(productId, payload);
        setMyReview(created);
        showToast('Thanks for your review');
      }
      setEditing(false);
      await loadFirstPage();
      onAggregateChange?.();
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save your review'));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyProductReview(productId);
      setMyReview(null);
      setEditing(false);
      showToast('Your review was removed');
      await loadFirstPage();
      onAggregateChange?.();
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not remove your review'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <ReviewsSkeleton />;

  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const showForm = user && (!myReview || editing);

  return (
    <section className="mt-[72px] border-t border-maison-line pt-12">
      <h2 className="mb-7 font-serif text-[32px]">Customer Reviews</h2>

      {count === 0 ? (
        <EmptyState canWrite={!!user} />
      ) : (
        <SummaryPanel average={average} count={count} distribution={summary!.distribution} />
      )}

      {/* Write / manage your review */}
      <div className="mt-8">
        {!user ? (
          <div className="rounded-2xl border border-maison-line bg-white px-6 py-6 text-center dark:bg-maison-panel">
            <p className="mb-4 text-[15px] text-maison-muted">Share your thoughts on this piece.</p>
            <Link
              href="/login"
              className="inline-block rounded-full bg-maison-ink px-6 py-3 text-[14px] font-semibold text-maison-cream transition-colors hover:bg-maison-ink/90"
            >
              Sign in to write a review
            </Link>
          </div>
        ) : myReview && !editing ? (
          <YourReviewCard
            review={myReview}
            onEdit={() => setEditing(true)}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ) : showForm ? (
          <ReviewForm
            key={editing ? 'edit' : 'new'}
            initial={editing ? myReview : null}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(false) : undefined}
          />
        ) : null}
      </div>

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="mt-10 flex flex-col divide-y divide-maison-line">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} isMine={review.id === myReview?.id} />
          ))}
        </div>
      )}

      {meta && meta.page < meta.totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-maison-line-strong px-7 py-3 text-[14px] font-semibold text-maison-ink transition-colors hover:border-maison-ink disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more reviews'}
          </button>
        </div>
      )}
    </section>
  );
}

function SummaryPanel({
  average,
  count,
  distribution,
}: {
  average: number;
  count: number;
  distribution: Record<number, number>;
}) {
  return (
    <div className="grid gap-8 rounded-2xl border border-maison-line bg-white px-6 py-7 dark:bg-maison-panel sm:grid-cols-[auto_1fr] sm:gap-12 sm:px-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="font-serif text-[56px] leading-none">{average.toFixed(1)}</div>
        <StarRating value={average} size={18} className="mt-2.5" />
        <div className="mt-2 text-[13px] text-maison-subtle">
          {count} review{count === 1 ? '' : 's'}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution?.[star] ?? 0;
          const pct = count > 0 ? (n / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3 text-[13px]">
              <span className="w-10 shrink-0 text-maison-subtle">{star} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-maison-line">
                <div
                  className="h-full rounded-full bg-maison-clay transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right tabular-nums text-maison-subtle">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Review | null;
  onSubmit: (values: ReviewValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initial?.rating ?? 0,
      title: initial?.title ?? '',
      comment: initial?.comment ?? '',
    },
  });
  const rating = watch('rating');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-maison-line bg-white px-6 py-6 dark:bg-maison-panel"
    >
      <div className="mb-5 font-serif text-[22px]">
        {initial ? 'Edit your review' : 'Write a review'}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted">
          Your rating
        </label>
        <StarRatingInput
          value={rating}
          onChange={(v) => setValue('rating', v, { shouldValidate: true })}
          disabled={isSubmitting}
        />
        {errors.rating && (
          <p className="mt-1.5 text-[13px] text-maison-clay" role="alert">
            {errors.rating.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="review-title"
          className="mb-2 block text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted"
        >
          Title <span className="font-normal normal-case text-maison-faint">(optional)</span>
        </label>
        <input
          id="review-title"
          {...register('title')}
          aria-invalid={!!errors.title}
          placeholder="Sum up your experience"
          className="w-full rounded-[10px] border border-maison-line-strong bg-white px-3.5 py-2.5 text-[14.5px] outline-none focus:border-maison-ink dark:bg-maison-cream"
        />
        {errors.title && (
          <p className="mt-1.5 text-[13px] text-maison-clay" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label
          htmlFor="review-comment"
          className="mb-2 block text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted"
        >
          Review <span className="font-normal normal-case text-maison-faint">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          {...register('comment')}
          aria-invalid={!!errors.comment}
          rows={4}
          placeholder="What did you like or dislike? How is the fit and quality?"
          className="w-full resize-none rounded-[10px] border border-maison-line-strong bg-white px-3.5 py-2.5 text-[14.5px] leading-relaxed outline-none focus:border-maison-ink dark:bg-maison-cream"
        />
        {errors.comment && (
          <p className="mt-1.5 text-[13px] text-maison-clay" role="alert">
            {errors.comment.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-maison-clay px-7 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(199,91,57,.28)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting…' : initial ? 'Save changes' : 'Submit review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full border border-maison-line-strong px-6 py-3 text-[14px] font-semibold text-maison-ink transition-colors hover:border-maison-ink disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function YourReviewCard({
  review,
  onEdit,
  onDelete,
  deleting,
}: {
  review: Review;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-maison-clay/30 bg-[rgba(199,91,57,.05)] px-6 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-clay-dark">
            Your review
          </span>
          <StarRating value={review.rating} size={15} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-maison-line-strong px-3.5 py-1.5 text-[12.5px] font-semibold text-maison-ink transition-colors hover:border-maison-ink"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-full border border-maison-line-strong px-3.5 py-1.5 text-[12.5px] font-semibold text-maison-clay-dark transition-colors hover:border-maison-clay-dark disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> {deleting ? 'Removing…' : 'Delete'}
          </button>
        </div>
      </div>
      {review.title && <div className="mb-1 text-[15px] font-semibold">{review.title}</div>}
      {review.comment && (
        <p className="text-[14.5px] leading-relaxed text-maison-muted">{review.comment}</p>
      )}
    </div>
  );
}

function ReviewItem({ review, isMine }: { review: Review; isMine: boolean }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <article className="flex gap-4 py-6 first:pt-0">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-maison-line text-[16px] font-serif font-semibold text-maison-clay-dark">
        {review.authorName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[14.5px] font-semibold">{review.authorName}</span>
          {isMine && (
            <span className="rounded-full bg-maison-clay/10 px-2 py-0.5 text-[11px] font-semibold text-maison-clay">
              You
            </span>
          )}
          {review.verifiedPurchase && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-maison-leaf">
              <BadgeCheck className="h-4 w-4" /> Verified purchase
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <StarRating value={review.rating} size={14} />
          <span className="text-[12.5px] text-maison-subtle">{date}</span>
        </div>
        {review.title && <div className="mt-2.5 text-[15px] font-semibold">{review.title}</div>}
        {review.comment && (
          <p
            className={cn(
              'text-[14.5px] leading-relaxed text-maison-muted',
              review.title ? 'mt-1' : 'mt-2.5',
            )}
          >
            {review.comment}
          </p>
        )}
      </div>
    </article>
  );
}

function EmptyState({ canWrite }: { canWrite: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-maison-line-strong bg-white px-6 py-12 text-center dark:bg-maison-panel">
      <StarRating value={0} size={22} className="justify-center" />
      <div className="mt-3 font-serif text-[22px]">No reviews yet</div>
      <p className="mt-1.5 text-[14.5px] text-maison-subtle">
        {canWrite
          ? 'Be the first to share your thoughts.'
          : 'Sign in to be the first to review this piece.'}
      </p>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <section className="mt-[72px] border-t border-maison-line pt-12">
      <Skeleton className="mb-7 h-9 w-56" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="mt-10 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-11 w-11 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
