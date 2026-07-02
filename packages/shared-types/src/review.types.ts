export interface Review {
  id: string;
  productId: string;
  /** Reviewer's display name, snapshotted at creation (never their email). */
  authorName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  /** True when the reviewer has a delivered order containing this product. */
  verifiedPurchase: boolean;
  /** The store's public reply to this review; null until an admin responds. */
  reply: string | null;
  /** When the store replied (ISO timestamp), or null. */
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Whether the current customer is allowed to review a product. */
export interface ReviewEligibility {
  /** True once the customer has a delivered order containing this product. */
  canReview: boolean;
}

/** A review as seen by an admin — carries the product it belongs to. */
export interface AdminReview extends Review {
  productName: string;
}

/** A review as seen by its author on their "my reviews" profile page. */
export interface MyReview extends Review {
  productName: string;
  productImageUrl: string | null;
  /** Identifier used to link back to the product page (the product has no separate slug). */
  productSlug: string;
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
