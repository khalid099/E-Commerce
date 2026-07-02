import api from '@/lib/api';
import type {
  Review,
  MyReview,
  ReviewSummary,
  ReviewEligibility,
  CreateReviewDto,
  UpdateReviewDto,
  PaginatedResponse,
  ApiResponse,
} from '@ecommerce/shared-types';

/** The current customer's reviews across all products, most recent first. */
export async function listMyReviews(page = 1, limit = 10): Promise<PaginatedResponse<MyReview>> {
  const res = await api.get<ApiResponse<PaginatedResponse<MyReview>>>('/reviews/mine', {
    params: { page, limit },
  });
  return res.data.data;
}

export async function listProductReviews(
  productId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Review>> {
  const res = await api.get<ApiResponse<PaginatedResponse<Review>>>(
    `/products/${productId}/reviews`,
    { params: { page, limit } },
  );
  return res.data.data;
}

export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const res = await api.get<ApiResponse<ReviewSummary>>(`/products/${productId}/reviews/summary`);
  return res.data.data;
}

/** The current customer's review for this product, or null if they haven't written one. */
export async function getMyProductReview(productId: string): Promise<Review | null> {
  const res = await api.get<ApiResponse<Review | null>>(`/products/${productId}/reviews/mine`);
  return res.data.data;
}

/** Whether the current customer may review this product (requires a delivered order). */
export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  const res = await api.get<ApiResponse<ReviewEligibility>>(
    `/products/${productId}/reviews/eligibility`,
  );
  return res.data.data;
}

export async function createProductReview(
  productId: string,
  dto: CreateReviewDto,
): Promise<Review> {
  const res = await api.post<ApiResponse<Review>>(`/products/${productId}/reviews`, dto);
  return res.data.data;
}

export async function updateMyProductReview(
  productId: string,
  dto: UpdateReviewDto,
): Promise<Review> {
  const res = await api.patch<ApiResponse<Review>>(`/products/${productId}/reviews/mine`, dto);
  return res.data.data;
}

export async function deleteMyProductReview(productId: string): Promise<void> {
  await api.delete(`/products/${productId}/reviews/mine`);
}
