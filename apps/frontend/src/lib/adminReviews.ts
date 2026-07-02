import api from '@/lib/api';
import type {
  AdminReview,
  PaginatedResponse,
  ApiResponse,
  ReviewSummary,
} from '@ecommerce/shared-types';

export interface AdminReviewQuery {
  rating?: number;
  page?: number;
  limit?: number;
}

export async function listAdminReviews(
  query: AdminReviewQuery,
): Promise<PaginatedResponse<AdminReview>> {
  const res = await api.get<ApiResponse<PaginatedResponse<AdminReview>>>('/admin/reviews', {
    params: query,
  });
  return res.data.data;
}

export async function getAdminReviewSummary(): Promise<ReviewSummary> {
  const res = await api.get<ApiResponse<ReviewSummary>>('/admin/reviews/summary');
  return res.data.data;
}

export async function deleteAdminReview(id: string): Promise<void> {
  await api.delete(`/admin/reviews/${id}`);
}

export async function replyToReview(id: string, reply: string): Promise<AdminReview> {
  const res = await api.patch<ApiResponse<AdminReview>>(`/admin/reviews/${id}/reply`, { reply });
  return res.data.data;
}

export async function clearReviewReply(id: string): Promise<void> {
  await api.delete(`/admin/reviews/${id}/reply`);
}
