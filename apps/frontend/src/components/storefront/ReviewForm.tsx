'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StarRatingInput } from '@/components/ui/StarRating';
import { cn } from '@/lib/utils';
import type { Review } from '@ecommerce/shared-types';

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().max(120, 'Keep the title under 120 characters').optional(),
  comment: z.string().max(2000, 'Keep the review under 2000 characters').optional(),
});
export type ReviewValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  initial: Review | null;
  onSubmit: (values: ReviewValues) => Promise<void>;
  onCancel?: () => void;
  /** When embedded in a dialog, drop the card chrome and heading — the host supplies them. */
  embedded?: boolean;
}

export function ReviewForm({ initial, onSubmit, onCancel, embedded }: ReviewFormProps) {
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
      className={cn(
        !embedded && 'rounded-2xl border border-maison-line bg-white px-6 py-6 dark:bg-maison-panel',
      )}
    >
      {!embedded && (
        <div className="mb-5 font-serif text-[22px]">
          {initial ? 'Edit your review' : 'Write a review'}
        </div>
      )}

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
