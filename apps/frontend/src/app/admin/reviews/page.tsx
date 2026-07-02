'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, MessageSquare, Star, Trash2 } from 'lucide-react';
import { Panel } from '@/components/admin/Panel';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewSummaryHeader } from '@/components/admin/ReviewSummaryHeader';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  listAdminReviews,
  getAdminReviewSummary,
  deleteAdminReview,
  replyToReview,
  clearReviewReply,
} from '@/lib/adminReviews';
import type { AdminReview, ReviewSummary } from '@ecommerce/shared-types';

const PAGE_SIZE = 10;
const FILTERS: Array<number | 'ALL'> = ['ALL', 5, 4, 3, 2, 1];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<AdminReview | null>(null);

  const patchRow = (updated: AdminReview) =>
    setReviews((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminReviews({
        rating: filter === 'ALL' ? undefined : filter,
        page,
        limit: PAGE_SIZE,
      });
      setReviews(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  // Catalogue-wide aggregate feeds the summary header and per-rating chip counts.
  const loadSummary = useCallback(() => {
    getAdminReviewSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminReview(pendingDelete.id);
      toast.success('Review removed');
      setPendingDelete(null);
      loadSummary();
      // Step back a page if we just emptied the last one.
      if (reviews.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch {
      toast.error('Could not remove review');
    } finally {
      setDeleting(false);
    }
  };

  const countFor = (f: number | 'ALL') =>
    f === 'ALL' ? (summary?.count ?? 0) : (summary?.distribution[f] ?? 0);

  return (
    <div>
      {/* summary header */}
      <ReviewSummaryHeader summary={summary} />

      {/* rating filter chips */}
      <div className="mb-[22px] flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-[15px] py-[9px] text-[13px] font-semibold transition-all ${
                active
                  ? 'border-maison-ink bg-maison-ink text-white shadow-[0_8px_20px_rgba(33,28,22,0.22)]'
                  : 'border-maison-line-strong bg-white text-maison-muted hover:border-maison-clay hover:text-maison-ink dark:bg-maison-panel'
              }`}
            >
              {f === 'ALL' ? (
                'All ratings'
              ) : (
                <span className="flex items-center gap-0.5">
                  {f}
                  <Star
                    className={`h-3.5 w-3.5 ${active ? 'fill-white text-white' : 'fill-maison-clay text-maison-clay'}`}
                  />
                </span>
              )}
              <span
                className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F2EDE4] text-maison-subtle dark:bg-maison-line'
                }`}
              >
                {countFor(f)}
              </span>
            </button>
          );
        })}
      </div>

      {/* table */}
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-maison-line bg-[#FBF7F1] text-[11.5px] font-bold tracking-[0.8px] text-maison-subtle dark:bg-maison-panel">
                <th scope="col" className="px-[26px] py-4 font-bold">PRODUCT</th>
                <th scope="col" className="px-3 py-4 font-bold">CUSTOMER</th>
                <th scope="col" className="px-3 py-4 font-bold">RATING</th>
                <th scope="col" className="px-3 py-4 font-bold">REVIEW</th>
                <th scope="col" className="px-3 py-4 font-bold">DATE</th>
                <th scope="col" className="px-[26px] py-4 font-bold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2EDE4] dark:border-maison-line">
                    <td colSpan={6} className="px-[26px] py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-maison-panel" />
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-[70px] text-center">
                    <div className="font-serif text-[26px] text-maison-ink">No feedback yet</div>
                    <p className="mt-1.5 text-maison-subtle">
                      {filter === 'ALL'
                        ? 'Customer reviews will appear here once shoppers start rating delivered products.'
                        : 'No reviews match this rating.'}
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#F2EDE4] align-top transition-colors last:border-0 hover:bg-[#FBF7F1] dark:border-maison-line dark:hover:bg-maison-panel"
                  >
                    <td className="px-[26px] py-4 text-[13.5px] font-semibold text-maison-ink">
                      {r.productName}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-maison-ink">
                        {r.authorName}
                        {r.verifiedPurchase && (
                          <BadgeCheck className="h-4 w-4 text-maison-leaf" aria-label="Verified purchase" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <StarRating value={r.rating} size={14} />
                    </td>
                    <td className="max-w-[360px] px-3 py-4">
                      {r.title && <div className="text-sm font-semibold text-maison-ink">{r.title}</div>}
                      {r.comment ? (
                        <p className="mt-0.5 line-clamp-2 text-[13px] text-maison-muted">{r.comment}</p>
                      ) : (
                        !r.title && <span className="text-[13px] text-maison-faint">—</span>
                      )}
                      {r.reply && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border-l-2 border-maison-clay bg-maison-clay/[0.05] px-2.5 py-1.5 text-[12px] text-maison-muted">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-maison-clay-dark" />
                          <span className="line-clamp-2">{r.reply}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-[13.5px] text-maison-muted">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-[26px] py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyTarget(r)}
                          aria-label={`Reply to review by ${r.authorName}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-maison-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-maison-ink transition-colors hover:border-maison-clay hover:text-maison-clay"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {r.reply ? 'Edit reply' : 'Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(r)}
                          aria-label={`Delete review by ${r.authorName}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-maison-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-maison-clay-dark transition-colors hover:border-maison-clay hover:text-maison-clay"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-maison-subtle">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-maison-line-strong bg-white px-4 py-2 font-medium text-maison-ink disabled:opacity-40 dark:bg-maison-panel"
          >
            Next
          </button>
        </div>
      )}

      {/* delete confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogTitle>Delete this review?</DialogTitle>
          <DialogDescription>
            {pendingDelete
              ? `${pendingDelete.authorName}'s review of ${pendingDelete.productName} will be permanently removed and the product's rating recalculated.`
              : ''}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
              className="rounded-full border border-maison-line-strong px-5 py-2.5 text-[13.5px] font-semibold text-maison-ink transition-colors hover:border-maison-ink disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full bg-maison-clay px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-maison-clay/90 disabled:opacity-60"
            >
              {deleting ? 'Removing…' : 'Delete review'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* reply editor */}
      {replyTarget && (
        <ReplyDialog
          key={replyTarget.id}
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSaved={(updated) => {
            patchRow(updated);
            setReplyTarget(null);
          }}
        />
      )}
    </div>
  );
}

function ReplyDialog({
  review,
  onClose,
  onSaved,
}: {
  review: AdminReview;
  onClose: () => void;
  onSaved: (updated: AdminReview) => void;
}) {
  const [text, setText] = useState(review.reply ?? '');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const save = async () => {
    const reply = text.trim();
    if (!reply) return;
    setSaving(true);
    try {
      const updated = await replyToReview(review.id, reply);
      toast.success('Reply posted');
      onSaved(updated);
    } catch {
      toast.error('Could not save reply');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await clearReviewReply(review.id);
      toast.success('Reply removed');
      onSaved({ ...review, reply: null, repliedAt: null });
    } catch {
      toast.error('Could not remove reply');
    } finally {
      setRemoving(false);
    }
  };

  const busy = saving || removing;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{review.reply ? 'Edit reply' : 'Reply to review'}</DialogTitle>
        <DialogDescription>
          Responding to {review.authorName}&apos;s review of {review.productName}
        </DialogDescription>

        {/* the review being replied to, for context */}
        <div className="mt-4 rounded-xl border border-maison-line bg-[#FBF7F1] px-4 py-3 dark:bg-maison-panel">
          <StarRating value={review.rating} size={14} />
          {review.title && (
            <div className="mt-1.5 text-[13.5px] font-semibold text-maison-ink">{review.title}</div>
          )}
          {review.comment && (
            <p className="mt-0.5 text-[13px] leading-relaxed text-maison-muted">{review.comment}</p>
          )}
        </div>

        <div className="mt-4">
          <label
            htmlFor="admin-reply"
            className="mb-2 block text-[12.5px] font-bold uppercase tracking-[.6px] text-maison-muted"
          >
            Your reply
          </label>
          <textarea
            id="admin-reply"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Thank the customer, address their feedback, or clarify."
            className="w-full resize-none rounded-[10px] border border-maison-line-strong bg-white px-3.5 py-2.5 text-[14.5px] leading-relaxed outline-none focus:border-maison-ink dark:bg-maison-cream"
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {review.reply ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="text-[13px] font-semibold text-maison-clay-dark transition-colors hover:text-maison-clay disabled:opacity-60"
            >
              {removing ? 'Removing…' : 'Remove reply'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full border border-maison-line-strong px-5 py-2.5 text-[13.5px] font-semibold text-maison-ink transition-colors hover:border-maison-ink disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !text.trim()}
              className="rounded-full bg-maison-clay px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-maison-clay/90 disabled:opacity-60"
            >
              {saving ? 'Posting…' : 'Post reply'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
