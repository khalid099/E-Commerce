export interface Review {
  id: string;
  productId: string;
  /** Reviewer's display name, snapshotted at creation (never their email). */
  authorName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  /** True when the reviewer has a non-cancelled order containing this product. */
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate rating breakdown for a product, driving the summary header + bars. */
export interface ReviewSummary {
  /** Mean rating 0–5; 0 when there are no reviews. */
  average: number;
  count: number;
  /** Count of reviews per star (keys "1".."5"). */
  distribution: Record<number, number>;
}

export interface CreateReviewDto {
  rating: number;
  title?: string;
  comment?: string;
}

export type UpdateReviewDto = Partial<CreateReviewDto>;
