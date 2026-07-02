'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewForm, type ReviewValues } from './ReviewForm';
import { useUiStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/errors';
import {
  getMyProductReview,
  createProductReview,
  updateMyProductReview,
} from '@/lib/reviews';
import type { Review } from '@ecommerce/shared-types';

interface ReviewModalProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a review is created or updated, with the saved review. */
  onSaved?: (review: Review) => void;
}

/**
 * Popup for rating + reviewing a delivered product from the orders page. Reuses the
 * same ReviewForm the product page uses, so a review written here shows up there.
 */
export function ReviewModal({ productId, productName, open, onOpenChange, onSaved }: ReviewModalProps) {
  const showToast = useUiStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Review | null>(null);

  // On open, load any review the customer already left so we prefill and edit
  // rather than hit the "already reviewed" conflict.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMyProductReview(productId)
      .then(setExisting)
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, [open, productId]);

  const handleSubmit = async (values: ReviewValues) => {
    const payload = {
      rating: values.rating,
      title: values.title?.trim() || undefined,
      comment: values.comment?.trim() || undefined,
    };
    try {
      const saved = existing
        ? await updateMyProductReview(productId, payload)
        : await createProductReview(productId, payload);
      showToast(existing ? 'Your review was updated' : 'Thanks for your review');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save your review'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{existing ? 'Edit your review' : 'Write a review'}</DialogTitle>
        <DialogDescription>{productName}</DialogDescription>
        <div className="mt-5">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ReviewForm
              initial={existing}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              embedded
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
